import { badRequest, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type ProfitAlertPatchBody = {
  status?: "open" | "resolved" | "dismissed";
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<ProfitAlertPatchBody>(request);
    if (!body.status) return badRequest("status is required.");

    const { data, error } = await supabase
      .from("profit_alerts")
      .update({
        status: body.status,
        resolved_at: body.status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return serverError("Could not update profit alert.", error);
    return ok({ alert: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
