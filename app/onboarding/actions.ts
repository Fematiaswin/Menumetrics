"use server";

import { redirect } from "next/navigation";

import { AI_DIAGNOSTIC_PROMPT_VERSION } from "@/lib/ai/types";
import { generateFinancialDiagnostic } from "@/lib/ai/openai-diagnostics";
import { calculateMenuPricing } from "@/lib/pricing-engine/index.js";
import { createAppSupabaseClient } from "@/lib/supabase/app-server";

export type OrganizationState = {
  error?: string;
};

type CreatedIngredient = {
  id: string;
};

type CreatedRecipe = {
  id: string;
};

type CreatedMenuItem = {
  id: string;
};

export async function createOrganization(_state: OrganizationState, formData: FormData): Promise<OrganizationState> {
  const name = String(formData.get("name") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim();

  if (!name) {
    return { error: "Informe o nome do restaurante." };
  }

  const supabase = createAppSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slug = buildSlug(name);
  const organizationId = crypto.randomUUID();
  const { error: orgError } = await supabase.from("organizations").insert({
    id: organizationId,
    name,
    slug: `${slug}-${organizationId.slice(0, 8)}`,
    sector: sector || "restaurante",
    plan: "free"
  });

  if (orgError) {
    return { error: "Nao foi possivel criar a organizacao." };
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    return { error: "Organizacao criada, mas nao foi possivel vincular o usuario." };
  }

  redirect(`/app?orgId=${organizationId}`);
}

export async function completeRestaurantOnboarding(
  _state: OrganizationState,
  formData: FormData
): Promise<OrganizationState> {
  const restaurantName = getText(formData, "restaurantName");
  const sector = getText(formData, "sector") || "restaurante";
  const fixedExpenseDescription = getText(formData, "fixedExpenseDescription") || "Despesas fixas";
  const fixedExpenseAmount = getMoney(formData, "fixedExpenseAmount");
  const ingredientName = getText(formData, "ingredientName");
  const ingredientUnit = getText(formData, "ingredientUnit") || "kg";
  const ingredientPurchaseQuantity = getMoney(formData, "ingredientPurchaseQuantity");
  const ingredientPurchasePrice = getMoney(formData, "ingredientPurchasePrice");
  const ingredientUsageQuantity = getMoney(formData, "ingredientUsageQuantity");
  const ingredientUsageUnit = getText(formData, "ingredientUsageUnit") || "g";
  const dishName = getText(formData, "dishName");
  const dishCategory = getText(formData, "dishCategory") || "Cardapio";
  const currentPrice = getMoney(formData, "currentPrice");
  const desiredMargin = getPercentage(formData, "desiredMargin", 30);
  const monthlySalesEstimate = getInteger(formData, "monthlySalesEstimate");
  const laborCost = getMoney(formData, "laborCost");
  const packagingCost = getMoney(formData, "packagingCost");
  const taxRate = getPercentage(formData, "taxRate", 6);
  const commissionRate = getPercentage(formData, "commissionRate", 0);

  if (!restaurantName || !ingredientName || !dishName) {
    return { error: "Informe restaurante, primeiro insumo e primeiro prato." };
  }

  if (fixedExpenseAmount < 0) {
    return { error: "Revise o valor da despesa fixa." };
  }

  if (ingredientPurchaseQuantity <= 0 || ingredientPurchasePrice < 0 || ingredientUsageQuantity <= 0) {
    return { error: "Revise quantidade e preco do insumo." };
  }

  if (currentPrice < 0 || monthlySalesEstimate < 0) {
    return { error: "Revise preco atual e venda mensal." };
  }

  if (desiredMargin < 0 || taxRate < 0 || commissionRate < 0 || desiredMargin + taxRate + commissionRate >= 1) {
    return { error: "Margem, imposto e comissao precisam somar menos de 100%." };
  }

  const supabase = createAppSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slug = buildSlug(restaurantName);
  const organizationId = crypto.randomUUID();
  const { error: orgError } = await supabase.from("organizations").insert({
    id: organizationId,
    name: restaurantName,
    slug: `${slug}-${organizationId.slice(0, 8)}`,
    sector,
    plan: "free"
  });

  if (orgError) {
    return { error: "Nao foi possivel criar o restaurante." };
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: user.id,
    role: "owner"
  });

  if (memberError) {
    return { error: "Restaurante criado, mas nao foi possivel vincular o usuario." };
  }

  const { error: expenseError } = await supabase.from("fixed_expenses").insert({
    org_id: organizationId,
    category: "other",
    description: fixedExpenseDescription,
    amount: fixedExpenseAmount,
    period: "monthly"
  });

  if (expenseError) {
    return { error: "Nao foi possivel salvar as despesas fixas." };
  }

  const { data: ingredientData, error: ingredientError } = await supabase
    .from("ingredients")
    .insert({
      org_id: organizationId,
      name: ingredientName,
      category: "onboarding",
      purchase_unit: ingredientUnit,
      purchase_quantity: ingredientPurchaseQuantity,
      purchase_price: ingredientPurchasePrice,
      waste_percentage: 0
    })
    .select("id")
    .single();
  const ingredient = ingredientData as CreatedIngredient | null;

  if (ingredientError || !ingredient) {
    return { error: "Nao foi possivel salvar o primeiro insumo." };
  }

  const { error: historyError } = await supabase.from("ingredient_price_history").insert({
    ingredient_id: ingredient.id,
    purchase_price: ingredientPurchasePrice,
    purchase_quantity: ingredientPurchaseQuantity,
    source: "onboarding"
  });

  if (historyError) {
    return { error: "Nao foi possivel salvar o historico do insumo." };
  }

  const { data: recipeData, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      org_id: organizationId,
      name: `Ficha tecnica - ${dishName}`,
      category: dishCategory,
      yield_quantity: 1,
      yield_unit: "portion",
      labor_cost: laborCost,
      packaging_cost: packagingCost,
      notes: "Criada no onboarding inicial."
    })
    .select("id")
    .single();
  const recipe = recipeData as CreatedRecipe | null;

  if (recipeError || !recipe) {
    return { error: "Nao foi possivel criar a ficha tecnica." };
  }

  const { error: itemError } = await supabase.from("recipe_items").insert({
    recipe_id: recipe.id,
    ingredient_id: ingredient.id,
    quantity: ingredientUsageQuantity,
    unit: ingredientUsageUnit
  });

  if (itemError) {
    return { error: "Nao foi possivel adicionar o insumo na ficha tecnica." };
  }

  const { data: menuItemData, error: menuItemError } = await supabase
    .from("menu_items")
    .insert({
      org_id: organizationId,
      recipe_id: recipe.id,
      name: dishName,
      category: dishCategory,
      current_price: currentPrice,
      tax_rate: taxRate,
      commission_rate: commissionRate
    })
    .select("id")
    .single();
  const menuItem = menuItemData as CreatedMenuItem | null;

  if (menuItemError || !menuItem) {
    return { error: "Nao foi possivel criar o primeiro prato." };
  }

  const { error: configError } = await supabase.from("pricing_configs").insert({
    menu_item_id: menuItem.id,
    desired_margin: desiredMargin
  });

  if (configError) {
    return { error: "Nao foi possivel salvar a margem desejada." };
  }

  const { periodStart, periodEnd } = currentMonthPeriod();
  const { error: salesError } = await supabase.from("menu_item_sales_estimates").insert({
    menu_item_id: menuItem.id,
    period_start: periodStart,
    period_end: periodEnd,
    units_sold: monthlySalesEstimate,
    revenue: currentPrice * monthlySalesEstimate,
    source: "onboarding"
  });

  if (salesError) {
    return { error: "Nao foi possivel salvar a estimativa de vendas." };
  }

  const pricing = calculateMenuPricing({
    monthlyFixedExpenses: fixedExpenseAmount,
    ingredients: [
      {
        id: ingredient.id,
        name: ingredientName,
        purchaseUnit: ingredientUnit as "g" | "kg" | "ml" | "l" | "un" | "portion",
        purchaseQuantity: ingredientPurchaseQuantity,
        purchasePrice: ingredientPurchasePrice,
        wastePercentage: 0
      }
    ],
    menuItems: [
      {
        id: menuItem.id,
        name: dishName,
        category: dishCategory,
        recipe: {
          id: recipe.id,
          name: `Ficha tecnica - ${dishName}`,
          yieldQuantity: 1,
          yieldUnit: "portion",
          laborCost,
          packagingCost,
          items: [
            {
              ingredientId: ingredient.id,
              quantity: ingredientUsageQuantity,
              unit: ingredientUsageUnit as "g" | "kg" | "ml" | "l" | "un" | "portion"
            }
          ]
        },
        desiredMargin,
        currentPrice,
        taxRate,
        commissionRate,
        monthlySalesEstimate
      }
    ]
  });

  const snapshot = pricing.menuItems[0];
  const snapshotIds: string[] = [];
  if (snapshot) {
    const { data: snapshotData, error: snapshotError } = await supabase
      .from("pricing_snapshots")
      .insert({
        menu_item_id: snapshot.menuItemId,
        recipe_cost: snapshot.recipeCost.ingredientCost,
        labor_cost: snapshot.recipeCost.laborCost,
        packaging_cost: snapshot.recipeCost.packagingCost,
        allocated_fixed_expense: snapshot.allocatedFixedExpense,
        total_unit_cost: snapshot.totalUnitCost,
        minimum_price: snapshot.minimumPrice,
        ideal_price: snapshot.idealPrice,
        sale_price: snapshot.currentPrice,
        real_margin: snapshot.realMargin,
        gross_profit_per_unit: snapshot.grossProfitPerUnit,
        net_profit: snapshot.monthlyNetProfit,
        break_even_units: snapshot.breakEvenUnits,
        health_score: snapshot.healthScore,
        status: snapshot.status,
        profit_quadrant: snapshot.profitQuadrant,
        formula_version: "menumetrics-v1",
        inputs: snapshot
      })
      .select("id")
      .single();

    if (snapshotError) {
      return { error: "Nao foi possivel salvar o snapshot do Raio-X." };
    }

    if (snapshotData?.id) {
      snapshotIds.push(snapshotData.id as string);
    }
  }

  await createInitialDiagnostic({
    supabase,
    organizationId,
    userId: user.id,
    restaurantName,
    sector,
    snapshotIds,
    pricing
  });

  const { error: onboardingError } = await supabase
    .from("organizations")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", organizationId);

  if (onboardingError) {
    return { error: "Raio-X criado, mas nao foi possivel finalizar o onboarding." };
  }

  redirect(`/app?orgId=${organizationId}&welcome=1`);
}

function buildSlug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42) || "restaurante"
  );
}

function getText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function getMoney(formData: FormData, name: string): number {
  const raw = normalizeNumberInput(getText(formData, name));
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPercentage(formData: FormData, name: string, fallback: number): number {
  const value = getText(formData, name);
  const parsed = value ? Number(normalizeNumberInput(value)) : fallback;
  return Number.isFinite(parsed) ? parsed / 100 : fallback / 100;
}

function getInteger(formData: FormData, name: string): number {
  const parsed = Number.parseInt(getText(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currentMonthPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10)
  };
}

function normalizeNumberInput(value: string): string {
  const trimmed = value.trim();
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  if (hasComma && hasDot) {
    return trimmed.replace(/\./g, "").replace(",", ".");
  }

  if (hasComma) {
    return trimmed.replace(",", ".");
  }

  return trimmed;
}

async function createInitialDiagnostic({
  supabase,
  organizationId,
  userId,
  restaurantName,
  sector,
  snapshotIds,
  pricing
}: {
  supabase: ReturnType<typeof createAppSupabaseClient>;
  organizationId: string;
  userId: string;
  restaurantName: string;
  sector: string;
  snapshotIds: string[];
  pricing: ReturnType<typeof calculateMenuPricing>;
}) {
  const result = await generateFinancialDiagnostic({
    organization: {
      id: organizationId,
      name: restaurantName,
      sector
    },
    pricing
  });

  await supabase.from("ai_diagnostics").insert({
    org_id: organizationId,
    snapshot_ids: snapshotIds,
    diagnosis_text: result.diagnostic.diagnosisText,
    suggestions: result.diagnostic.suggestions,
    severity: result.diagnostic.severity,
    model: result.model,
    prompt_version: AI_DIAGNOSTIC_PROMPT_VERSION,
    created_by: userId
  });
}
