import { ok, serverError, unauthorized } from "@/lib/api/http";
import { listPlans } from "@/lib/billing/plans";
import { requireUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const plans = await listPlans(supabase);
    return ok({ plans });
  } catch (error) {
    return serverError("Could not load plans.", error);
  }
}
