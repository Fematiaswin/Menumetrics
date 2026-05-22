export type PlanId = "free" | "starter" | "pro" | "agency";

export type PlanLimits = {
  id: PlanId;
  name: string;
  priceCents: number;
  maxOrganizations: number | null;
  maxMenuItems: number | null;
  maxUsers: number | null;
  aiDiagnosticsPerMonth: number | null;
  historyMonths: number | null;
  stripePriceId: string | null;
};

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";
