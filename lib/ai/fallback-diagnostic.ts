import type { AiDiagnosticRequest, AiDiagnosticResult, AiSeverity } from "@/lib/ai/types";

export function buildFallbackDiagnostic({ pricing }: AiDiagnosticRequest): AiDiagnosticResult {
  const orderedItems = [...pricing.menuItems].sort((a, b) => a.monthlyNetProfit - b.monthlyNetProfit);
  const weakestItem = orderedItems[0];
  const bestItem = [...pricing.menuItems].sort((a, b) => b.monthlyNetProfit - a.monthlyNetProfit)[0];
  const severity = getSeverity(pricing.lossItems, pricing.attentionItems);

  const diagnosisText =
    severity === "critical"
      ? `O cardapio tem risco financeiro claro: ${pricing.lossItems} prato(s) estao no prejuizo e o lucro mensal estimado e ${formatCurrency(pricing.totalMonthlyNetProfit)}. A prioridade agora e corrigir preco, custo ou venda dos itens em vermelho antes de expandir o cardapio.`
      : severity === "warning"
        ? `O cardapio ainda tem espaco para ajuste: ${pricing.attentionItems} prato(s) pedem atencao e o score medio esta em ${pricing.averageHealthScore}/100. Pequenas correcoes de preco e custo ja podem melhorar o lucro do mes.`
        : `O cardapio esta saudavel, com score medio de ${pricing.averageHealthScore}/100 e lucro mensal estimado de ${formatCurrency(pricing.totalMonthlyNetProfit)}. O proximo ganho vem de proteger margem e vender mais os pratos mais lucrativos.`;

  return {
    diagnosisText,
    severity,
    criticalAlert:
      severity === "critical" && weakestItem
        ? `${weakestItem.menuItemName} precisa de acao: lucro mensal estimado de ${formatCurrency(weakestItem.monthlyNetProfit)}.`
        : null,
    suggestions: [
      {
        title: weakestItem ? `Corrigir ${weakestItem.menuItemName}` : "Revisar prato com menor margem",
        rationale: weakestItem
          ? `O preco ideal calculado e ${formatCurrency(weakestItem.idealPrice)}, enquanto o preco atual e ${formatCurrency(weakestItem.currentPrice)}.`
          : "Sem produtos suficientes para identificar uma acao especifica.",
        financialImpact: weakestItem
          ? `Prioridade para recuperar ate ${formatCurrency(Math.max(0, weakestItem.idealPrice - weakestItem.currentPrice) * Math.max(1, pricing.totalMonthlySalesEstimate))} em receita potencial.`
          : "Impacto depende do cadastro de mais produtos.",
        priority: "high"
      },
      {
        title: "Reduzir custo dos itens em atencao",
        rationale: `${pricing.attentionItems + pricing.lossItems} prato(s) estao fora da zona saudavel.`,
        financialImpact: "Cada reducao de custo direto melhora a margem sem exigir aumento imediato de preco.",
        priority: "medium"
      },
      {
        title: bestItem ? `Vender mais ${bestItem.menuItemName}` : "Aumentar venda dos pratos saudaveis",
        rationale: bestItem
          ? `Este prato tem lucro mensal estimado de ${formatCurrency(bestItem.monthlyNetProfit)}.`
          : "Pratos saudaveis merecem destaque no cardapio e canais de venda.",
        financialImpact: "Direcionar demanda para itens rentaveis melhora o lucro sem aumentar despesas fixas.",
        priority: "low"
      }
    ]
  };
}

function getSeverity(lossItems: number, attentionItems: number): AiSeverity {
  if (lossItems > 0) return "critical";
  if (attentionItems > 0) return "warning";
  return "ok";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}
