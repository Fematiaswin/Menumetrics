import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";

export function AuthShell({
  children,
  title,
  subtitle,
  footer
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-[#24211c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f6c15a] text-ink">
            <Icon className="h-5 w-5" name="plate" />
          </div>
          <div>
            <strong className="block text-lg">MenuMetrics</strong>
            <span className="text-sm text-white/60">Lucro real do cardapio</span>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#f6c15a]">Raio-X do Cardapio</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Descubra quais pratos dao lucro e quais estao queimando dinheiro.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/70">
            Ficha tecnica, insumos, preco ideal, alertas e margem em uma tela feita para decisao rapida.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link className="mb-8 flex items-center gap-3 lg:hidden" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f6c15a]">
              <Icon className="h-5 w-5" name="plate" />
            </span>
            <strong>MenuMetrics</strong>
          </Link>

          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-steel">{subtitle}</p>
          <div className="mt-6 rounded-lg border border-line bg-white p-5 shadow-soft">{children}</div>
          <p className="mt-5 text-center text-sm text-steel">{footer}</p>
        </div>
      </section>
    </main>
  );
}
