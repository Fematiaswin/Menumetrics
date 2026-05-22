import type { MenuPricingResult } from "@/lib/pricing-engine/index.js";

export const AI_DIAGNOSTIC_PROMPT_VERSION = "diagnostic-v1";

export type AiSeverity = "ok" | "warning" | "critical";
export type AiSuggestionPriority = "high" | "medium" | "low";

export type AiSuggestion = {
  title: string;
  rationale: string;
  financialImpact: string;
  priority: AiSuggestionPriority;
};

export type AiDiagnosticResult = {
  diagnosisText: string;
  suggestions: AiSuggestion[];
  severity: AiSeverity;
  criticalAlert: string | null;
};

export type AiDiagnosticRequest = {
  organization: {
    id: string;
    name: string;
    sector: string | null;
  };
  pricing: MenuPricingResult;
};

export type AiDiagnosticResponse = {
  diagnostic: AiDiagnosticResult;
  model: string | null;
  fallback: boolean;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};
