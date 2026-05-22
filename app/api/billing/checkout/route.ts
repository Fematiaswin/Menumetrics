import { badRequest, ok, serverError, unauthorized } from "@/lib/api/http";
import { createStripeCheckoutSession, createStripeCustomer } from "@/lib/billing/stripe";
import { getPlan, resolveStripePriceId } from "@/lib/billing/plans";
import { requireOwnedOrganization } from "@/lib/billing/organizations";
import { requireUser } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { PlanId } from "@/lib/billing/types";

type CheckoutBody = {
  orgId?: string;
  plan?: PlanId;
};

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as CheckoutBody;
    if (!body.orgId || !body.plan) return badRequest("orgId and plan are required.");
    if (!isPaidPlan(body.plan)) return badRequest("Choose starter, pro or agency for checkout.");

    const { organization, error } = await requireOwnedOrganization(supabase, body.orgId, user.id);
    if (error || !organization) return badRequest(error ?? "Organization was not found.");

    const plan = await getPlan(supabase, body.plan);
    if (!plan) return badRequest("Plan was not found.");

    const priceId = resolveStripePriceId(plan);
    if (!priceId) return badRequest("Stripe price ID is not configured for this plan.");

    const serviceSupabase = createServiceSupabaseClient();
    const customerId =
      organization.stripe_customer_id ??
      (
        await createStripeCustomer({
          name: organization.name,
          orgId: organization.id,
          ...(user.email === undefined ? {} : { email: user.email })
        })
      ).id;

    if (!organization.stripe_customer_id) {
      await serviceSupabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", organization.id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const session = await createStripeCheckoutSession({
      customerId,
      priceId,
      orgId: organization.id,
      plan: plan.id,
      successUrl: `${appUrl}/app?orgId=${organization.id}&billing=success`,
      cancelUrl: `${appUrl}/app?orgId=${organization.id}&billing=cancelled`
    });

    return ok({ url: session.url, sessionId: session.id });
  } catch (error) {
    return serverError("Could not create checkout session.", error);
  }
}

function isPaidPlan(plan: string): plan is Exclude<PlanId, "free"> {
  return plan === "starter" || plan === "pro" || plan === "agency";
}
