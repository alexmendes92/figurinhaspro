"use client";

import { useState, useCallback, useTransition, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Album, Sticker } from "@/lib/albums";
import { getStickerTypeConfig, getDefaultPrice } from "@/lib/sticker-types";

type StockMap = Record<string, { quantity: number; customPrice: number | null }>;

/* ─── Modal de preço customizado ─── */
function PriceModal({
  sticker,
  currentCustomPrice,
  canUseCustomPrices,
  onSave,
  onClear,
  onClose,
}: {
  sticker: Sticker;
  currentCustomPrice: number | null;
  canUseCustomPrices: boolean;
  onSave: (price: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultPrice = getDefaultPrice(sticker.type);
  const typeConf = getStickerTypeConfig(sticker.type);

  useEffect(() => {
    if (canUseCustomPrices) inputRef.current?.focus();
  }, [canUseCustomPrices]);

  function handleSave() {
    const val = parseFloat(inputRef.current?.value || "");
    if (!isNaN(val) && val > 0) onSave(val);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-xs mx-4 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header com imagem */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
          <div className="relative w-10 h-14 rounded-lg overflow-hidden border border-zinc-700 shrink-0">
            <Image src={sticker.image} alt={sticker.name} fill className="object-cover" sizes="40px" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{sticker.name}</p>
            <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)] flex items-center gap-1.5">
              {sticker.code}
              {sticker.type !== "regular" && (
                <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${typeConf.badgeClass}`}>
                  {typeConf.shortLabel}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-7 h-7 rounded-lg border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-all shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Preço padrão */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Preço padrão ({typeConf.shortLabel})</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-zinc-400">
              R${defaultPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {canUseCustomPrices ? (
            <>
              {/* Input de preço */}
              <div>
                <label className="text-[10px] text-zinc-500 font-medium block mb-1">Preço customizado</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">R$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.50"
                    min="0.50"
                    defaultValue={currentCustomPrice?.toFixed(2) ?? ""}
                    placeholder={defaultPrice.toFixed(2)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-[family-name:var(--font-geist-mono)] text-amber-400 font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
                >
                  Salvar preço
                </button>
                {currentCustomPrice !== null && (
                  <button
                    onClick={onClear}
                    className="px-3 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Gate PRO+ */
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-amber-400 font-medium mb-1">Recurso PRO</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Preço customizado por figurinha requer plano PRO ou superior.
              </p>
              <Link
                href="/painel/planos"
                className="inline-block mt-2 text-[10px] text-amber-400 font-semibold hover:underline"
              >
                Ver planos →
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function InventoryManager({
  album,
  initialStock,
  sellerPlan,
}: {
  album: Album;
  initialStock: StockMap;
  sellerPlan: string;
}) {
  const [stock, setStock] = useState<StockMap>(initialStock);
  const [activeSection, setActiveSection] = useState(0);
  const [filter, setFilter] = useState<"all" | "in-stock" | "missing">("all");
  const [saving, startSaving] = useTransition();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceModalSticker, setPriceModalSticker] = useState<Sticker | null>(null);

  // PRO+ check para preço customizado
  const canUseCustomPrices = true; // TODO: restaurar gate de plano depois → sellerPlan === "PRO" || sellerPlan === "UNLIMITED"

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

  // Atualiza preço customizado de uma figurinha
  const updateCustomPrice = useCallback(
    (stickerCode: string, customPrice: number | null) => {
      const current = stock[stickerCode] ?? { quantity: 0, customPrice: null };
      const newStock = {
        ...stock,
        [stickerCode]: { ...current, customPrice },
      };
      setStock(newStock);

      startSaving(async () => {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumSlug: album.slug,
            stickerCode,
            quantity: current.quantity,
            customPrice,
          }),
        });
        setLastSaved(stickerCode);
        setTimeout(() => setLastSaved(null), 1500);
      });
      setPriceModalSticker(null);
    },
    [stock, album.slug]
  );

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
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold truncate">
                  {isSearching ? `Resultados para "${search.trim()}"` : section.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
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

              {/* Ações em lote - compacto */}
              {!isSearching && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={markAllSection}
                    title="Marcar todas como tenho 1"
                    className="px-2.5 sm:px-3 py-2 rounded-lg border border-zinc-700 text-[11px] sm:text-xs text-zinc-400 hover:text-green-400 hover:border-green-500/40 transition-all active:bg-green-500/10"
                  >
                    Marcar todas
                  </button>
                  {sectionInStock > 0 && (
                    <button
                      onClick={clearSection}
                      title="Zerar esta seção"
                      className="px-2.5 sm:px-3 py-2 rounded-lg border border-zinc-700 text-[11px] sm:text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-all active:bg-red-500/10"
                    >
                      Zerar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filtros - full width no mobile */}
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
              {(["all", "in-stock", "missing"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-3 py-2.5 sm:py-2 text-xs font-medium transition-colors text-center active:bg-white/5 ${
                    filter === f
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f === "all" ? "Todas" : f === "in-stock" ? "Tenho" : "Faltam"}
                </button>
              ))}
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

                      {/* Preço customizado badge + botão */}
                      {hasIt && (
                        <button
                          onClick={() => setPriceModalSticker(sticker)}
                          className={`w-full mb-1 px-1.5 py-1 rounded text-[9px] font-[family-name:var(--font-geist-mono)] font-semibold transition-all flex items-center justify-center gap-1 ${
                            stock[sticker.code]?.customPrice
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                              : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                          }`}
                          title={stock[sticker.code]?.customPrice ? "Preço customizado" : "Definir preço"}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {stock[sticker.code]?.customPrice
                            ? `R$${stock[sticker.code].customPrice!.toFixed(2).replace(".", ",")}`
                            : "Preço"
                          }
                        </button>
                      )}

                      {hasIt && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(sticker.code, qty - 1)}
                            className="w-9 h-8 sm:w-8 sm:h-7 rounded bg-zinc-800 border border-zinc-700 text-sm sm:text-xs text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
                          >
                            −
                          </button>
                          <span className="text-[11px] font-[family-name:var(--font-geist-mono)] text-white w-5 text-center font-bold">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(sticker.code, qty + 1)}
                            className="w-9 h-8 sm:w-8 sm:h-7 rounded bg-zinc-800 border border-zinc-700 text-sm sm:text-xs text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
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

      {/* Modal de preço customizado */}
      {priceModalSticker && (
        <PriceModal
          sticker={priceModalSticker}
          currentCustomPrice={stock[priceModalSticker.code]?.customPrice ?? null}
          canUseCustomPrices={canUseCustomPrices}
          onSave={(price) => updateCustomPrice(priceModalSticker.code, price)}
          onClear={() => updateCustomPrice(priceModalSticker.code, null)}
          onClose={() => setPriceModalSticker(null)}
        />
      )}
    </div>
  );
}
