import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "On Court Brasil | Notícias de Tênis",
  description:
    "O melhor do tênis mundial em português. Acompanhe notícias, resultados, rankings e o calendário completo de torneios ATP e WTA.",
  keywords: "tênis, ATP, WTA, Grand Slam, Roland Garros, Wimbledon, US Open, Australian Open, Brasil",
  openGraph: {
    title: "On Court Brasil | Notícias de Tênis",
    description: "O melhor do tênis mundial em português.",
    locale: "pt_BR",
    type: "website",
  },
};

/**
 * Root layout of the public site.
 *
 * Payload mounts its own admin under `app/(payload)` and that layout renders its
 * own <html>/<body>, so the project cannot keep a shared `app/layout.tsx`.
 * Each route group therefore owns its document shell.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-white text-gray-800 antialiased">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
