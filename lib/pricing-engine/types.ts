export type IngredientUnit = "g" | "kg" | "ml" | "l" | "un" | "portion";
export type PricingStatus = "healthy" | "attention" | "loss";
export type MenuProfitQuadrant =
  | "high_margin_high_sales"
  | "high_sales_low_margin"
  | "low_sales_low_margin"
  | "high_margin_low_sales";

export interface IngredientInput {
  id: string;
  name: string;
  purchaseUnit: IngredientUnit;
  purchaseQuantity: number;
  purchasePrice: number;
  wastePercentage?: number;
}

export interface RecipeItemInput {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface RecipeInput {
  id: string;
  name: string;
  yieldQuantity?: number;
  yieldUnit?: IngredientUnit;
  laborCost?: number;
  packagingCost?: number;
  items: RecipeItemInput[];
}

export interface MenuItemPricingInput {
  id: string;
  name: string;
  category?: string;
  recipe: RecipeInput;
  desiredMargin: number;
  currentPrice?: number;
  taxRate?: number;
  commissionRate?: number;
  monthlySalesEstimate: number;
}

export interface MenuPricingInput {
  menuItems: MenuItemPricingInput[];
  ingredients: IngredientInput[];
  monthlyFixedExpenses: number;
}

export interface RecipeCostBreakdown {
  recipeId: string;
  recipeName: string;
  ingredientCost: number;
  laborCost: number;
  packagingCost: number;
  totalRecipeCost: number;
  unitRecipeCost: number;
}

export interface MenuItemPricingResult {
  menuItemId: string;
  menuItemName: string;
  category?: string;
  recipeCost: RecipeCostBreakdown;
  taxRate: number;
  commissionRate: number;
  salePercentageRate: number;
  allocatedFixedExpense: number;
  totalUnitCost: number;
  minimumPrice: number;
  idealPrice: number;
  currentPrice: number;
  grossProfitPerUnit: number;
  realMargin: number;
  monthlyNetProfit: number;
  breakEvenUnits: number | null;
  healthScore: number;
  status: PricingStatus;
  profitQuadrant: MenuProfitQuadrant;
}

export interface MenuPricingResult {
  brandName: "MenuMetrics";
  tagline: "descubra quais pratos dão lucro e quais estão queimando dinheiro";
  monthlyFixedExpenses: number;
  totalMonthlySalesEstimate: number;
  menuItems: MenuItemPricingResult[];
  averageHealthScore: number;
  totalMonthlyNetProfit: number;
  lossItems: number;
  attentionItems: number;
  healthyItems: number;
}

export interface IngredientPriceImpactInput {
  ingredientId: string;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  menuPricingInput: MenuPricingInput;
}

export interface IngredientPriceImpactResult {
  ingredientId: string;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  priceVariationPercentage: number;
  affectedMenuItems: Array<{
    menuItemId: string;
    menuItemName: string;
    oldRecipeUnitCost: number;
    newRecipeUnitCost: number;
    unitCostIncrease: number;
    monthlyProfitImpact: number;
  }>;
  totalMonthlyProfitImpact: number;
}
