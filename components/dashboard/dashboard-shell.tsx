import type { ReactNode } from "react";

import { signOut } from "@/app/auth/actions";
import { Icon } from "@/components/ui/icon";
import type { OrganizationSummary } from "@/lib/menu-metrics/organizations";

const navItems = [
  { label: "Raio-X", icon: "gauge" as const, active: true },
  { label: "Preco Perfeito", icon: "calculator" as const },
  { label: "Ficha Tecnica", icon: "plate" as const },
  { label: "Insumos", icon: "box" as const },
  { label: "Alertas", icon: "alert" as const },
  { label: "Relatorios", icon: "chart" as const }
];

export function DashboardShell({
  children,
  organization,
  organizations
}: {
  children: ReactNode;
  organization: OrganizationSummary;
  organizations: OrganizationSummary[];
}) {
  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[252px_1fr]">
        <aside className="border-b border-line bg-[#24211c] px-4 py-5 text-white lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f6c15a] text-ink">
              <Icon className="h-5 w-5" name="plate" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">MenuMetrics</h1>
              <p className="text-xs text-white/60">Lucro real do cardapio</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Organizacao</p>
            <strong className="mt-1 block truncate text-sm">{organization.name}</strong>
            <span className="mt-1 block text-xs text-white/60">{organization.role} · plano {organization.plan}</span>
          </div>

          <nav className="mt-6 grid gap-1">
            {navItems.map((item) => (
              <button
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                  item.active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                key={item.label}
                type="button"
                title={item.label}
              >
                <Icon className="h-4 w-4" name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {organizations.length > 1 ? (
            <div className="mt-6 rounded-lg border border-white/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Outras empresas</p>
              <div className="mt-2 grid gap-1">
                {organizations
                  .filter((item) => item.id !== organization.id)
                  .map((item) => (
                    <a className="rounded-md px-2 py-1.5 text-sm text-white/70 hover:bg-white/10" href={`/app?orgId=${item.id}`} key={item.id}>
                      {item.name}
                    </a>
                  ))}
              </div>
            </div>
          ) : null}

          <form action={signOut} className="mt-6">
            <button className="h-10 w-full rounded-md border border-white/10 text-sm font-semibold text-white/80 hover:bg-white/10" type="submit">
              Sair
            </button>
          </form>
        </aside>

        {children}
      </div>
    </main>
  );
}
