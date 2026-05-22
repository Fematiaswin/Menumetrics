import { currency } from "@/lib/menu-metrics/demo-dashboard";

export function DemoAiDiagnosticPanel() {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Diagnostico de IA</h3>
          <p className="mt-1 text-sm leading-5 text-steel">
            Modo demo local: diagnostico simulado sem chamar OpenAI.
          </p>
        </div>
        <span className="rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-semibold text-basil">offline</span>
      </div>

      <div className="mt-4 rounded-md bg-panel p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#fff8e6] px-2 py-1 text-xs font-semibold text-[#8a5b00]">atencao</span>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-steel">dados demo</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink">
          O cardapio esta perto de saudavel, mas a Pizza promocional esta reduzindo o lucro do mes. A prioridade e corrigir
          esse item e recuperar margem nos pratos com alto volume.
        </p>
        <p className="mt-3 rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-semibold text-tomato">
          Pizza promocional gera prejuizo estimado de {currency(-270)} por mes.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          {
            label: "alto impacto",
            title: "Corrigir Pizza promocional",
            text: "O preco atual esta muito abaixo do preco ideal calculado.",
            impact: `Recuperacao potencial de ${currency(1633)} em receita mensal.`
          },
          {
            label: "medio impacto",
            title: "Ajustar Burger artesanal",
            text: "O prato vende bem, mas esta abaixo da margem alvo.",
            impact: `Aumento de R$ 2,80 pode adicionar ${currency(504)} ao mes.`
          },
          {
            label: "baixo impacto",
            title: "Promover Brownie da casa",
            text: "A margem e saudavel, mas o volume ainda e baixo.",
            impact: "Mais vendas melhoram lucro sem mexer nas despesas fixas."
          }
        ].map((suggestion) => (
          <article className="rounded-md border border-line p-3" key={suggestion.title}>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-basil">{suggestion.label}</span>
            <strong className="mt-2 block text-sm">{suggestion.title}</strong>
            <p className="mt-2 text-sm leading-5 text-steel">{suggestion.text}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{suggestion.impact}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
