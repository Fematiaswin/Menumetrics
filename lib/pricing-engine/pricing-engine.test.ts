import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PricingInputError,
  calculateIngredientPriceImpact,
  calculateMenuPricing,
  calculateRecipeCost
} from "./index.js";

const ingredients = [
  {
    id: "queijo",
    name: "Queijo mussarela",
    purchaseUnit: "kg" as const,
    purchaseQuantity: 1,
    purchasePrice: 40
  },
  {
    id: "massa",
    name: "Massa",
    purchaseUnit: "kg" as const,
    purchaseQuantity: 1,
    purchasePrice: 10
  }
];

describe("MenuMetrics pricing engine", () => {
  it("calculates recipe cost from ficha tecnica", () => {
    const cost = calculateRecipeCost(
      {
        id: "pizza",
        name: "Pizza",
        yieldQuantity: 1,
        items: [
          { ingredientId: "queijo", quantity: 200, unit: "g" },
          { ingredientId: "massa", quantity: 300, unit: "g" }
        ],
        laborCost: 4,
        packagingCost: 3
      },
      new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]))
    );

    assert.deepEqual(cost, {
      recipeId: "pizza",
      recipeName: "Pizza",
      ingredientCost: 11,
      laborCost: 4,
      packagingCost: 3,
      totalRecipeCost: 18,
      unitRecipeCost: 18
    });
  });

  it("shows which menu items are profitable and which burn money", () => {
    const result = calculateMenuPricing({
      ingredients,
      monthlyFixedExpenses: 1000,
      menuItems: [
        {
          id: "pizza",
          name: "Pizza mussarela",
          desiredMargin: 0.3,
          currentPrice: 45,
          taxRate: 0.06,
          commissionRate: 0.04,
          monthlySalesEstimate: 100,
          recipe: {
            id: "pizza",
            name: "Pizza",
            items: [
              { ingredientId: "queijo", quantity: 200, unit: "g" },
              { ingredientId: "massa", quantity: 300, unit: "g" }
            ],
            laborCost: 4,
            packagingCost: 3
          }
        },
        {
          id: "promo",
          name: "Pizza promocional",
          desiredMargin: 0.3,
          currentPrice: 22,
          taxRate: 0.06,
          commissionRate: 0.04,
          monthlySalesEstimate: 100,
          recipe: {
            id: "promo",
            name: "Pizza promo",
            items: [
              { ingredientId: "queijo", quantity: 200, unit: "g" },
              { ingredientId: "massa", quantity: 300, unit: "g" }
            ],
            laborCost: 4,
            packagingCost: 3
          }
        }
      ]
    });

    const pizza = result.menuItems[0];
    const promo = result.menuItems[1];

    assert.equal(result.brandName, "MenuMetrics");
    assert.equal(result.totalMonthlySalesEstimate, 200);
    assert.equal(pizza?.recipeCost.unitRecipeCost, 18);
    assert.equal(pizza?.allocatedFixedExpense, 5);
    assert.equal(pizza?.minimumPrice, 25.56);
    assert.equal(pizza?.idealPrice, 38.33);
    assert.equal(pizza?.realMargin, 0.388889);
    assert.equal(pizza?.monthlyNetProfit, 1750);
    assert.equal(pizza?.status, "healthy");
    assert.equal(pizza?.profitQuadrant, "high_margin_high_sales");

    assert.equal(promo?.status, "loss");
    assert.equal(result.lossItems, 1);
  });

  it("calculates impact when an ingredient price changes", () => {
    const impact = calculateIngredientPriceImpact({
      ingredientId: "queijo",
      oldPurchasePrice: 40,
      newPurchasePrice: 48,
      menuPricingInput: {
        ingredients,
        monthlyFixedExpenses: 0,
        menuItems: [
          {
            id: "pizza",
            name: "Pizza mussarela",
            desiredMargin: 0.3,
            currentPrice: 45,
            monthlySalesEstimate: 100,
            recipe: {
              id: "pizza",
              name: "Pizza",
              items: [{ ingredientId: "queijo", quantity: 200, unit: "g" }]
            }
          }
        ]
      }
    });

    assert.equal(impact.priceVariationPercentage, 0.2);
    assert.equal(impact.affectedMenuItems[0]?.unitCostIncrease, 1.6);
    assert.equal(impact.totalMonthlyProfitImpact, -160);
  });

  it("rejects unknown ingredients in recipe items", () => {
    assert.throws(
      () =>
        calculateMenuPricing({
          ingredients,
          monthlyFixedExpenses: 0,
          menuItems: [
            {
              id: "x",
              name: "Prato X",
              desiredMargin: 0.3,
              monthlySalesEstimate: 10,
              recipe: {
                id: "x",
                name: "Receita X",
                items: [{ ingredientId: "inexistente", quantity: 1, unit: "kg" }]
              }
            }
          ]
        }),
      PricingInputError
    );
  });
});
