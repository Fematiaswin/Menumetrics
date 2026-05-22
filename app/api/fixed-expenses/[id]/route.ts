import { badRequest, noContent, ok, readJson, serverError, unauthorized } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/server";

type FixedExpensePatchBody = {
  category?: string;
  description?: string;
  amount?: number;
  period?: "monthly" | "yearly" | "one_time";
  active?: boolean;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await readJson<FixedExpensePatchBody>(request);
    const update = {
      ...(body.category === undefined ? {} : { category: body.category }),
      ...(body.description === undefined ? {} : { description: body.description }),
      ...(body.amount === undefined ? {} : { amount: body.amount }),
      ...(body.period === undefined ? {} : { period: body.period }),
      ...(body.active === undefined ? {} : { active: body.active })
    };

    const { data, error } = await supabase.from("fixed_expenses").update(update).eq("id", params.id).select().single();
    if (error) return serverError("Could not update fixed expense.", error);
    return ok({ fixedExpense: data });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid request body.");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await requireUser(request);
  if (!user) return unauthorized();

  const { error } = await supabase.from("fixed_expenses").delete().eq("id", params.id);
  if (error) return serverError("Could not delete fixed expense.", error);
  return noContent();
}
