import type { SupabaseClient } from "@supabase/supabase-js";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
};

type MembershipRow = {
  role: string;
  organizations:
    | {
        id: string;
        name: string;
        slug: string;
        plan: string;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        plan: string;
      }>
    | null;
};

export async function listUserOrganizations(supabase: SupabaseClient, userId: string): Promise<OrganizationSummary[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organizations(id,name,slug,plan)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as MembershipRow[])
    .map((row) => {
      const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      if (!organization) return null;

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        role: row.role
      };
    })
    .filter((org): org is OrganizationSummary => org !== null);
}
