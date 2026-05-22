import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MenuDashboard } from "@/components/dashboard/menu-dashboard";
import type { OrganizationSummary } from "@/lib/menu-metrics/organizations";

const demoOrganization: OrganizationSummary = {
  id: "demo-org",
  name: "Pizzaria Bella Massa",
  slug: "pizzaria-bella-massa",
  plan: "starter",
  role: "owner"
};

export default function DemoPage() {
  return (
    <DashboardShell organization={demoOrganization} organizations={[demoOrganization]}>
      <MenuDashboard demoMode organization={demoOrganization} showWelcome />
    </DashboardShell>
  );
}
