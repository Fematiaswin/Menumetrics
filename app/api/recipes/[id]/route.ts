import { badRequest, noContent, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type RecipePatchBody = {
  name?: string;
  category?: string | null;
  yieldQuantity?: number;
  yieldUnit?: string;
  laborCost?: number;
  packagingCost?: number;
  notes?: string | null;
  active?: boolean;
  items?: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { data, error } = await supabase.from("recipes").select("*, recipe_items(*)").eq("id", params.id).single();
  if (error) return notFound("Recipe not found.");
  return ok({ recipe: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<RecipePatchBody>(request);
    const update = {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.category === undefined ? {} : { category: body.category }),
      ...(body.yieldQuantity === undefined ? {} : { yield_quantity: body.yieldQuantity }),
      ...(body.yieldUnit === undefined ? {} : { yield_unit: body.yieldUnit }),
      ...(body.laborCost === undefined ? {} : { labor_cost: body.laborCost }),
      ...(body.packagingCost === undefined ? {} : { packaging_cost: body.packagingCost }),
      ...(body.notes === undefined ? {} : { notes: body.notes }),
      ...(body.active === undefined ? {} : { active: body.active })
    };

    const { data: recipe, error } = await supabase.from("recipes").update(update).eq("id", params.id).select().single();
    if (error) return serverError("Could not update recipe.", error);

    if (body.items !== undefined) {
      const deleteResult = await supabase.from("recipe_items").delete().eq("recipe_id", params.id);
      if (deleteResult.error) return serverError("Could not replace recipe items.", deleteResult.error);

      if (body.items.length) {
        const insertResult = await supabase.from("recipe_items").insert(
          body.items.map((item) => ({
            recipe_id: params.id,
            ingredient_id: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit
          }))
        );
        if (insertResult.error) return serverError("Could not save recipe items.", insertResult.error);
      }
    }

    const { data: fullRecipe } = await supabase.from("recipes").select("*, recipe_items(*)").eq("id", params.id).single();
    return ok({ recipe: fullRecipe ?? recipe });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { error } = await supabase.from("recipes").delete().eq("id", params.id);
  if (error) return serverError("Could not delete recipe.", error);
  return noContent();
}
