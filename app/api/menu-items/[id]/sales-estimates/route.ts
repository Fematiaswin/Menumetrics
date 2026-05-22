import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type SalesEstimateBody = {
  periodStart: string;
  periodEnd: string;
  unitsSold: number;
  revenue?: number;
  source?: string;
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("menu_item_sales_estimates")
    .select("*")
    .eq("menu_item_id", params.id)
    .order("period_start", { ascending: false });

  if (error) return serverError("Could not load sales estimates.", error);
  return ok({ salesEstimates: data ?? [] });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<SalesEstimateBody>(request);
    if (!body.periodStart || !body.periodEnd || body.unitsSold === undefined) {
      return badRequest("periodStart, periodEnd and unitsSold are required.");
    }

    const { data, error } = await supabase
      .from("menu_item_sales_estimates")
      .upsert(
        {
          menu_item_id: params.id,
          period_start: body.periodStart,
          period_end: body.periodEnd,
          units_sold: body.unitsSold,
          revenue: body.revenue ?? null,
          source: body.source ?? "manual"
        },
        { onConflict: "menu_item_id,period_start,period_end,source" }
      )
      .select()
      .single();

    if (error) return serverError("Could not save sales estimate.", error);
    return created({ salesEstimate: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
