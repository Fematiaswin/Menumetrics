import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type RecipeBody = {
  orgId: string;
  name: string;
  category?: string;
  yieldQuantity?: number;
  yieldUnit?: string;
  laborCost?: number;
  packagingCost?: number;
  notes?: string;
  items?: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const orgId = new URL(request.url).searchParams.get("orgId");
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_items(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) return serverError("Could not load recipes.", error);
  return ok({ recipes: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<RecipeBody>(request);
    if (!body.orgId || !body.name) return badRequest("orgId and name are required.");

    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        org_id: body.orgId,
        name: body.name,
        category: body.category ?? null,
        yield_quantity: body.yieldQuantity ?? 1,
        yield_unit: body.yieldUnit ?? "portion",
        labor_cost: body.laborCost ?? 0,
        packaging_cost: body.packagingCost ?? 0,
        notes: body.notes ?? null
      })
      .select()
      .single();

    if (error) return serverError("Could not create recipe.", error);

    if (body.items?.length) {
      const { error: itemsError } = await supabase.from("recipe_items").insert(
        body.items.map((item) => ({
          recipe_id: recipe.id,
          ingredient_id: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit
        }))
      );

      if (itemsError) return serverError("Recipe was created, but items could not be added.", itemsError);
    }

    const { data: fullRecipe } = await supabase.from("recipes").select("*, recipe_items(*)").eq("id", recipe.id).single();
    return created({ recipe: fullRecipe ?? recipe });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
