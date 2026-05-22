import { badRequest, ok, serverError, unauthorized } from "@/lib/api/http";
import { createStripePortalSession } from "@/lib/billing/stripe";
import { requireOwnedOrganization } from "@/lib/billing/organizations";
import { requireUser } from "@/lib/supabase/server";

type PortalBody = {
  orgId?: string;
};

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = (await request.json()) as PortalBody;
    if (!body.orgId) return badRequest("orgId is required.");

    const { organization, error } = await requireOwnedOrganization(supabase, body.orgId, user.id);
    if (error || !organization) return badRequest(error ?? "Organization was not found.");
    if (!organization.stripe_customer_id) {
      return badRequest("This organization does not have a Stripe customer yet.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const session = await createStripePortalSession({
      customerId: organization.stripe_customer_id,
      returnUrl: `${appUrl}/app?orgId=${organization.id}`
    });

    return ok({ url: session.url, sessionId: session.id });
  } catch (error) {
    return serverError("Could not create billing portal session.", error);
  }
}
