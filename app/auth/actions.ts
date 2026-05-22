"use server";

import { redirect } from "next/navigation";

import { createAppSupabaseClient } from "@/lib/supabase/app-server";

export type AuthState = {
  error?: string;
};

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe email e senha." };
  }

  const supabase = createAppSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou senha invalidos." };
  }

  redirect("/app");
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Informe nome, email e senha." };
  }

  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = createAppSupabaseClient();
  const origin = String(formData.get("origin") ?? "");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(origin ? { emailRedirectTo: `${origin}/onboarding` } : {}),
      data: { name }
    }
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = createAppSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
