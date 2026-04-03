"use client";

import { useState, useCallback, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Album, Sticker } from "@/lib/albums";

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

  const section = album.sections[activeSection];

  // Filtra figurinhas
  const filteredStickers = section.stickers.filter((s) => {
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

      // Salva no servidor
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
              {totalInStock}/{album.totalStickers} em estoque
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
                }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  i === activeSection
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
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold">{section.name}</h3>
              <p className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {sectionInStock}/{section.stickers.length} em estoque
                {filter !== "all" && (
                  <span className="ml-2 text-zinc-400">
                    · {filteredStickers.length} exibidas
                  </span>
                )}
                {saving && (
                  <span className="ml-2 text-amber-400">Salvando...</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtros */}
              <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
                {(["all", "in-stock", "missing"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      filter === f
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f === "all" ? "Todas" : f === "in-stock" ? "Tenho" : "Faltam"}
                  </button>
                ))}
              </div>

              {/* Marcar todas */}
              <button
                onClick={markAllSection}
                className="px-3 py-1 rounded-lg border border-zinc-700 text-[10px] text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all"
              >
                Marcar todas
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
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
                      sizes="(max-width: 640px) 25vw, 10vw"
                    />

                    {/* Check overlay */}
                    {hasIt && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Tipo especial */}
                    {(sticker.type === "foil" || sticker.type === "shiny") && (
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-500/80 flex items-center justify-center">
                        <span className="text-[8px]">✨</span>
                      </div>
                    )}
                  </button>

                  {/* Código + controle de quantidade */}
                  <div className="px-1 py-1 bg-zinc-900/90">
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-zinc-400 truncate">
                        {sticker.code}
                      </span>
                      {hasIt && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() =>
                              updateQuantity(sticker.code, qty - 1)
                            }
                            className="w-4 h-4 rounded text-[10px] text-zinc-500 hover:text-white flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-[10px] font-[family-name:var(--font-geist-mono)] text-white w-3 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(sticker.code, qty + 1)
                            }
                            className="w-4 h-4 rounded text-[10px] text-zinc-500 hover:text-white flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
