import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlanId, PlanLimits } from "@/lib/billing/types";

type PlanRow = {
  id: PlanId;
  name: string;
  price_cents: number;
  max_organizations: number | null;
  max_menu_items: number | null;
  max_users: number | null;
  ai_diagnostics_per_month: number | null;
  history_months: number | null;
  stripe_price_id: string | null;
};

const stripePriceEnvByPlan: Partial<Record<PlanId, string>> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
  agency: "STRIPE_PRICE_AGENCY"
};

export async function listPlans(supabase: SupabaseClient): Promise<PlanLimits[]> {
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id,name,price_cents,max_organizations,max_menu_items,max_users,ai_diagnostics_per_month,history_months,stripe_price_id"
    )
    .eq("active", true)
    .order("price_cents", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as PlanRow[]).map(mapPlan);
}

export async function getPlan(supabase: SupabaseClient, planId: PlanId): Promise<PlanLimits | null> {
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id,name,price_cents,max_organizations,max_menu_items,max_users,ai_diagnostics_per_month,history_months,stripe_price_id"
    )
    .eq("id", planId)
    .single();

  if (error || !data) return null;
  return mapPlan(data as PlanRow);
}

export function resolveStripePriceId(plan: Pick<PlanLimits, "id" | "stripePriceId">): string | null {
  const envName = stripePriceEnvByPlan[plan.id];
  return plan.stripePriceId ?? (envName ? process.env[envName] ?? null : null);
}

function mapPlan(row: PlanRow): PlanLimits {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    maxOrganizations: row.max_organizations,
    maxMenuItems: row.max_menu_items,
    maxUsers: row.max_users,
    aiDiagnosticsPerMonth: row.ai_diagnostics_per_month,
    historyMonths: row.history_months,
    stripePriceId: row.stripe_price_id
  };
}
