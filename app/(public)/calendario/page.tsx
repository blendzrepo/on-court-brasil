"use client";

import { useState } from "react";
import { tournaments, formatDateRangePT, Tournament } from "@/lib/mockData";

type FilterCategory = "Todos" | "Grand Slam" | "ATP" | "WTA" | "Davis Cup";

const FILTERS: FilterCategory[] = ["Todos", "Grand Slam", "ATP", "WTA", "Davis Cup"];

const SURFACE_COLORS: Record<string, string> = {
  Saibro: "bg-orange-100 text-orange-800",
  Duro: "bg-blue-100 text-blue-800",
  Grama: "bg-green-100 text-green-800",
  Carpete: "bg-purple-100 text-purple-800",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Grand Slam": "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "ATP Masters 1000": "bg-blue-100 text-blue-800 border border-blue-200",
  "ATP 500": "bg-sky-100 text-sky-800 border border-sky-200",
  "ATP 250": "bg-cyan-100 text-cyan-800 border border-cyan-200",
  "WTA 1000": "bg-pink-100 text-pink-800 border border-pink-200",
  "WTA 500": "bg-rose-100 text-rose-800 border border-rose-200",
  "WTA 250": "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200",
  "Davis Cup": "bg-green-100 text-green-800 border border-green-200",
  "Copa Billie Jean King": "bg-purple-100 text-purple-800 border border-purple-200",
};

function matchesFilter(t: Tournament, filter: FilterCategory): boolean {
  if (filter === "Todos") return true;
  if (filter === "Grand Slam") return t.category === "Grand Slam";
  if (filter === "ATP") return t.category.startsWith("ATP");
  if (filter === "WTA") return t.category.startsWith("WTA");
  if (filter === "Davis Cup") return t.category === "Davis Cup" || t.category === "Copa Billie Jean King";
  return true;
}

export default function CalendarioPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("Todos");

  const sorted = [...tournaments].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const filtered = sorted.filter((t) => matchesFilter(t, activeFilter));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Calendário de Torneios 2026
        </h1>
        <p className="text-gray-500">
          Todos os Grand Slams, torneios ATP e WTA da temporada 2026 em um só lugar.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150 ${
              activeFilter === f
                ? "bg-primary-DEFAULT text-white"
                : "bg-gray-100 text-gray-600 hover:bg-green-light hover:text-primary-DEFAULT"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tournament list */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow duration-200"
          >
            {/* Date */}
            <div className="flex-shrink-0 w-full sm:w-36 text-sm text-gray-500 font-medium">
              {formatDateRangePT(t.startDate, t.endDate)}
            </div>

            {/* Name + location */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
                {t.name}
              </h3>
              <p className="text-gray-400 text-sm mt-0.5">
                {t.location}, {t.country}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  CATEGORY_COLORS[t.category] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {t.category}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  SURFACE_COLORS[t.surface] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {t.surface}
              </span>
            </div>

            {/* Prize */}
            {t.prize && t.prize !== "—" && (
              <div className="flex-shrink-0 text-right hidden lg:block">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Premiação</p>
                <p className="text-sm font-bold text-gray-700">{t.prize}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-16">
          Nenhum torneio encontrado para este filtro.
        </p>
      )}
    </div>
  );
}
