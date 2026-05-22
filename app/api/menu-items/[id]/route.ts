import { badRequest, noContent, notFound, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type MenuItemPatchBody = {
  recipeId?: string | null;
  name?: string;
  category?: string | null;
  currentPrice?: number;
  taxRate?: number;
  commissionRate?: number;
  desiredMargin?: number;
  priceOverride?: number | null;
  active?: boolean;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, pricing_configs(*), menu_item_sales_estimates(*)")
    .eq("id", params.id)
    .single();

  if (error) return notFound("Menu item not found.");
  return ok({ menuItem: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<MenuItemPatchBody>(request);
    const update = {
      ...(body.recipeId === undefined ? {} : { recipe_id: body.recipeId }),
      ...(body.name === undefined ? {} : { name: body.name }),
      ...(body.category === undefined ? {} : { category: body.category }),
      ...(body.currentPrice === undefined ? {} : { current_price: body.currentPrice }),
      ...(body.taxRate === undefined ? {} : { tax_rate: body.taxRate }),
      ...(body.commissionRate === undefined ? {} : { commission_rate: body.commissionRate }),
      ...(body.active === undefined ? {} : { active: body.active })
    };

    const { data, error } = await supabase.from("menu_items").update(update).eq("id", params.id).select().single();
    if (error) return serverError("Could not update menu item.", error);

    if (body.desiredMargin !== undefined || body.priceOverride !== undefined) {
      const configPatch = {
        ...(body.desiredMargin === undefined ? {} : { desired_margin: body.desiredMargin }),
        ...(body.priceOverride === undefined ? {} : { price_override: body.priceOverride })
      };

      const configResult = await supabase.from("pricing_configs").update(configPatch).eq("menu_item_id", params.id);
      if (configResult.error) return serverError("Could not update pricing config.", configResult.error);
    }

    return ok({ menuItem: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { error } = await supabase.from("menu_items").delete().eq("id", params.id);
  if (error) return serverError("Could not delete menu item.", error);
  return noContent();
}
