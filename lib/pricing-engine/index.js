export class PricingInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "PricingInputError";
  }
}

export function calculateMenuPricing(input = {}) {
  return {
    suggestedPrice: 0,
    foodCost: 0,
    profitMargin: 0,
    input,
  };
}

export function calculateIngredientPriceImpact(input = {}) {
  return {
    impact: 0,
    cost: 0,
    percentage: 0,
    input,
  };
}