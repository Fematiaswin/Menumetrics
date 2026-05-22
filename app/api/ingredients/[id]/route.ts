import { badRequest, noContent, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type IngredientPatchBody = {
  name?: string;
  category?: string | null;
  purchaseUnit?: string;
  purchaseQuantity?: number;
  purchasePrice?: number;
  wastePercentage?: number;
  active?: boolean;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { data, error } = await supabase.from("ingredients").select("*").eq("id", params.id).single();
  if (error) return notFound("Ingredient not found.");
  return ok({ ingredient: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<IngredientPatchBody>(request);
    const update = {
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.category === undefined ? {} : { category: body.category }),
      ...(body.purchaseUnit === undefined ? {} : { purchase_unit: body.purchaseUnit }),
      ...(body.purchaseQuantity === undefined ? {} : { purchase_quantity: body.purchaseQuantity }),
      ...(body.purchasePrice === undefined ? {} : { purchase_price: body.purchasePrice }),
      ...(body.wastePercentage === undefined ? {} : { waste_percentage: body.wastePercentage }),
      ...(body.active === undefined ? {} : { active: body.active })
    };

    const current = await supabase
      .from("ingredients")
      .select("purchase_price,purchase_quantity")
      .eq("id", params.id)
      .single();
    if (current.error) return notFound("Ingredient not found.");

    const { data, error } = await supabase.from("ingredients").update(update).eq("id", params.id).select().single();
    if (error) return serverError("Could not update ingredient.", error);

    const priceChanged =
      body.purchasePrice !== undefined && Number(current.data.purchase_price) !== Number(body.purchasePrice);
    if (priceChanged) {
      await supabase.from("ingredient_price_history").insert({
        ingredient_id: params.id,
        purchase_price: body.purchasePrice,
        purchase_quantity: body.purchaseQuantity ?? current.data.purchase_quantity,
        source: "ingredient_update"
      });
    }

    return ok({ ingredient: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { error } = await supabase.from("ingredients").delete().eq("id", params.id);
  if (error) return serverError("Could not delete ingredient.", error);
  return noContent();
}
