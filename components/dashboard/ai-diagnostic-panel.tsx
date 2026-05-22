"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Suggestion = {
  title: string;
  rationale: string;
  financialImpact: string;
  priority: "high" | "medium" | "low";
};

type GeneratedDiagnostic = {
  diagnosisText: string;
  suggestions: Suggestion[];
  severity: "ok" | "warning" | "critical";
  criticalAlert: string | null;
};

type DiagnosticResponse = {
  generated: GeneratedDiagnostic;
  fallback: boolean;
  snapshotsCreated: number;
};

type StoredDiagnostic = {
  diagnosis_text: string;
  suggestions: Suggestion[];
  severity: "ok" | "warning" | "critical";
};

export function AiDiagnosticPanel({ organizationId }: { organizationId: string }) {
  const [diagnostic, setDiagnostic] = useState<GeneratedDiagnostic | null>(null);
  const [fallback, setFallback] = useState(false);
  const [snapshotsCreated, setSnapshotsCreated] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestDiagnostic() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch(`/api/ai/diagnostics?orgId=${organizationId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) return;

        const body = (await response.json()) as { diagnostics?: StoredDiagnostic[] };
        const latest = body.diagnostics?.[0];
        if (!latest || !isMounted) return;

        setDiagnostic({
          diagnosisText: latest.diagnosis_text,
          suggestions: latest.suggestions,
          severity: latest.severity,
          criticalAlert: null
        });
      } catch {
        // Loading the previous diagnostic is a convenience; generation still works.
      }
    }

    void loadLatestDiagnostic();

    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  async function handleGenerateDiagnostic() {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Sessao expirada. Entre novamente para analisar o cardapio.");
        return;
      }

      const response = await fetch("/api/ai/diagnostics", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orgId: organizationId })
      });

      const body = (await response.json()) as DiagnosticResponse | { error?: { message?: string } };
      if (!response.ok) {
        setError("error" in body ? body.error?.message ?? "Nao foi possivel gerar o diagnostico." : "Nao foi possivel gerar o diagnostico.");
        return;
      }

      const result = body as DiagnosticResponse;
      setDiagnostic(result.generated);
      setFallback(result.fallback);
      setSnapshotsCreated(result.snapshotsCreated);
    } catch {
      setError("Nao foi possivel conectar ao diagnostico de IA.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Diagnostico de IA</h3>
          <p className="mt-1 text-sm leading-5 text-steel">
            Analise os resultados do motor financeiro e gere 3 acoes priorizadas.
          </p>
        </div>
        <button
          className="h-10 rounded-md bg-basil px-4 text-sm font-semibold text-white shadow-sm"
          disabled={isLoading}
          onClick={handleGenerateDiagnostic}
          type="button"
        >
          {isLoading ? "Analisando..." : "Analisar cardapio"}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-medium text-tomato">{error}</p> : null}

      {diagnostic ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-md bg-panel p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={getSeverityClassName(diagnostic.severity)}>{getSeverityLabel(diagnostic.severity)}</span>
              {fallback ? <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-steel">fallback sem IA</span> : null}
              {snapshotsCreated > 0 ? (
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-steel">
                  {snapshotsCreated} snapshot(s)
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-ink">{diagnostic.diagnosisText}</p>
            {diagnostic.criticalAlert ? (
              <p className="mt-3 rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-semibold text-tomato">
                {diagnostic.criticalAlert}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {diagnostic.suggestions.map((suggestion) => (
              <article className="rounded-md border border-line p-3" key={suggestion.title}>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-basil">
                  {getPriorityLabel(suggestion.priority)}
                </span>
                <strong className="mt-2 block text-sm">{suggestion.title}</strong>
                <p className="mt-2 text-sm leading-5 text-steel">{suggestion.rationale}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{suggestion.financialImpact}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

function getSeverityClassName(severity: GeneratedDiagnostic["severity"]): string {
  const base = "rounded-full px-2 py-1 text-xs font-semibold";
  if (severity === "critical") return `${base} bg-[#fff0ec] text-tomato`;
  if (severity === "warning") return `${base} bg-[#fff8e6] text-[#8a5b00]`;
  return `${base} bg-[#eef7f1] text-basil`;
}

function getSeverityLabel(severity: GeneratedDiagnostic["severity"]): string {
  if (severity === "critical") return "critico";
  if (severity === "warning") return "atencao";
  return "saudavel";
}

function getPriorityLabel(priority: Suggestion["priority"]): string {
  if (priority === "high") return "alto impacto";
  if (priority === "medium") return "medio impacto";
  return "baixo impacto";
}
