import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type ProfitAlertBody = {
  orgId: string;
  menuItemId?: string;
  ingredientId?: string;
  type: string;
  title: string;
  message: string;
  impactCents?: number;
  severity?: "ok" | "warning" | "critical";
  metadata?: Record<string, unknown>;
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const searchParams = new URL(request.url).searchParams;
  const orgId = searchParams.get("orgId");
  const status = searchParams.get("status") ?? "open";
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("profit_alerts")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return serverError("Could not load profit alerts.", error);
  return ok({ alerts: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<ProfitAlertBody>(request);
    if (!body.orgId || !body.type || !body.title || !body.message) {
      return badRequest("orgId, type, title and message are required.");
    }

    const { data, error } = await supabase
      .from("profit_alerts")
      .insert({
        org_id: body.orgId,
        menu_item_id: body.menuItemId ?? null,
        ingredient_id: body.ingredientId ?? null,
        type: body.type,
        title: body.title,
        message: body.message,
        impact_cents: body.impactCents ?? null,
        severity: body.severity ?? "warning",
        metadata: body.metadata ?? {}
      })
      .select()
      .single();

    if (error) return serverError("Could not create profit alert.", error);
    return created({ alert: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
