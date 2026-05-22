"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Plan = {
  id: "free" | "starter" | "pro" | "agency";
  name: string;
  priceCents: number;
  maxMenuItems: number | null;
  maxUsers: number | null;
  aiDiagnosticsPerMonth: number | null;
};

type BillingResponse = {
  url?: string;
  error?: {
    message?: string;
  };
};

export function BillingPanel({ organizationId, currentPlan }: { organizationId: string; currentPlan: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPlans() {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/billing/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;
      const body = (await response.json()) as { plans?: Plan[] };
      if (isMounted) setPlans(body.plans ?? []);
    }

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  async function openCheckout(planId: Plan["id"]) {
    setIsLoading(planId);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Sessao expirada. Entre novamente para gerenciar o plano.");
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orgId: organizationId, plan: planId })
      });
      const body = (await response.json()) as BillingResponse;

      if (!response.ok || !body.url) {
        setError(body.error?.message ?? "Nao foi possivel abrir o checkout.");
        return;
      }

      window.location.href = body.url;
    } finally {
      setIsLoading(null);
    }
  }

  async function openPortal() {
    setIsLoading("portal");
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Sessao expirada. Entre novamente para gerenciar o plano.");
        return;
      }

      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orgId: organizationId })
      });
      const body = (await response.json()) as BillingResponse;

      if (!response.ok || !body.url) {
        setError(body.error?.message ?? "Nao foi possivel abrir o portal.");
        return;
      }

      window.location.href = body.url;
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Plano e billing</h3>
          <p className="mt-1 text-sm leading-5 text-steel">
            Plano atual: <strong className="text-ink">{currentPlan}</strong>
          </p>
        </div>
        <button
          className="h-10 rounded-md border border-line bg-panel px-4 text-sm font-semibold"
          disabled={isLoading !== null}
          onClick={openPortal}
          type="button"
        >
          {isLoading === "portal" ? "Abrindo..." : "Gerenciar assinatura"}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-medium text-tomato">{error}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article className="rounded-md border border-line p-3" key={plan.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="block text-sm">{plan.name}</strong>
                <span className="mt-1 block text-lg font-semibold">{formatPrice(plan.priceCents)}</span>
              </div>
              {plan.id === currentPlan ? (
                <span className="rounded-full bg-[#eef7f1] px-2 py-1 text-xs font-semibold text-basil">atual</span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-1 text-xs text-steel">
              <span>{plan.maxMenuItems === null ? "Pratos ilimitados" : `${plan.maxMenuItems} pratos`}</span>
              <span>{plan.maxUsers === null ? "Usuarios ilimitados" : `${plan.maxUsers} usuario(s)`}</span>
              <span>
                {plan.aiDiagnosticsPerMonth === null
                  ? "IA ilimitada"
                  : `${plan.aiDiagnosticsPerMonth} diagnostico(s) de IA/mes`}
              </span>
            </div>
            {plan.id !== "free" && plan.id !== currentPlan ? (
              <button
                className="mt-4 h-9 w-full rounded-md bg-basil px-3 text-sm font-semibold text-white"
                disabled={isLoading !== null}
                onClick={() => openCheckout(plan.id)}
                type="button"
              >
                {isLoading === plan.id ? "Abrindo..." : "Fazer upgrade"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
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

function formatPrice(priceCents: number): string {
  if (priceCents === 0) return "Gratis";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(priceCents / 100);
}
