import { PricingInputError, calculateMenuPricing } from "@/lib/pricing-engine/index.js";
import { AI_DIAGNOSTIC_PROMPT_VERSION } from "@/lib/ai/types";
import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { assertCanGenerateAiDiagnostic } from "@/lib/billing/limits";
import { generateFinancialDiagnostic } from "@/lib/ai/openai-diagnostics";
import { loadMenuPricingInput } from "@/lib/menu-metrics/menu-pricing-data";
import { requireUser } from "@/lib/supabase/server";

type DiagnosticBody = {
  orgId?: string;
  saveSnapshots?: boolean;
};

type OrganizationRow = {
  id: string;
  name: string;
  sector: string | null;
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const orgId = searchParams.get("orgId");
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("ai_diagnostics")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return serverError("Could not load AI diagnostics.", error);
  return ok({ diagnostics: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<DiagnosticBody>(request);
    if (!body.orgId) return badRequest("orgId is required.");

    const limitError = await assertCanGenerateAiDiagnostic(supabase, body.orgId);
    if (limitError) return badRequest(limitError);

    const { data: organizationData, error: organizationError } = await supabase
      .from("organizations")
      .select("id,name,sector")
      .eq("id", body.orgId)
      .single();

    if (organizationError || !organizationData) {
      return badRequest("Organization was not found or is not accessible.");
    }

    const organization = organizationData as OrganizationRow;
    const input = await loadMenuPricingInput(supabase, organization.id);
    const pricing = calculateMenuPricing(input);
    const snapshotIds = body.saveSnapshots === false ? [] : await savePricingSnapshots(supabase, pricing);

    const aiResult = await generateFinancialDiagnostic({
      organization,
      pricing
    });

    const { data: diagnosticData, error: diagnosticError } = await supabase
      .from("ai_diagnostics")
      .insert({
        org_id: organization.id,
        snapshot_ids: snapshotIds,
        diagnosis_text: aiResult.diagnostic.diagnosisText,
        suggestions: aiResult.diagnostic.suggestions,
        severity: aiResult.diagnostic.severity,
        model: aiResult.model,
        prompt_version: AI_DIAGNOSTIC_PROMPT_VERSION,
        created_by: user.id
      })
      .select()
      .single();

    if (diagnosticError) {
      return serverError("Diagnostic was generated, but could not be saved.", diagnosticError);
    }

    await saveUsageEvent(supabase, {
      orgId: organization.id,
      userId: user.id,
      diagnosticId: diagnosticData.id as string,
      model: aiResult.model,
      ...(aiResult.usage?.inputTokens === undefined ? {} : { inputTokens: aiResult.usage.inputTokens }),
      ...(aiResult.usage?.outputTokens === undefined ? {} : { outputTokens: aiResult.usage.outputTokens })
    });

    return created({
      diagnostic: diagnosticData,
      generated: aiResult.diagnostic,
      pricing,
      fallback: aiResult.fallback,
      snapshotsCreated: snapshotIds.length
    });
  } catch (error) {
    if (error instanceof PricingInputError) {
      return badRequest(error.message);
    }

    return serverError("Could not generate AI diagnostic.", error);
  }
}

async function savePricingSnapshots(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  pricing: ReturnType<typeof calculateMenuPricing>
): Promise<string[]> {
  const snapshots = pricing.menuItems.map((item) => ({
    menu_item_id: item.menuItemId,
    recipe_cost: item.recipeCost.ingredientCost,
    labor_cost: item.recipeCost.laborCost,
    packaging_cost: item.recipeCost.packagingCost,
    allocated_fixed_expense: item.allocatedFixedExpense,
    total_unit_cost: item.totalUnitCost,
    minimum_price: item.minimumPrice,
    ideal_price: item.idealPrice,
    sale_price: item.currentPrice,
    real_margin: item.realMargin,
    gross_profit_per_unit: item.grossProfitPerUnit,
    net_profit: item.monthlyNetProfit,
    break_even_units: item.breakEvenUnits,
    health_score: item.healthScore,
    status: item.status,
    profit_quadrant: item.profitQuadrant,
    formula_version: "menumetrics-v1",
    inputs: item
  }));

  if (snapshots.length === 0) return [];

  const { data, error } = await supabase.from("pricing_snapshots").insert(snapshots).select("id");
  if (error) return [];

  return ((data ?? []) as Array<{ id: string }>).map((snapshot) => snapshot.id);
}

async function saveUsageEvent(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  usage: {
    orgId: string;
    userId: string;
    diagnosticId: string;
    model: string | null;
    inputTokens?: number;
    outputTokens?: number;
  }
) {
  if (!usage.model || (usage.inputTokens === undefined && usage.outputTokens === undefined)) {
    return;
  }

  await supabase.from("ai_usage_events").insert({
    org_id: usage.orgId,
    user_id: usage.userId,
    diagnostic_id: usage.diagnosticId,
    model: usage.model,
    input_tokens: usage.inputTokens ?? null,
    output_tokens: usage.outputTokens ?? null,
    estimated_cost_cents: null
  });
}
