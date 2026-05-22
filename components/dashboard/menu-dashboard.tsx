import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { AiDiagnosticPanel } from "@/components/dashboard/ai-diagnostic-panel";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { DemoAiDiagnosticPanel } from "@/components/dashboard/demo-ai-diagnostic-panel";
import { DemoBillingPanel } from "@/components/dashboard/demo-billing-panel";
import { Icon } from "@/components/ui/icon";
import {
  currency,
  dishMetrics,
  ingredientMetrics,
  monthlySummary,
  percent,
  profitAlerts
} from "@/lib/menu-metrics/demo-dashboard";
import type { OrganizationSummary } from "@/lib/menu-metrics/organizations";

export function MenuDashboard({
  organization,
  showWelcome = false,
  demoMode = false
}: {
  organization: OrganizationSummary;
  showWelcome?: boolean;
  demoMode?: boolean;
}) {
  const mostProfitable = [...dishMetrics].sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  const weakest = [...dishMetrics].sort((a, b) => a.monthlyProfit - b.monthlyProfit);

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-basil">{organization.name}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">Raio-X do Cardapio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
            Descubra quais pratos dao lucro e quais estao queimando dinheiro, com margem, preco ideal e impacto dos insumos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm" type="button">
            Exportar resumo
          </button>
        </div>
      </header>

      {showWelcome ? (
        <section className="mt-6 rounded-lg border border-basil/20 bg-[#eef7f1] p-4 text-basil">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
              <Icon className="h-5 w-5" name="gauge" />
            </span>
            <div>
              <strong className="block text-sm">Primeiro Raio-X criado</strong>
              <p className="mt-1 text-sm leading-5">
                Seu restaurante ja tem um insumo, uma ficha tecnica, um prato e um snapshot inicial para comecar a decidir por lucro.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        {demoMode ? <DemoAiDiagnosticPanel /> : <AiDiagnosticPanel organizationId={organization.id} />}
      </div>

      <div className="mt-6">
        {demoMode ? (
          <DemoBillingPanel currentPlan={organization.plan} />
        ) : (
          <BillingPanel currentPlan={organization.plan} organizationId={organization.id} />
        )}
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Score geral do cardapio considerando margem, lucro e preco minimo."
          icon="gauge"
          label="Saude do cardapio"
          tone="green"
          value={`${monthlySummary.menuScore}/100`}
        />
        <MetricCard
          detail={`${monthlySummary.healthyItems} pratos saudaveis e ${monthlySummary.attentionItems} pedem ajuste.`}
          icon="coin"
          label="Lucro do mes"
          value={currency(monthlySummary.totalProfit)}
        />
        <MetricCard
          detail="Media ponderada dos pratos monitorados no cardapio."
          icon="chart"
          label="Margem media"
          tone="amber"
          value={percent(monthlySummary.averageMargin)}
        />
        <MetricCard
          detail="Pratos abaixo do preco minimo ou com margem negativa."
          icon="alert"
          label="Queimando dinheiro"
          tone="red"
          value={`${monthlySummary.lossItems} prato`}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <div className="rounded-lg border border-line bg-white shadow-soft">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">Ranking de pratos</h3>
              <p className="mt-1 text-sm text-steel">Preco atual, preco ideal, margem e lucro mensal.</p>
            </div>
            <select className="h-10 rounded-md border border-line bg-white px-3 text-sm">
              <option>Todos os pratos</option>
              <option>Somente prejuizo</option>
              <option>Mais vendidos</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-panel text-xs uppercase tracking-[0.08em] text-steel">
                <tr>
                  <th className="px-4 py-3 font-semibold">Prato</th>
                  <th className="px-4 py-3 font-semibold">Preco atual</th>
                  <th className="px-4 py-3 font-semibold">Preco ideal</th>
                  <th className="px-4 py-3 font-semibold">Margem</th>
                  <th className="px-4 py-3 font-semibold">Lucro mensal</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {dishMetrics.map((dish) => (
                  <tr className="border-t border-line" key={dish.id}>
                    <td className="px-4 py-4">
                      <strong className="block font-semibold text-ink">{dish.name}</strong>
                      <span className="text-xs text-steel">
                        {dish.category} · {dish.quadrant}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium">{currency(dish.currentPrice)}</td>
                    <td className="px-4 py-4">
                      <span className={dish.idealPrice > dish.currentPrice ? "font-semibold text-tomato" : "font-semibold text-basil"}>
                        {currency(dish.idealPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{percent(dish.margin)}</td>
                    <td className={`px-4 py-4 font-semibold ${dish.monthlyProfit < 0 ? "text-tomato" : "text-basil"}`}>
                      {currency(dish.monthlyProfit)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={dish.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h3 className="text-base font-semibold">Alertas de Lucro</h3>
            <div className="mt-4 grid gap-3">
              {profitAlerts.map((alert) => (
                <article className="rounded-md border border-line bg-panel p-3" key={alert.id}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${alert.severity === "critical" ? "bg-tomato" : "bg-saffron"}`} />
                    <div>
                      <strong className="block text-sm">{alert.title}</strong>
                      <p className="mt-1 text-sm leading-5 text-steel">{alert.message}</p>
                      <span className={`mt-2 block text-sm font-semibold ${alert.impact < 0 ? "text-tomato" : "text-basil"}`}>
                        Impacto: {currency(alert.impact)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h3 className="text-base font-semibold">Simulador de Decisao</h3>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium">
                Prato
                <select className="h-10 rounded-md border border-line px-3">
                  <option>Pizza promocional</option>
                  <option>Burger artesanal</option>
                  <option>Pizza mussarela</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Novo preco
                <input className="h-10 rounded-md border border-line px-3" defaultValue="25,00" inputMode="decimal" />
              </label>
              <div className="rounded-md bg-[#eaf5ee] p-3 text-sm text-basil">
                <strong className="block">Resultado estimado</strong>
                Aumentar R$ 3,00 recupera cerca de {currency(300)} no mes.
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-line bg-white p-4 shadow-soft xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Mapa de Lucro</h3>
              <p className="mt-1 text-sm text-steel">Margem x venda estimada para decidir o que manter, ajustar ou remover.</p>
            </div>
            <Icon className="h-5 w-5 text-steel" name="chart" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {mostProfitable.map((dish) => (
              <article className="rounded-md border border-line p-3" key={dish.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-sm">{dish.name}</strong>
                    <p className="mt-1 text-xs text-steel">{dish.quadrant}</p>
                  </div>
                  <span className="text-sm font-semibold text-basil">{currency(dish.monthlyProfit)}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-panel">
                  <div
                    className={`h-2 rounded-full ${dish.status === "loss" ? "bg-tomato" : dish.status === "attention" ? "bg-saffron" : "bg-basil"}`}
                    style={{ width: `${Math.max(8, Math.min(100, dish.monthlySales / 2))}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
          <h3 className="text-base font-semibold">Custo Vivo</h3>
          <div className="mt-4 grid gap-3">
            {ingredientMetrics.map((ingredient) => (
              <article className="rounded-md border border-line p-3" key={ingredient.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-sm">{ingredient.name}</strong>
                    <span className="text-xs text-steel">{ingredient.affectedDishes} pratos afetados</span>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${ingredient.variation > 0 ? "text-tomato" : "text-basil"}`}>
                    <Icon className="h-3.5 w-3.5" name={ingredient.variation > 0 ? "arrow-up" : "arrow-down"} />
                    {percent(Math.abs(ingredient.variation))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-steel">Impacto mensal: {currency(ingredient.monthlyImpact)}</p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold">Preco Perfeito</h3>
            <p className="mt-1 text-sm text-steel">Menores ajustes recomendados para parar prejuizo sem baguncar o cardapio.</p>
          </div>
          <button className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-semibold" type="button">
            Recalcular precos
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {weakest.slice(0, 3).map((dish) => (
            <article className="rounded-md border border-line p-3" key={dish.id}>
              <strong className="block text-sm">{dish.name}</strong>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <span className="text-steel">Atual</span>
                <span className="text-right font-semibold">{currency(dish.currentPrice)}</span>
                <span className="text-steel">Ideal</span>
                <span className="text-right font-semibold text-basil">{currency(dish.idealPrice)}</span>
                <span className="text-steel">Diferenca</span>
                <span className="text-right font-semibold text-tomato">{currency(dish.idealPrice - dish.currentPrice)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
