import type { SupabaseClient } from "@supabase/supabase-js";

type BillingOrganization = {
  id: string;
  name: string;
  plan: string;
  stripe_customer_id: string | null;
};

export async function requireOwnedOrganization(
  supabase: SupabaseClient,
  orgId: string,
  userId: string
): Promise<{ organization: BillingOrganization | null; error: string | null }> {
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    return { organization: null, error: "Organizacao nao encontrada." };
  }

  if (!["owner", "admin"].includes(String(membership.role))) {
    return { organization: null, error: "Somente owner ou admin pode gerenciar o plano." };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id,name,plan,stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (organizationError || !organization) {
    return { organization: null, error: "Organizacao nao encontrada." };
  }

  return { organization: organization as BillingOrganization, error: null };
}
