import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Icon } from "@/components/ui/icon";
import { getCurrentUser } from "@/lib/supabase/app-server";

export default async function OnboardingPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships?.[0]?.organization_id) {
    redirect(`/app?orgId=${memberships[0].organization_id}`);
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg bg-[#24211c] p-6 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f6c15a] text-ink">
              <Icon className="h-5 w-5" name="plate" />
            </div>
            <div>
              <strong className="block text-lg">MenuMetrics</strong>
              <span className="text-sm text-white/60">Onboarding guiado</span>
            </div>
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#f6c15a]">Primeiro Raio-X</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">
              Cadastre o minimo e veja se um prato da lucro.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/70">
              O objetivo nao e preencher o sistema inteiro. E gerar uma decisao clara em poucos minutos.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {[
              "Cria sua organizacao com RLS multiempresa",
              "Salva primeiro insumo e historico de preco",
              "Monta ficha tecnica inicial",
              "Calcula preco ideal e snapshot do cardapio"
            ].map((item) => (
              <div className="flex items-start gap-3 rounded-md border border-white/10 bg-white/10 p-3" key={item}>
                <span className="mt-1 h-2 w-2 rounded-full bg-[#f6c15a]" />
                <span className="text-sm leading-5 text-white/78">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm font-semibold text-basil">Etapa 7</p>
          <h2 className="mt-2 text-2xl font-semibold">Onboarding do restaurante</h2>
          <p className="mt-2 text-sm leading-6 text-steel">
            Responda apenas o essencial. Depois voce pode cadastrar mais pratos, insumos e membros.
          </p>
          <div className="mt-6">
            <OnboardingWizard />
          </div>
        </section>
      </section>
    </main>
  );
}
