"use client";

import { useMemo, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { completeRestaurantOnboarding, type OrganizationState } from "@/app/onboarding/actions";
import { Icon } from "@/components/ui/icon";

const steps = [
  { title: "Restaurante", detail: "Nome e despesas fixas" },
  { title: "Insumo", detail: "Custo vivo inicial" },
  { title: "Prato", detail: "Ficha tecnica simples" },
  { title: "Resultado", detail: "Primeiro Raio-X" }
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, formAction] = useFormState<OrganizationState, FormData>(completeRestaurantOnboarding, {});
  const progress = useMemo(() => `${((currentStep + 1) / steps.length) * 100}%`, [currentStep]);

  return (
    <form action={formAction} className="grid gap-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          {steps.map((step, index) => (
            <button
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left ${
                index === currentStep ? "border-basil bg-[#eef7f1]" : "border-line bg-white"
              }`}
              key={step.title}
              onClick={() => setCurrentStep(index)}
              type="button"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  index === currentStep ? "bg-basil text-white" : "bg-panel text-steel"
                }`}
              >
                {index + 1}
              </span>
              <span className="hidden min-w-0 sm:block">
                <strong className="block truncate text-xs">{step.title}</strong>
                <span className="block truncate text-xs text-steel">{step.detail}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 h-2 rounded-full bg-panel">
          <div className="h-2 rounded-full bg-basil transition-all" style={{ width: progress }} />
        </div>
      </div>

      <section className={currentStep === 0 ? "grid gap-4" : "hidden"}>
        <StepHeader
          icon="plate"
          title="Configure o restaurante"
          text="Comece com o minimo para o MenuMetrics calcular o primeiro rateio."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome do restaurante" name="restaurantName" placeholder="Pizzaria Bella Massa" required />
          <label className="grid gap-1.5 text-sm font-medium">
            Tipo de negocio
            <select className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil" name="sector">
              <option value="restaurante">Restaurante</option>
              <option value="pizzaria">Pizzaria</option>
              <option value="hamburgueria">Hamburgueria</option>
              <option value="cafeteria">Cafeteria</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>
          <TextField defaultValue="Despesas fixas mensais" label="Despesa principal" name="fixedExpenseDescription" required />
          <TextField defaultValue="3000" inputMode="decimal" label="Valor mensal" name="fixedExpenseAmount" prefix="R$" required />
        </div>
      </section>

      <section className={currentStep === 1 ? "grid gap-4" : "hidden"}>
        <StepHeader icon="box" title="Cadastre o primeiro insumo" text="Use o insumo que mais pesa no custo do prato." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField defaultValue="Queijo mussarela" label="Insumo" name="ingredientName" required />
          <label className="grid gap-1.5 text-sm font-medium">
            Unidade de compra
            <select className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil" name="ingredientUnit">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
              <option value="un">un</option>
            </select>
          </label>
          <TextField defaultValue="1" inputMode="decimal" label="Quantidade comprada" name="ingredientPurchaseQuantity" required />
          <TextField defaultValue="48" inputMode="decimal" label="Preco pago" name="ingredientPurchasePrice" prefix="R$" required />
        </div>
      </section>

      <section className={currentStep === 2 ? "grid gap-4" : "hidden"}>
        <StepHeader icon="calculator" title="Monte o primeiro prato" text="Uma ficha tecnica simples ja basta para mostrar o preco ideal." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField defaultValue="Pizza mussarela" label="Nome do prato" name="dishName" required />
          <TextField defaultValue="Pizzas" label="Categoria" name="dishCategory" required />
          <TextField defaultValue="200" inputMode="decimal" label="Quantidade usada do insumo" name="ingredientUsageQuantity" required />
          <label className="grid gap-1.5 text-sm font-medium">
            Unidade usada
            <select className="h-11 rounded-md border border-line bg-white px-3 outline-none focus:border-basil" name="ingredientUsageUnit">
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="un">un</option>
            </select>
          </label>
          <TextField defaultValue="4" inputMode="decimal" label="Mao de obra por prato" name="laborCost" prefix="R$" />
          <TextField defaultValue="3" inputMode="decimal" label="Embalagem por prato" name="packagingCost" prefix="R$" />
        </div>
      </section>

      <section className={currentStep === 3 ? "grid gap-4" : "hidden"}>
        <StepHeader icon="gauge" title="Gere o primeiro Raio-X" text="Informe preco e venda estimada para criar o snapshot inicial." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField defaultValue="45" inputMode="decimal" label="Preco atual" name="currentPrice" prefix="R$" required />
          <TextField defaultValue="100" inputMode="numeric" label="Vendas por mes" name="monthlySalesEstimate" required />
          <TextField defaultValue="30" inputMode="decimal" label="Margem desejada" name="desiredMargin" suffix="%" />
          <TextField defaultValue="6" inputMode="decimal" label="Imposto medio" name="taxRate" suffix="%" />
          <TextField defaultValue="0" inputMode="decimal" label="Comissao delivery" name="commissionRate" suffix="%" />
        </div>

        <div className="rounded-lg border border-line bg-panel p-4">
          <p className="text-sm font-semibold">O MenuMetrics vai criar agora:</p>
          <div className="mt-3 grid gap-2 text-sm text-steel sm:grid-cols-2">
            <span>Organizacao e usuario owner</span>
            <span>Despesa fixa inicial</span>
            <span>Primeiro insumo com historico</span>
            <span>Ficha tecnica do prato</span>
            <span>Preco Perfeito</span>
            <span>Snapshot do Raio-X</span>
          </div>
        </div>
      </section>

      {state.error ? <p className="rounded-md bg-[#fff0ec] px-3 py-2 text-sm font-medium text-tomato">{state.error}</p> : null}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <button
          className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          type="button"
        >
          Voltar
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            className="h-10 rounded-md bg-basil px-4 text-sm font-semibold text-white"
            onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))}
            type="button"
          >
            Continuar
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}

function StepHeader({ icon, title, text }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#eef7f1] text-basil">
        <Icon className="h-5 w-5" name={icon} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-steel">{text}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  prefix,
  suffix,
  ...props
  }: {
    label: string;
    name: string;
    prefix?: string;
    suffix?: string;
  } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <span className="flex h-11 items-center rounded-md border border-line bg-white focus-within:border-basil">
        {prefix ? <span className="pl-3 text-sm text-steel">{prefix}</span> : null}
        <input className="min-w-0 flex-1 bg-transparent px-3 outline-none" name={name} {...props} />
        {suffix ? <span className="pr-3 text-sm text-steel">{suffix}</span> : null}
      </span>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="h-10 rounded-md bg-basil px-4 text-sm font-semibold text-white" disabled={pending} type="submit">
      {pending ? "Gerando Raio-X..." : "Criar primeiro Raio-X"}
    </button>
  );
}
