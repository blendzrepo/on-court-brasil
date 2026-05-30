import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-white text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
