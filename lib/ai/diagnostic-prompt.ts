import type { AiDiagnosticRequest } from "@/lib/ai/types";

export const DIAGNOSTIC_SYSTEM_PROMPT = `Voce e um consultor financeiro especialista em pequenas empresas brasileiras de alimentacao.
Analise somente os dados fornecidos pelo motor financeiro.
Fale em portugues do Brasil, com linguagem simples, direta e sem jargoes.
Nao invente dados externos, benchmark de mercado, custos ou volume de venda.
Entregue exatamente 3 sugestoes priorizadas por impacto financeiro.`;

export function buildDiagnosticUserPrompt({ organization, pricing }: AiDiagnosticRequest): string {
  const payload = {
    empresa: {
      nome: organization.name,
      setor: organization.sector ?? "restaurante"
    },
    resumo: {
      scoreMedio: pricing.averageHealthScore,
      lucroLiquidoMensal: pricing.totalMonthlyNetProfit,
      despesasFixasMensais: pricing.monthlyFixedExpenses,
      vendaMensalEstimadaTotal: pricing.totalMonthlySalesEstimate,
      pratosSaudaveis: pricing.healthyItems,
      pratosEmAtencao: pricing.attentionItems,
      pratosComPrejuizo: pricing.lossItems
    },
    produtos: pricing.menuItems.map((item) => ({
      nome: item.menuItemName,
      categoria: item.category,
      precoAtual: item.currentPrice,
      precoMinimo: item.minimumPrice,
      precoIdeal: item.idealPrice,
      margemReal: item.realMargin,
      lucroMensal: item.monthlyNetProfit,
      lucroBrutoUnitario: item.grossProfitPerUnit,
      custoTotalUnitario: item.totalUnitCost,
      despesaFixaRateada: item.allocatedFixedExpense,
      pontoEquilibrioUnidades: item.breakEvenUnits,
      score: item.healthScore,
      status: item.status,
      quadrante: item.profitQuadrant
    }))
  };

  return `Gere um diagnostico financeiro do cardapio com base neste JSON:\n${JSON.stringify(payload, null, 2)}`;
}

export const diagnosticJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["diagnosisText", "suggestions", "severity", "criticalAlert"],
  properties: {
    diagnosisText: {
      type: "string",
      description: "Um paragrafo direto, com no maximo 3 frases."
    },
    severity: {
      type: "string",
      enum: ["ok", "warning", "critical"]
    },
    criticalAlert: {
      type: ["string", "null"],
      description: "Alerta critico se houver produto com prejuizo relevante; caso contrario, null."
    },
    suggestions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "rationale", "financialImpact", "priority"],
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          financialImpact: { type: "string" },
          priority: {
            type: "string",
            enum: ["high", "medium", "low"]
          }
        }
      }
    }
  }
} as const;
