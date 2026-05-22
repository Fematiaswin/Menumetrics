export class PricingInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "PricingInputError";
  }
}

export function calculateMenuPricing() {
  return {
    suggestedPrice: 0,
    foodCost: 0,
    profitMargin: 0,
  };
}

export function calculateIngredientPrice() {
  return {
    impact: 0,
    cost: 0
  };
}