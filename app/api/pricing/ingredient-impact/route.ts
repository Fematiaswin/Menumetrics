import {
  PricingInputError,
  calculateIngredientPriceImpact,
  calculateMenuPricing
} from "@/lib/pricing-engine/index.js";
import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { loadMenuPricingInput } from "@/lib/menu-metrics/menu-pricing-data";
import { requireUser } from "@/lib/supabase/server";

type ImpactBody = {
  orgId: string;
  ingredientId: string;
  newPurchasePrice: number;
};

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<ImpactBody>(request);
    if (!body.orgId || !body.ingredientId || body.newPurchasePrice === undefined) {
      return badRequest("orgId, ingredientId and newPurchasePrice are required.");
    }

    const input = await loadMenuPricingInput(supabase, body.orgId);
    const ingredient = input.ingredients.find((item) => item.id === body.ingredientId);
    if (!ingredient) return badRequest("Ingredient not found in this organization.");

    const impact = calculateIngredientPriceImpact({
      ingredientId: body.ingredientId,
      oldPurchasePrice: ingredient.purchasePrice,
      newPurchasePrice: body.newPurchasePrice,
      menuPricingInput: input
    });

    const currentPricing = calculateMenuPricing(input);

    return ok({
      currentPricing,
      impact
    });
  } catch (error) {
    if (error instanceof PricingInputError) {
      return badRequest(error.message);
    }

    return serverError("Could not calculate ingredient impact.", error);
  }
}
