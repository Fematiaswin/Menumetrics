"use client";

import { useFormState, useFormStatus } from "react-dom";

import { signIn, signUp, type AuthState } from "@/app/auth/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useFormState<AuthState, FormData>(action, {});
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <form action={formAction} className="grid gap-4">
      <input name="origin" type="hidden" value={origin} />
      {mode === "signup" ? (
        <label className="grid gap-1.5 text-sm font-medium">
          Nome
          <input
            className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil"
            name="name"
            placeholder="Seu nome"
            required
          />
        </label>
      ) : null}

      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil"
          name="email"
          placeholder="voce@restaurante.com"
          required
          type="email"
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Senha
        <input
          className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil"
          minLength={8}
          name="password"
          placeholder="Minimo 8 caracteres"
          required
          type="password"
        />
      </label>

      {state.error ? <p className="rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-medium text-tomato">{state.error}</p> : null}

      <SubmitButton label={mode === "login" ? "Entrar" : "Criar conta"} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-11 rounded-md bg-basil px-4 text-sm font-semibold text-white shadow-sm"
      disabled={pending}
      type="submit"
    >
      {pending ? "Aguarde..." : label}
    </button>
  );
}
