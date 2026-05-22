import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  IngredientInput,
  IngredientUnit,
  MenuItemPricingInput,
  MenuPricingInput,
  RecipeInput
} from "@/lib/pricing-engine/index.js";

type DbIngredient = {
  id: string;
  name: string;
  purchase_unit: IngredientUnit;
  purchase_quantity: number | string;
  purchase_price: number | string;
  waste_percentage: number | string;
};

type DbRecipe = {
  id: string;
  name: string;
  yield_quantity: number | string;
  yield_unit: IngredientUnit;
  labor_cost: number | string;
  packaging_cost: number | string;
};

type DbRecipeItem = {
  recipe_id: string;
  ingredient_id: string;
  quantity: number | string;
  unit: IngredientUnit;
};

type DbMenuItem = {
  id: string;
  name: string;
  category: string | null;
  recipe_id: string | null;
  current_price: number | string;
  tax_rate: number | string;
  commission_rate: number | string;
};

type DbPricingConfig = {
  menu_item_id: string;
  desired_margin: number | string;
  price_override: number | string | null;
};

type DbSalesEstimate = {
  menu_item_id: string;
  units_sold: number;
};

type DbFixedExpense = {
  amount: number | string;
  period: "monthly" | "yearly" | "one_time";
};

export async function loadMenuPricingInput(
  supabase: SupabaseClient,
  orgId: string
): Promise<MenuPricingInput> {
  const [
    ingredientsResult,
    recipesResult,
    recipeItemsResult,
    menuItemsResult,
    pricingConfigsResult,
    salesEstimatesResult,
    fixedExpensesResult
  ] = await Promise.all([
    supabase.from("ingredients").select("id,name,purchase_unit,purchase_quantity,purchase_price,waste_percentage").eq("org_id", orgId).eq("active", true),
    supabase.from("recipes").select("id,name,yield_quantity,yield_unit,labor_cost,packaging_cost").eq("org_id", orgId).eq("active", true),
    supabase.from("recipe_items").select("recipe_id,ingredient_id,quantity,unit"),
    supabase.from("menu_items").select("id,name,category,recipe_id,current_price,tax_rate,commission_rate").eq("org_id", orgId).eq("active", true),
    supabase.from("pricing_configs").select("menu_item_id,desired_margin,price_override"),
    supabase.from("menu_item_sales_estimates").select("menu_item_id,units_sold"),
    supabase.from("fixed_expenses").select("amount,period").eq("org_id", orgId).eq("active", true)
  ]);

  for (const result of [
    ingredientsResult,
    recipesResult,
    recipeItemsResult,
    menuItemsResult,
    pricingConfigsResult,
    salesEstimatesResult,
    fixedExpensesResult
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  const ingredients = ((ingredientsResult.data ?? []) as DbIngredient[]).map(mapIngredient);
  const recipes = new Map(((recipesResult.data ?? []) as DbRecipe[]).map((recipe) => [recipe.id, mapRecipe(recipe)]));
  const recipeItems = (recipeItemsResult.data ?? []) as DbRecipeItem[];
  const pricingConfigs = new Map(
    ((pricingConfigsResult.data ?? []) as DbPricingConfig[]).map((config) => [config.menu_item_id, config])
  );
  const salesEstimates = (salesEstimatesResult.data ?? []) as DbSalesEstimate[];
  const menuItems = ((menuItemsResult.data ?? []) as DbMenuItem[])
    .filter((menuItem) => menuItem.recipe_id !== null && recipes.has(menuItem.recipe_id))
    .map((menuItem) => {
      const recipe = recipes.get(menuItem.recipe_id as string) as RecipeInput;
      recipe.items = recipeItems
        .filter((item) => item.recipe_id === recipe.id)
        .map((item) => ({
          ingredientId: item.ingredient_id,
          quantity: Number(item.quantity),
          unit: item.unit
        }));

      return mapMenuItem(menuItem, recipe, pricingConfigs.get(menuItem.id), salesEstimates);
    });

  return {
    ingredients,
    menuItems,
    monthlyFixedExpenses: calculateMonthlyFixedExpenses((fixedExpensesResult.data ?? []) as DbFixedExpense[])
  };
}

function mapIngredient(ingredient: DbIngredient): IngredientInput {
  return {
    id: ingredient.id,
    name: ingredient.name,
    purchaseUnit: ingredient.purchase_unit,
    purchaseQuantity: Number(ingredient.purchase_quantity),
    purchasePrice: Number(ingredient.purchase_price),
    wastePercentage: Number(ingredient.waste_percentage)
  };
}

function mapRecipe(recipe: DbRecipe): RecipeInput {
  return {
    id: recipe.id,
    name: recipe.name,
    yieldQuantity: Number(recipe.yield_quantity),
    yieldUnit: recipe.yield_unit,
    laborCost: Number(recipe.labor_cost),
    packagingCost: Number(recipe.packaging_cost),
    items: []
  };
}

function mapMenuItem(
  menuItem: DbMenuItem,
  recipe: RecipeInput,
  pricingConfig: DbPricingConfig | undefined,
  salesEstimates: DbSalesEstimate[]
): MenuItemPricingInput {
  const currentPrice =
    pricingConfig?.price_override === null || pricingConfig?.price_override === undefined
      ? Number(menuItem.current_price)
      : Number(pricingConfig.price_override);

  return {
    id: menuItem.id,
    name: menuItem.name,
    ...(menuItem.category === null ? {} : { category: menuItem.category }),
    recipe,
    desiredMargin: Number(pricingConfig?.desired_margin ?? 0.3),
    currentPrice,
    taxRate: Number(menuItem.tax_rate),
    commissionRate: Number(menuItem.commission_rate),
    monthlySalesEstimate: salesEstimates
      .filter((estimate) => estimate.menu_item_id === menuItem.id)
      .reduce((sum, estimate) => sum + estimate.units_sold, 0)
  };
}

function calculateMonthlyFixedExpenses(expenses: DbFixedExpense[]): number {
  return expenses.reduce((sum, expense) => {
    const amount = Number(expense.amount);
    if (expense.period === "yearly") {
      return sum + amount / 12;
    }

    if (expense.period === "monthly") {
      return sum + amount;
    }

    return sum;
  }, 0);
}
