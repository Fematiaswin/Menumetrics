import {
  DIAGNOSTIC_SYSTEM_PROMPT,
  buildDiagnosticUserPrompt,
  diagnosticJsonSchema
} from "@/lib/ai/diagnostic-prompt";
import { buildFallbackDiagnostic } from "@/lib/ai/fallback-diagnostic";
import type { AiDiagnosticRequest, AiDiagnosticResponse, AiDiagnosticResult } from "@/lib/ai/types";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export async function generateFinancialDiagnostic(input: AiDiagnosticRequest): Promise<AiDiagnosticResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_DIAGNOSTIC_MODEL ?? "gpt-5.4-mini";

  if (!apiKey) {
    return {
      diagnostic: buildFallbackDiagnostic(input),
      model: null,
      fallback: true
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: DIAGNOSTIC_SYSTEM_PROMPT,
        input: buildDiagnosticUserPrompt(input),
        max_output_tokens: 900,
        text: {
          format: {
            type: "json_schema",
            name: "financial_diagnostic",
            strict: true,
            schema: diagnosticJsonSchema
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const text = extractResponseText(data);
    const diagnostic = parseDiagnostic(text);

    return {
      diagnostic,
      model,
      fallback: false,
      usage: {
        ...(data.usage?.input_tokens === undefined ? {} : { inputTokens: data.usage.input_tokens }),
        ...(data.usage?.output_tokens === undefined ? {} : { outputTokens: data.usage.output_tokens })
      }
    };
  } catch {
    return {
      diagnostic: buildFallbackDiagnostic(input),
      model,
      fallback: true
    };
  }
}

function extractResponseText(response: OpenAIResponse): string {
  if (response.output_text) return response.output_text;

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function parseDiagnostic(text: string): AiDiagnosticResult {
  const parsed = JSON.parse(text) as AiDiagnosticResult;

  if (!parsed.diagnosisText || !Array.isArray(parsed.suggestions) || parsed.suggestions.length !== 3) {
    throw new Error("OpenAI diagnostic response did not match the expected shape.");
  }

  return parsed;
}
