import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { assertCanCreateMenuItem } from "@/lib/billing/limits";
import { requireUser } from "@/lib/supabase/server";

type MenuItemBody = {
  orgId: string;
  recipeId?: string | null;
  name: string;
  category?: string;
  currentPrice?: number;
  taxRate?: number;
  commissionRate?: number;
  desiredMargin?: number;
  monthlySalesEstimate?: number;
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const orgId = new URL(request.url).searchParams.get("orgId");
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, pricing_configs(*), menu_item_sales_estimates(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) return serverError("Could not load menu items.", error);
  return ok({ menuItems: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<MenuItemBody>(request);
    if (!body.orgId || !body.name) return badRequest("orgId and name are required.");

    const limitError = await assertCanCreateMenuItem(supabase, body.orgId);
    if (limitError) return badRequest(limitError);

    const { data: menuItem, error } = await supabase
      .from("menu_items")
      .insert({
        org_id: body.orgId,
        recipe_id: body.recipeId ?? null,
        name: body.name,
        category: body.category ?? null,
        current_price: body.currentPrice ?? 0,
        tax_rate: body.taxRate ?? 0,
        commission_rate: body.commissionRate ?? 0
      })
      .select()
      .single();

    if (error) return serverError("Could not create menu item.", error);

    await supabase.from("pricing_configs").insert({
      menu_item_id: menuItem.id,
      desired_margin: body.desiredMargin ?? 0.3
    });

    if (body.monthlySalesEstimate !== undefined) {
      const today = new Date();
      const periodStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

      await supabase.from("menu_item_sales_estimates").insert({
        menu_item_id: menuItem.id,
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        units_sold: body.monthlySalesEstimate,
        source: "manual"
      });
    }

    return created({ menuItem });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
