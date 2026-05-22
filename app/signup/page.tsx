import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { getCurrentUser } from "@/lib/supabase/app-server";

export default async function SignupPage() {
  if (isDemoModeEnabled()) redirect("/demo");

  const { user } = await getCurrentUser();
  if (user) redirect("/onboarding");

  return (
    <AuthShell
      footer={
        <>
          Ja tem conta?{" "}
          <Link className="font-semibold text-basil" href="/login">
            Entrar
          </Link>
        </>
      }
      subtitle="Crie sua conta e configure o primeiro restaurante em menos de um minuto."
      title="Criar conta"
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
