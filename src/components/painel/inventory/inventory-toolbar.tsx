"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { Album } from "@/lib/albums";
import { buildCounterText } from "../inventory-counter-text";
import type { StockMap } from "./sticker-card";

type Filter = "all" | "in-stock" | "missing";

interface InventoryToolbarProps {
  album: Album;
  stock: StockMap;
  search: string;
  setSearch: (s: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  isSearching: boolean;
  filter: Filter;
  setFilter: (f: Filter) => void;
  activeSection: number | "all";
  visibleSectionIndex: number;
  section: Album["sections"][number] | null;
  filteredStickersCount: number;
  baseCount: number;
  baseInStock: number;
  baseMissing: number;
  saving: boolean;
  onMarkAll: () => void;
  onClearSection: () => void;
  onScrollToNextMissing: () => void;
}

export function InventoryToolbar({
  album,
  stock,
  search,
  setSearch,
  searchInputRef,
  isSearching,
  filter,
  setFilter,
  activeSection,
  visibleSectionIndex,
  section,
  filteredStickersCount,
  baseCount,
  baseInStock,
  baseMissing,
  saving,
  onMarkAll,
  onClearSection,
  onScrollToNextMissing,
}: InventoryToolbarProps) {
  const visibleSection = album.sections[visibleSectionIndex];
  const filteredInVisibleSection = visibleSection
    ? visibleSection.stickers.filter((s) => {
        if (filter === "in-stock") return (stock[s.code]?.quantity || 0) > 0;
        if (filter === "missing") return !stock[s.code] || stock[s.code].quantity === 0;
        return true;
      }).length
    : 0;
  const counter = buildCounterText({
    isSearching,
    filteredCount: filteredStickersCount,
    baseInStock,
    baseCount,
    filter,
    activeSection,
    visibleSectionName: visibleSection?.name ?? null,
    filteredInVisibleSection,
    saving,
  });

  return (
    <>
      {/* Barra de busca */}
      <div className="mb-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar figurinha por número ou nome..."
            aria-label="Buscar figurinha"
            className="w-full pl-9 pr-20 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent-500/40 focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 transition-colors"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[24px] min-w-[24px] flex items-center justify-center text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
              aria-label="Limpar busca"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-[10px] font-[family-name:var(--font-geist-mono)] text-zinc-500">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {!isSearching && section && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)] mb-1 truncate">
                <span className="text-sm leading-none shrink-0">{album.flag}</span>
                <span className="truncate">Copa {album.year}</span>
                <span className="text-zinc-700 shrink-0">/</span>
                <span className="text-accent-400 truncate">{section.name}</span>
              </div>
            )}
            <h3 className="text-base sm:text-lg font-semibold truncate">
              {isSearching
                ? `Resultados para "${search.trim()}"`
                : section
                  ? section.name
                  : "Todas as figurinhas"}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {counter.primary}
              {counter.secondary && (
                <span className="ml-2 text-zinc-400">· {counter.secondary}</span>
              )}
              {counter.contextHint && (
                <span className="ml-1 text-zinc-500">({counter.contextHint})</span>
              )}
              {counter.saving && <span className="ml-2 text-accent-400">Salvando...</span>}
            </p>
          </div>

          {/* Ações em lote - compacto */}
          {!isSearching && (
            <div className="flex gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onMarkAll}
                title="Marcar todas como tenho 1"
                className="hover:text-green-400 hover:border-green-500/40 active:bg-green-500/10"
              >
                Marcar todas
              </Button>
              {baseInStock > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearSection}
                  title="Zerar esta seção"
                  className="hover:text-red-400 hover:border-red-500/40 active:bg-red-500/10"
                >
                  Zerar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filtros com contagem + chip jump-to-missing */}
        {!isSearching && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 rounded-lg border border-zinc-800 overflow-hidden min-w-0">
              {(
                [
                  { key: "all", label: "Todas", count: baseCount, accent: "amber" },
                  { key: "in-stock", label: "Tenho", count: baseInStock, accent: "green" },
                  { key: "missing", label: "Faltam", count: baseMissing, accent: "red" },
                ] as const
              ).map(({ key, label, count, accent }) => {
                const active = filter === key;
                const activeClass =
                  accent === "amber"
                    ? "bg-accent-500/10 text-accent-400"
                    : accent === "green"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400";
                const countClass = active
                  ? "text-current/80"
                  : "text-zinc-600 font-[family-name:var(--font-geist-mono)]";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`flex-1 min-w-0 px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 active:bg-white/5 ${
                      active ? activeClass : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] ${countClass}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Chip jump-to-missing */}
            {filter !== "missing" && baseMissing > 0 && activeSection === "all" && (
              <button
                type="button"
                onClick={onScrollToNextMissing}
                title="Ir para a próxima figurinha faltante"
                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-[11px] font-medium text-red-300 hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center gap-1.5"
              >
                <span>{baseMissing} faltando</span>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Dica de atalhos (apenas lg+) */}
        <p className="hidden lg:block text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)]">
          atalhos · <kbd className="px-1 rounded bg-zinc-900 border border-zinc-800">/</kbd>{" "}
          buscar · <kbd className="px-1 rounded bg-zinc-900 border border-zinc-800">1</kbd>/
          <kbd className="px-1 rounded bg-zinc-900 border border-zinc-800">2</kbd>/
          <kbd className="px-1 rounded bg-zinc-900 border border-zinc-800">3</kbd> filtros
        </p>
      </div>
    </>
  );
}
