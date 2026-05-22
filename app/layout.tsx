import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "MenuMetrics",
  description: "Descubra quais pratos dão lucro e quais estão queimando dinheiro."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
