import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MenuDashboard } from "@/components/dashboard/menu-dashboard";
import { listUserOrganizations } from "@/lib/menu-metrics/organizations";
import { getCurrentUser } from "@/lib/supabase/app-server";

export default async function AppPage({ searchParams }: { searchParams: { orgId?: string; welcome?: string } }) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");

  const organizations = await listUserOrganizations(supabase, user.id);
  if (organizations.length === 0) redirect("/onboarding");

  const selectedOrganization =
    organizations.find((organization) => organization.id === searchParams.orgId) ?? organizations[0];

  if (!selectedOrganization) redirect("/onboarding");

  return (
    <DashboardShell organization={selectedOrganization} organizations={organizations}>
      <MenuDashboard organization={selectedOrganization} showWelcome={searchParams.welcome === "1"} />
    </DashboardShell>
  );
}
