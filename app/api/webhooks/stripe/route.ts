import { badRequest, ok, serverError } from "@/lib/api/http";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  markBillingEventProcessed,
  processStripeWebhook,
  registerBillingEvent,
  verifyStripeWebhook
} from "@/lib/billing/stripe-webhooks";

export async function POST(request: Request) {
  const payload = await request.text();

  try {
    const event = await verifyStripeWebhook(payload, request.headers.get("stripe-signature"));
    const supabase = createServiceSupabaseClient();
    const billingEvent = await registerBillingEvent(supabase, event);

    if (billingEvent === "duplicate") {
      return ok({ received: true, duplicate: true });
    }

    await processStripeWebhook(supabase, event);
    await markBillingEventProcessed(supabase, event.id);
    return ok({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";
    if (message.includes("signature") || message.includes("STRIPE_WEBHOOK_SECRET")) {
      return badRequest(message);
    }

    return serverError("Could not process Stripe webhook.", error);
  }
}
