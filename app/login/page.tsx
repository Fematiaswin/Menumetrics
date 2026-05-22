import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { getCurrentUser } from "@/lib/supabase/app-server";

export default async function LoginPage() {
  if (isDemoModeEnabled()) redirect("/demo");

  const { user } = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <AuthShell
      footer={
        <>
          Ainda nao tem conta?{" "}
          <Link className="font-semibold text-basil" href="/signup">
            Criar conta
          </Link>
        </>
      }
      subtitle="Entre para acompanhar lucro, margem e alertas do seu cardapio."
      title="Entrar"
    >
      <AuthForm mode="login" />
      <div className="mt-4 rounded-md border border-line bg-panel p-3 text-sm text-steel">
        Quer testar sem configurar Supabase, Stripe ou OpenAI?{" "}
        <Link className="font-semibold text-basil" href="/demo">
          Abrir demo offline
        </Link>
      </div>
    </AuthShell>
  );
}
