import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanId, SubscriptionStatus } from "@/lib/billing/types";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type StripeSubscriptionObject = {
  id: string;
  customer?: string;
  status?: SubscriptionStatus;
  metadata?: Record<string, string>;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
  trial_end?: number | null;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
};

type StripeCheckoutSessionObject = {
  id: string;
  customer?: string;
  subscription?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
};

const webhookToleranceSeconds = 300;

export async function verifyStripeWebhook(payload: string, signatureHeader: string | null): Promise<StripeEvent> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }

  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header.");
  }

  const parts = parseSignatureHeader(signatureHeader);
  const timestamp = parts.get("t");
  const expectedSignature = parts.get("v1");
  if (!timestamp || !expectedSignature) {
    throw new Error("Invalid Stripe-Signature header.");
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > webhookToleranceSeconds) {
    throw new Error("Stripe webhook timestamp is outside tolerance.");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const signature = await hmacSha256(webhookSecret, signedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) {
    throw new Error("Invalid Stripe webhook signature.");
  }

  return JSON.parse(payload) as StripeEvent;
}

export async function processStripeWebhook(supabase: SupabaseClient, event: StripeEvent): Promise<void> {
  const object = event.data.object;

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(supabase, object as StripeCheckoutSessionObject);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(supabase, object as StripeSubscriptionObject);
  }
}

export async function registerBillingEvent(
  supabase: SupabaseClient,
  event: StripeEvent
): Promise<"created" | "duplicate"> {
  const orgId = extractOrgId(event.data.object);
  const { error } = await supabase.from("billing_events").insert({
    org_id: orgId,
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event
  });

  if (!error) return "created";
  if ("code" in error && error.code === "23505") {
    const { data } = await supabase
      .from("billing_events")
      .select("processed_at")
      .eq("stripe_event_id", event.id)
      .single();

    return (data as { processed_at?: string | null } | null)?.processed_at ? "duplicate" : "created";
  }
  throw error;
}

export async function markBillingEventProcessed(supabase: SupabaseClient, eventId: string): Promise<void> {
  await supabase
    .from("billing_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("stripe_event_id", eventId);
}

async function handleCheckoutCompleted(supabase: SupabaseClient, session: StripeCheckoutSessionObject) {
  const orgId = session.metadata?.orgId ?? session.client_reference_id;
  const plan = session.metadata?.plan as PlanId | undefined;
  if (!orgId) return;

  const patch: Record<string, unknown> = {};
  if (session.customer) patch.stripe_customer_id = session.customer;
  if (plan) patch.plan = plan;

  if (Object.keys(patch).length > 0) {
    await supabase.from("organizations").update(patch).eq("id", orgId);
  }
}

async function syncSubscription(supabase: SupabaseClient, subscription: StripeSubscriptionObject) {
  const orgId = subscription.metadata?.orgId ?? (await findOrgIdByCustomer(supabase, subscription.customer));
  if (!orgId) return;

  const stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const plan = (subscription.metadata?.plan as PlanId | undefined) ?? (await findPlanByPriceId(supabase, stripePriceId));
  if (!plan) return;

  await supabase.from("subscriptions").upsert(
    {
      org_id: orgId,
      plan,
      stripe_subscription_id: subscription.id,
      stripe_price_id: stripePriceId,
      status: subscription.status ?? "active",
      current_period_start: epochToIso(subscription.current_period_start),
      current_period_end: epochToIso(subscription.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: epochToIso(subscription.canceled_at),
      trial_end: epochToIso(subscription.trial_end)
    },
    { onConflict: "org_id" }
  );

  const organizationPlan = subscription.status === "active" || subscription.status === "trialing" ? plan : "free";
  await supabase
    .from("organizations")
    .update({
      plan: organizationPlan,
      ...(subscription.customer ? { stripe_customer_id: subscription.customer } : {})
    })
    .eq("id", orgId);
}

async function findOrgIdByCustomer(supabase: SupabaseClient, customerId?: string): Promise<string | null> {
  if (!customerId) return null;

  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  return (data as { id?: string } | null)?.id ?? null;
}

async function findPlanByPriceId(supabase: SupabaseClient, priceId: string | null): Promise<PlanId | null> {
  if (!priceId) return null;

  const envMatch = (
    [
      ["starter", process.env.STRIPE_PRICE_STARTER],
      ["pro", process.env.STRIPE_PRICE_PRO],
      ["agency", process.env.STRIPE_PRICE_AGENCY]
    ] as Array<[PlanId, string | undefined]>
  ).find(([, value]) => value === priceId);

  if (envMatch) return envMatch[0];

  const { data } = await supabase.from("plans").select("id").eq("stripe_price_id", priceId).single();
  return (data as { id?: PlanId } | null)?.id ?? null;
}

function extractOrgId(object: Record<string, unknown>): string | null {
  const metadata = object.metadata as Record<string, string> | undefined;
  return metadata?.orgId ?? (typeof object.client_reference_id === "string" ? object.client_reference_id : null);
}

function epochToIso(value?: number | null): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

function parseSignatureHeader(signatureHeader: string): Map<string, string> {
  const parts = new Map<string, string>();

  for (const part of signatureHeader.split(",")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    parts.set(part.slice(0, separatorIndex), part.slice(separatorIndex + 1));
  }

  return parts;
}

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}
