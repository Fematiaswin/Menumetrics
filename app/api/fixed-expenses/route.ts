import { badRequest, created, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type FixedExpenseBody = {
  orgId: string;
  category: string;
  description: string;
  amount: number;
  period?: "monthly" | "yearly" | "one_time";
};

export async function GET(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const orgId = new URL(request.url).searchParams.get("orgId");
  if (!orgId) return badRequest("Missing orgId.");

  const { data, error } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return serverError("Could not load fixed expenses.", error);
  return ok({ fixedExpenses: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<FixedExpenseBody>(request);
    if (!body.orgId || !body.category || !body.description) {
      return badRequest("orgId, category and description are required.");
    }

    const { data, error } = await supabase
      .from("fixed_expenses")
      .insert({
        org_id: body.orgId,
        category: body.category,
        description: body.description,
        amount: body.amount,
        period: body.period ?? "monthly"
      })
      .select()
      .single();

    if (error) return serverError("Could not create fixed expense.", error);
    return created({ fixedExpense: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}
