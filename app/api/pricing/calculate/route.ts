import { PricingInputError, calculateMenuPricing } from "@/lib/pricing-engine/index.js";
import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { loadMenuPricingInput } from "@/lib/menu-metrics/menu-pricing-data";
import { requireUser } from "@/lib/supabase/server";

type CalculateBody = {
  orgId?: string;
  saveSnapshots?: boolean;
  input?: Parameters<typeof calculateMenuPricing>[0];
};

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<CalculateBody>(request);
    if (!body.orgId && !body.input) {
      return badRequest("Send orgId to calculate from database or input to calculate from payload.");
    }

    const input = body.input ?? (await loadMenuPricingInput(supabase, body.orgId as string));
    const result = calculateMenuPricing(input);

    if (body.saveSnapshots && body.orgId) {
      const snapshots = result.menuItems.map((item) => ({
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

      const { error } = await supabase.from("pricing_snapshots").insert(snapshots);
      if (error) return serverError("Pricing was calculated, but snapshots could not be saved.", error);

      return created({ pricing: result, snapshotsCreated: snapshots.length });
    }

    return ok({ pricing: result });
  } catch (error) {
    if (error instanceof PricingInputError) {
      return badRequest(error.message);
    }

    return serverError("Could not calculate menu pricing.", error);
  }
}
