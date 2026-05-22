import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type IngredientBody = {
  orgId: string;
  name: string;
  category?: string;
  purchaseUnit: string;
  purchaseQuantity: number;
  purchasePrice: number;
  wastePercentage?: number;
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const orgId = new URL(request.url).searchParams.get("orgId");
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) return serverError("Could not load ingredients.", error);
  return ok({ ingredients: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<IngredientBody>(request);
    if (!body.orgId || !body.name || !body.purchaseUnit) {
      return badRequest("orgId, name and purchaseUnit are required.");
    }

    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        org_id: body.orgId,
        name: body.name,
        category: body.category ?? null,
        purchase_unit: body.purchaseUnit,
        purchase_quantity: body.purchaseQuantity,
        purchase_price: body.purchasePrice,
        waste_percentage: body.wastePercentage ?? 0
      })
      .select()
      .single();

    if (error) return serverError("Could not create ingredient.", error);

    await supabase.from("ingredient_price_history").insert({
      ingredient_id: data.id,
      purchase_price: body.purchasePrice,
      purchase_quantity: body.purchaseQuantity,
      source: "ingredient_create"
    });

    return created({ ingredient: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
