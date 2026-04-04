"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Album, Sticker } from "@/lib/albums";
import { getStickerTypeConfig } from "@/lib/sticker-types";

type StockMap = Record<string, { quantity: number; customPrice: number | null }>;

export default function InventoryManager({
  album,
  initialStock,
}: {
  album: Album;
  initialStock: StockMap;
}) {
  const [stock, setStock] = useState<StockMap>(initialStock);
  const [activeSection, setActiveSection] = useState(0);
  const [filter, setFilter] = useState<"all" | "in-stock" | "missing">("all");
  const [saving, startSaving] = useTransition();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const section = album.sections[activeSection];
  const isSearching = search.trim().length >= 2;

  // Busca global por código/nome
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return album.sections
      .flatMap((s) => s.stickers)
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
  }, [search, isSearching, album.sections]);

  // Filtra figurinhas
  const baseStickers = isSearching ? searchResults : section.stickers;
  const filteredStickers = baseStickers.filter((s) => {
    if (filter === "in-stock") return (stock[s.code]?.quantity || 0) > 0;
    if (filter === "missing") return !stock[s.code] || stock[s.code].quantity === 0;
    return true;
  });

  // Conta em estoque para esta seção
  const sectionInStock = section.stickers.filter(
    (s) => (stock[s.code]?.quantity || 0) > 0
  ).length;

  // Total geral em estoque
  const totalInStock = Object.values(stock).filter((s) => s.quantity > 0).length;
  const totalUnits = Object.values(stock).reduce((sum, s) => sum + s.quantity, 0);

  // Atualiza quantidade e salva no servidor
  const updateQuantity = useCallback(
    (stickerCode: string, quantity: number) => {
      const newStock = {
        ...stock,
        [stickerCode]: {
          quantity: Math.max(0, quantity),
          customPrice: stock[stickerCode]?.customPrice ?? null,
        },
      };
      setStock(newStock);

      startSaving(async () => {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumSlug: album.slug,
            stickerCode,
            quantity: Math.max(0, quantity),
            customPrice: newStock[stickerCode]?.customPrice ?? null,
          }),
        });
        setLastSaved(stickerCode);
        setTimeout(() => setLastSaved(null), 1500);
      });
    },
    [stock, album.slug]
  );

  // Toggle rápido: 0 → 1, >0 → 0
  const toggleSticker = useCallback(
    (code: string) => {
      const current = stock[code]?.quantity || 0;
      updateQuantity(code, current > 0 ? 0 : 1);
    },
    [stock, updateQuantity]
  );

  // Marca todas da seção como "tenho 1"
  function markAllSection() {
    startSaving(async () => {
      const items = section.stickers
        .filter((s) => !stock[s.code] || stock[s.code].quantity === 0)
        .map((s) => ({ stickerCode: s.code, quantity: 1 }));

      if (items.length === 0) return;

      await fetch("/api/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug: album.slug, items }),
      });

      const newStock = { ...stock };
      items.forEach((item) => {
        newStock[item.stickerCode] = { quantity: 1, customPrice: null };
      });
      setStock(newStock);
    });
  }

  // Zerar seção
  function clearSection() {
    startSaving(async () => {
      const items = section.stickers
        .filter((s) => (stock[s.code]?.quantity || 0) > 0)
        .map((s) => ({ stickerCode: s.code, quantity: 0 }));

      if (items.length === 0) return;

      await fetch("/api/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumSlug: album.slug, items }),
      });

      const newStock = { ...stock };
      items.forEach((item) => {
        newStock[item.stickerCode] = { quantity: 0, customPrice: null };
      });
      setStock(newStock);
    });
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full">
      {/* Sidebar de seções */}
      <aside className="lg:w-52 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/50 overflow-x-auto lg:overflow-y-auto">
        <div className="flex lg:flex-col p-2 gap-1">
          {/* Header */}
          <div className="hidden lg:block px-3 py-2">
            <Link
              href="/painel/estoque"
              className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <p className="text-sm font-semibold mt-2">
              {album.flag} Copa {album.year}
            </p>
            <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {totalInStock}/{album.totalStickers} tipos · {totalUnits} unidades
            </p>
          </div>

          {album.sections.map((sec, i) => {
            const secStock = sec.stickers.filter(
              (s) => (stock[s.code]?.quantity || 0) > 0
            ).length;

            return (
              <button
                key={sec.name}
                onClick={() => {
                  setActiveSection(i);
                  setFilter("all");
                  setSearch("");
                }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  i === activeSection && !isSearching
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <span className="lg:flex lg:items-center lg:justify-between lg:gap-2">
                  <span className="truncate">{sec.name}</span>
                  <span className="hidden lg:inline font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-600">
                    {secStock}/{sec.stickers.length}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Grid de figurinhas */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          {/* Barra de busca */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar figurinha por número ou nome..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold truncate">
                {isSearching ? `Resultados para "${search.trim()}"` : section.name}
              </h3>
              <p className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {isSearching ? (
                  <>{filteredStickers.length} encontradas</>
                ) : (
                  <>
                    {sectionInStock}/{section.stickers.length} em estoque
                    {filter !== "all" && (
                      <span className="ml-2 text-zinc-400">
                        · {filteredStickers.length} exibidas
                      </span>
                    )}
                  </>
                )}
                {saving && (
                  <span className="ml-2 text-amber-400">Salvando...</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtros */}
              <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
                {(["all", "in-stock", "missing"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      filter === f
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f === "all" ? "Todas" : f === "in-stock" ? "Tenho" : "Faltam"}
                  </button>
                ))}
              </div>

              {/* Ações em lote */}
              {!isSearching && (
                <div className="flex gap-1.5">
                  <button
                    onClick={markAllSection}
                    title="Marcar todas como tenho 1"
                    className="px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-green-400 hover:border-green-500/40 transition-all"
                  >
                    Marcar todas
                  </button>
                  {sectionInStock > 0 && (
                    <button
                      onClick={clearSection}
                      title="Zerar esta seção"
                      className="px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-all"
                    >
                      Zerar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          {filteredStickers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {isSearching ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  )}
                </svg>
              </div>
              <p className="text-zinc-400 text-sm font-medium">
                {isSearching ? "Nenhuma figurinha encontrada" : "Nenhuma figurinha com este filtro"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2">
              {filteredStickers.map((sticker) => {
                const qty = stock[sticker.code]?.quantity || 0;
                const hasIt = qty > 0;
                const justSaved = lastSaved === sticker.code;

                return (
                  <div
                    key={sticker.code}
                    className={`relative rounded-lg overflow-hidden border transition-all ${
                      hasIt
                        ? "border-green-500/40 ring-1 ring-green-500/10"
                        : "border-zinc-800 opacity-50"
                    } ${justSaved ? "sticker-added" : ""}`}
                  >
                    {/* Imagem — clique toggle */}
                    <button
                      onClick={() => toggleSticker(sticker.code)}
                      className="w-full relative aspect-[2/3] bg-zinc-800"
                    >
                      <Image
                        src={sticker.image}
                        alt={`${sticker.code} - ${sticker.name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 11vw"
                      />

                      {/* Check overlay */}
                      {hasIt && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {/* Tipo especial */}
                      {sticker.type !== "regular" && (
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${getStickerTypeConfig(sticker.type).badgeClass}`}>
                          {getStickerTypeConfig(sticker.type).shortLabel}
                        </div>
                      )}
                    </button>

                    {/* Código + controle de quantidade */}
                    <div className="px-1.5 py-1.5 bg-zinc-900/90">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-400 truncate">
                          {sticker.code}
                        </span>
                        {hasIt && (
                          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-green-400 font-bold">
                            {qty}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-600 truncate mb-1">{sticker.name}</p>
                      {hasIt && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(sticker.code, qty - 1)}
                            className="w-8 h-7 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
                          >
                            −
                          </button>
                          <span className="text-[11px] font-[family-name:var(--font-geist-mono)] text-white w-5 text-center font-bold">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(sticker.code, qty + 1)}
                            className="w-8 h-7 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
