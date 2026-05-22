const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripeCustomer = {
  id: string;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

export type StripePortalSession = {
  id: string;
  url: string;
};

export async function createStripeCustomer(input: {
  email?: string | null;
  name: string;
  orgId: string;
}): Promise<StripeCustomer> {
  const params = new URLSearchParams();
  params.set("name", input.name);
  params.set("metadata[orgId]", input.orgId);
  if (input.email) params.set("email", input.email);

  return stripeRequest<StripeCustomer>("/customers", params);
}

export async function createStripeCheckoutSession(input: {
  customerId: string;
  priceId: string;
  orgId: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeCheckoutSession> {
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("customer", input.customerId);
  params.set("client_reference_id", input.orgId);
  params.set("line_items[0][price]", input.priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", input.successUrl);
  params.set("cancel_url", input.cancelUrl);
  params.set("metadata[orgId]", input.orgId);
  params.set("metadata[plan]", input.plan);
  params.set("subscription_data[metadata][orgId]", input.orgId);
  params.set("subscription_data[metadata][plan]", input.plan);

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", params);
}

export async function createStripePortalSession(input: {
  customerId: string;
  returnUrl: string;
}): Promise<StripePortalSession> {
  const params = new URLSearchParams();
  params.set("customer", input.customerId);
  params.set("return_url", input.returnUrl);

  return stripeRequest<StripePortalSession>("/billing_portal/sessions", params);
}

async function stripeRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe request failed with status ${response.status}.`);
  }

  return data;
}
