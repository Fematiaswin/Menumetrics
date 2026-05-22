const demoPlans = [
  { id: "free", name: "Gratuito", price: "Gratis", detail: "3 pratos, sem IA" },
  { id: "starter", name: "Starter", price: "R$ 67/mes", detail: "20 pratos, 1 diagnostico IA/mes" },
  { id: "pro", name: "Pro", price: "R$ 147/mes", detail: "Pratos ilimitados, IA ilimitada" },
  { id: "agency", name: "Agencia", price: "R$ 397/mes", detail: "Multiempresa e white-label" }
];

export function DemoBillingPanel({ currentPlan }: { currentPlan: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Plano e billing</h3>
          <p className="mt-1 text-sm leading-5 text-steel">
            Modo demo local: Stripe nao e chamado. Plano atual: <strong className="text-ink">{currentPlan}</strong>
          </p>
        </div>
        <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-steel">checkout simulado</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {demoPlans.map((plan) => (
          <article className="rounded-md border border-line p-3" key={plan.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm">{plan.name}</strong>
                <span className="mt-1 block text-lg font-semibold">{plan.price}</span>
              </div>
              {plan.id === currentPlan ? (
                <span className="rounded-full bg-[#eef7f1] px-2 py-1 text-xs font-semibold text-basil">atual</span>
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-steel">{plan.detail}</p>
            {plan.id !== "free" && plan.id !== currentPlan ? (
              <button className="mt-4 h-9 w-full rounded-md bg-panel px-3 text-sm font-semibold text-steel" type="button">
                Upgrade demo
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
