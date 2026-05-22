import type { SupabaseClient } from "@supabase/supabase-js";

import { getPlan } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/types";

type OrganizationPlanRow = {
  plan: PlanId;
};

export async function assertCanCreateMenuItem(supabase: SupabaseClient, orgId: string): Promise<string | null> {
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();

  if (orgError || !organization) {
    return "Organizacao nao encontrada.";
  }

  const plan = await getPlan(supabase, (organization as OrganizationPlanRow).plan);
  if (!plan?.maxMenuItems) return null;

  const { count, error: countError } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("active", true);

  if (countError) return "Nao foi possivel verificar o limite do plano.";
  if ((count ?? 0) >= plan.maxMenuItems) {
    return `Seu plano permite ate ${plan.maxMenuItems} pratos. Faca upgrade para cadastrar mais.`;
  }

  return null;
}

export async function assertCanGenerateAiDiagnostic(supabase: SupabaseClient, orgId: string): Promise<string | null> {
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();

  if (orgError || !organization) {
    return "Organizacao nao encontrada.";
  }

  const plan = await getPlan(supabase, (organization as OrganizationPlanRow).plan);
  if (!plan) return "Plano nao encontrado.";
  if (plan.aiDiagnosticsPerMonth === null) return null;
  if (plan.aiDiagnosticsPerMonth <= 0) {
    return "Seu plano atual nao inclui diagnosticos de IA.";
  }

  const periodStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const { count, error: countError } = await supabase
    .from("ai_diagnostics")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", periodStart);

  if (countError) return "Nao foi possivel verificar o limite de diagnosticos.";
  if ((count ?? 0) >= plan.aiDiagnosticsPerMonth) {
    return `Seu plano permite ${plan.aiDiagnosticsPerMonth} diagnostico(s) de IA por mes.`;
  }

  return null;
}
