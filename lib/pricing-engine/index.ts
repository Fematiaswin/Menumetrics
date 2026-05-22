import {
  calculateAllocatedFixedExpense,
  calculateBreakEvenUnits,
  calculateHealthScore,
  calculateIdealPrice,
  calculateMinimumPrice,
  calculateNetProfit,
  calculateRealMargin,
  classifyHealthScore
} from "./formulas.js";
import { roundCurrency, roundRate } from "./money.js";
import type {
  IngredientInput,
  IngredientPriceImpactInput,
  IngredientPriceImpactResult,
  IngredientUnit,
  MenuItemPricingInput,
  MenuItemPricingResult,
  MenuPricingInput,
  MenuPricingResult,
  MenuProfitQuadrant,
  RecipeCostBreakdown,
  RecipeInput
} from "./types.js";
import { assertValidMenuPricingInput } from "./validation.js";

export * from "./formulas.js";
export * from "./money.js";
export * from "./types.js";
export * from "./validation.js";

export function calculateMenuPricing(input: MenuPricingInput): MenuPricingResult {
  assertValidMenuPricingInput(input);

  const totalMonthlySalesEstimate = input.menuItems.reduce((sum, item) => sum + item.monthlySalesEstimate, 0);
  const ingredientMap = new Map(input.ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const menuItems = input.menuItems.map((item) =>
    calculateMenuItemPricing(item, {
      ingredients: ingredientMap,
      monthlyFixedExpenses: input.monthlyFixedExpenses,
      totalMonthlySalesEstimate
    })
  );

  return {
    brandName: "MenuMetrics",
    tagline: "descubra quais pratos dão lucro e quais estão queimando dinheiro",
    monthlyFixedExpenses: roundCurrency(input.monthlyFixedExpenses),
    totalMonthlySalesEstimate,
    menuItems,
    averageHealthScore: Math.round(menuItems.reduce((sum, item) => sum + item.healthScore, 0) / menuItems.length),
    totalMonthlyNetProfit: roundCurrency(menuItems.reduce((sum, item) => sum + item.monthlyNetProfit, 0)),
    lossItems: menuItems.filter((item) => item.status === "loss").length,
    attentionItems: menuItems.filter((item) => item.status === "attention").length,
    healthyItems: menuItems.filter((item) => item.status === "healthy").length
  };
}

export function calculateMenuItemPricing(
  menuItem: MenuItemPricingInput,
  context: {
    ingredients: Map<string, IngredientInput>;
    monthlyFixedExpenses: number;
    totalMonthlySalesEstimate: number;
  }
): MenuItemPricingResult {
  const recipeCost = calculateRecipeCost(menuItem.recipe, context.ingredients);
  const taxRate = roundRate(menuItem.taxRate ?? 0);
  const commissionRate = roundRate(menuItem.commissionRate ?? 0);
  const salePercentageRate = roundRate(taxRate + commissionRate);
  const allocatedFixedExpense = calculateAllocatedFixedExpense({
    monthlyFixedExpenses: context.monthlyFixedExpenses,
    productVolumeEstimate: Math.max(menuItem.monthlySalesEstimate, 1),
    totalVolumeEstimate: Math.max(context.totalMonthlySalesEstimate, 1)
  });
  const totalUnitCost = roundCurrency(recipeCost.unitRecipeCost + allocatedFixedExpense);
  const minimumPrice = calculateMinimumPrice({ totalUnitCost, salePercentageRate });
  const idealPrice = calculateIdealPrice({
    totalUnitCost,
    desiredMargin: menuItem.desiredMargin,
    salePercentageRate
  });
  const currentPrice = roundCurrency(menuItem.currentPrice ?? idealPrice);
  const realMargin = calculateRealMargin({ salePrice: currentPrice, totalUnitCost, salePercentageRate });
  const grossProfitPerUnit = roundCurrency(currentPrice - recipeCost.unitRecipeCost - currentPrice * salePercentageRate);
  const monthlyNetProfit = calculateNetProfit({
    salePrice: currentPrice,
    variableCostWithoutFixedExpenses: recipeCost.unitRecipeCost,
    allocatedFixedExpense,
    salePercentageRate,
    volumeEstimate: menuItem.monthlySalesEstimate
  });
  const breakEvenUnits = calculateBreakEvenUnits({
    monthlyFixedExpenses: context.monthlyFixedExpenses,
    salePrice: currentPrice,
    variableCostWithoutFixedExpenses: recipeCost.unitRecipeCost,
    salePercentageRate
  });
  const healthScore = calculateHealthScore({
    realMargin,
    netProfit: monthlyNetProfit,
    minimumPrice,
    salePrice: currentPrice,
    desiredMargin: menuItem.desiredMargin
  });

  return {
    menuItemId: menuItem.id,
    menuItemName: menuItem.name,
    ...(menuItem.category === undefined ? {} : { category: menuItem.category }),
    recipeCost,
    taxRate,
    commissionRate,
    salePercentageRate,
    allocatedFixedExpense,
    totalUnitCost,
    minimumPrice,
    idealPrice,
    currentPrice,
    grossProfitPerUnit,
    realMargin,
    monthlyNetProfit,
    breakEvenUnits,
    healthScore,
    status: classifyHealthScore(healthScore),
    profitQuadrant: classifyProfitQuadrant(realMargin, menuItem.monthlySalesEstimate)
  };
}

export function calculateRecipeCost(
  recipe: RecipeInput,
  ingredients: Map<string, IngredientInput>
): RecipeCostBreakdown {
  const ingredientCost = recipe.items.reduce((sum, item) => {
    const ingredient = ingredients.get(item.ingredientId);
    if (!ingredient) {
      throw new Error(`Unknown ingredient: ${item.ingredientId}`);
    }

    return sum + calculateIngredientUsageCost({
      ingredient,
      quantity: item.quantity,
      unit: item.unit
    });
  }, 0);
  const laborCost = recipe.laborCost ?? 0;
  const packagingCost = recipe.packagingCost ?? 0;
  const totalRecipeCost = roundCurrency(ingredientCost + laborCost + packagingCost);
  const yieldQuantity = recipe.yieldQuantity ?? 1;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    ingredientCost: roundCurrency(ingredientCost),
    laborCost: roundCurrency(laborCost),
    packagingCost: roundCurrency(packagingCost),
    totalRecipeCost,
    unitRecipeCost: roundCurrency(totalRecipeCost / yieldQuantity)
  };
}

export function calculateIngredientUsageCost(params: {
  ingredient: IngredientInput;
  quantity: number;
  unit: IngredientUnit;
}): number {
  const purchaseQuantityInBaseUnit = toBaseUnit(params.ingredient.purchaseQuantity, params.ingredient.purchaseUnit);
  const usageQuantityInBaseUnit = toBaseUnit(params.quantity, params.unit);
  const usableQuantity = purchaseQuantityInBaseUnit * (1 - (params.ingredient.wastePercentage ?? 0));
  const unitCost = params.ingredient.purchasePrice / usableQuantity;

  return roundCurrency(unitCost * usageQuantityInBaseUnit);
}

export function calculateIngredientPriceImpact(input: IngredientPriceImpactInput): IngredientPriceImpactResult {
  const oldInput = replaceIngredientPrice(input.menuPricingInput, input.ingredientId, input.oldPurchasePrice);
  const newInput = replaceIngredientPrice(input.menuPricingInput, input.ingredientId, input.newPurchasePrice);
  const oldPricing = calculateMenuPricing(oldInput);
  const newPricing = calculateMenuPricing(newInput);

  const affectedMenuItems = newPricing.menuItems
    .map((newItem) => {
      const oldItem = oldPricing.menuItems.find((item) => item.menuItemId === newItem.menuItemId);
      if (!oldItem || oldItem.recipeCost.unitRecipeCost === newItem.recipeCost.unitRecipeCost) {
        return null;
      }

      return {
        menuItemId: newItem.menuItemId,
        menuItemName: newItem.menuItemName,
        oldRecipeUnitCost: oldItem.recipeCost.unitRecipeCost,
        newRecipeUnitCost: newItem.recipeCost.unitRecipeCost,
        unitCostIncrease: roundCurrency(newItem.recipeCost.unitRecipeCost - oldItem.recipeCost.unitRecipeCost),
        monthlyProfitImpact: roundCurrency(newItem.monthlyNetProfit - oldItem.monthlyNetProfit)
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    ingredientId: input.ingredientId,
    oldPurchasePrice: roundCurrency(input.oldPurchasePrice),
    newPurchasePrice: roundCurrency(input.newPurchasePrice),
    priceVariationPercentage: roundRate((input.newPurchasePrice - input.oldPurchasePrice) / input.oldPurchasePrice),
    affectedMenuItems,
    totalMonthlyProfitImpact: roundCurrency(
      affectedMenuItems.reduce((sum, item) => sum + item.monthlyProfitImpact, 0)
    )
  };
}

function classifyProfitQuadrant(realMargin: number, monthlySalesEstimate: number): MenuProfitQuadrant {
  const highMargin = realMargin >= 0.3;
  const highSales = monthlySalesEstimate >= 50;

  if (highMargin && highSales) return "high_margin_high_sales";
  if (!highMargin && highSales) return "high_sales_low_margin";
  if (!highMargin && !highSales) return "low_sales_low_margin";
  return "high_margin_low_sales";
}

function replaceIngredientPrice(input: MenuPricingInput, ingredientId: string, purchasePrice: number): MenuPricingInput {
  return {
    ...input,
    ingredients: input.ingredients.map((ingredient) =>
      ingredient.id === ingredientId ? { ...ingredient, purchasePrice } : ingredient
    )
  };
}

function toBaseUnit(quantity: number, unit: IngredientUnit): number {
  if (unit === "kg" || unit === "l") return quantity * 1000;
  return quantity;
}
