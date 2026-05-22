import type { IngredientInput, MenuPricingInput, MenuItemPricingInput, RecipeInput } from "./types.js";

export class PricingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingInputError";
  }
}

export function assertValidMenuPricingInput(input: MenuPricingInput): void {
  assertFiniteNonNegative(input.monthlyFixedExpenses, "monthlyFixedExpenses");

  if (!Array.isArray(input.ingredients) || input.ingredients.length === 0) {
    throw new PricingInputError("At least one ingredient is required.");
  }

  if (!Array.isArray(input.menuItems) || input.menuItems.length === 0) {
    throw new PricingInputError("At least one menu item is required.");
  }

  const ingredientIds = new Set<string>();
  for (const ingredient of input.ingredients) {
    assertValidIngredient(ingredient);
    ingredientIds.add(ingredient.id);
  }

  for (const menuItem of input.menuItems) {
    assertValidMenuItem(menuItem, ingredientIds);
  }
}

export function assertValidIngredient(ingredient: IngredientInput): void {
  if (!ingredient.id.trim()) {
    throw new PricingInputError("Ingredient id is required.");
  }

  if (!ingredient.name.trim()) {
    throw new PricingInputError(`Ingredient ${ingredient.id} must have a name.`);
  }

  assertFinitePositive(ingredient.purchaseQuantity, `${ingredient.name}.purchaseQuantity`);
  assertFiniteNonNegative(ingredient.purchasePrice, `${ingredient.name}.purchasePrice`);
  assertFiniteNonNegative(ingredient.wastePercentage ?? 0, `${ingredient.name}.wastePercentage`);

  if ((ingredient.wastePercentage ?? 0) >= 1) {
    throw new PricingInputError(`${ingredient.name}.wastePercentage must be lower than 1.`);
  }
}

export function assertValidRecipe(recipe: RecipeInput, ingredientIds: Set<string>): void {
  if (!recipe.id.trim()) {
    throw new PricingInputError("Recipe id is required.");
  }

  if (!recipe.name.trim()) {
    throw new PricingInputError(`Recipe ${recipe.id} must have a name.`);
  }

  assertFinitePositive(recipe.yieldQuantity ?? 1, `${recipe.name}.yieldQuantity`);
  assertFiniteNonNegative(recipe.laborCost ?? 0, `${recipe.name}.laborCost`);
  assertFiniteNonNegative(recipe.packagingCost ?? 0, `${recipe.name}.packagingCost`);

  if (recipe.items.length === 0) {
    throw new PricingInputError(`${recipe.name} must have at least one ingredient.`);
  }

  for (const item of recipe.items) {
    if (!ingredientIds.has(item.ingredientId)) {
      throw new PricingInputError(`${recipe.name} references an unknown ingredient: ${item.ingredientId}.`);
    }
    assertFinitePositive(item.quantity, `${recipe.name}.recipeItem.quantity`);
  }
}

export function assertValidMenuItem(menuItem: MenuItemPricingInput, ingredientIds: Set<string>): void {
  if (!menuItem.id.trim()) {
    throw new PricingInputError("Menu item id is required.");
  }

  if (!menuItem.name.trim()) {
    throw new PricingInputError(`Menu item ${menuItem.id} must have a name.`);
  }

  assertValidRecipe(menuItem.recipe, ingredientIds);
  assertFiniteNonNegative(menuItem.desiredMargin, `${menuItem.name}.desiredMargin`);
  assertFiniteNonNegative(menuItem.taxRate ?? 0, `${menuItem.name}.taxRate`);
  assertFiniteNonNegative(menuItem.commissionRate ?? 0, `${menuItem.name}.commissionRate`);

  if (menuItem.desiredMargin >= 1) {
    throw new PricingInputError(`${menuItem.name}.desiredMargin must be lower than 1.`);
  }

  if ((menuItem.taxRate ?? 0) >= 1 || (menuItem.commissionRate ?? 0) >= 1) {
    throw new PricingInputError(`${menuItem.name} tax and commission rates must be lower than 1.`);
  }

  if (menuItem.desiredMargin + (menuItem.taxRate ?? 0) + (menuItem.commissionRate ?? 0) >= 1) {
    throw new PricingInputError(`${menuItem.name} desired margin plus rates must be lower than 1.`);
  }

  if (menuItem.currentPrice !== undefined) {
    assertFiniteNonNegative(menuItem.currentPrice, `${menuItem.name}.currentPrice`);
  }

  if (!Number.isInteger(menuItem.monthlySalesEstimate) || menuItem.monthlySalesEstimate < 0) {
    throw new PricingInputError(`${menuItem.name}.monthlySalesEstimate must be a non-negative integer.`);
  }
}

export function assertSolvableRate(rate: number, label: string): void {
  if (rate >= 1) {
    throw new PricingInputError(`${label} must be lower than 1.`);
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new PricingInputError(`${label} must be a finite positive number.`);
  }
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new PricingInputError(`${label} must be a finite non-negative number.`);
  }
}
