"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { Album, Sticker } from "@/lib/albums";
import { flagFor } from "@/lib/country-flags";
import { getStickerTypeConfig } from "@/lib/sticker-types";
import { useToast } from "@/lib/toast-context";
import { PriceModal } from "./inventory/price-modal";
import { StickerCard, type StockMap } from "./inventory/sticker-card";
import { buildCounterText } from "./inventory-counter-text";

/* ─── Bloco de seção com header + stickers (usado na view "Todas") ─── */
function SectionBlock({
  sectionName,
  sectionIndex,
  sectionCount,
  stickers,
  stock,
  lastSaved,
  toggleSticker,
  updateQuantity,
  setPriceModalSticker,
}: {
  sectionName: string;
  sectionIndex: number;
  sectionCount: string;
  stickers: Sticker[];
  stock: StockMap;
  lastSaved: string | null;
  toggleSticker: (code: string) => void;
  updateQuantity: (code: string, qty: number) => void;
  setPriceModalSticker: (s: Sticker) => void;
}) {
  return (
    <>
      <div
        data-section-index={sectionIndex}
        data-section-name={sectionName}
        className="col-span-full sticky top-0 z-10 scroll-mt-14 lg:scroll-mt-2 -mx-4 lg:-mx-6 px-4 lg:px-6 bg-zinc-950/92 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 py-2">
          {flagFor(sectionName) && (
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              {flagFor(sectionName)}
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
            {sectionName}
          </span>
          <span className="text-[10px] font-[family-name:var(--font-geist-mono)] text-zinc-500">
            {sectionCount}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 via-zinc-800/40 to-transparent" />
        </div>
      </div>
      {stickers.map((sticker) => (
        <StickerCard
          key={sticker.code}
          sticker={sticker}
          stock={stock}
          lastSaved={lastSaved}
          toggleSticker={toggleSticker}
          updateQuantity={updateQuantity}
          setPriceModalSticker={setPriceModalSticker}
        />
      ))}
    </>
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
  const toast = useToast();
  const [stock, setStock] = useState<StockMap>(initialStock);
  const [activeSection, setActiveSection] = useState<number | "all">("all");
  const [filter, setFilter] = useState<"all" | "in-stock" | "missing">("all");
  const [saving, startSaving] = useTransition();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceModalSticker, setPriceModalSticker] = useState<Sticker | null>(null);
  const [visibleSectionIndex, setVisibleSectionIndex] = useState<number>(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // PRO+ check para preço customizado
  const canUseCustomPrices = sellerPlan === "PRO" || sellerPlan === "UNLIMITED";

  const section = activeSection === "all" ? null : album.sections[activeSection];
  const allStickers = useMemo(() => album.sections.flatMap((s) => s.stickers), [album.sections]);
  const isSearching = search.trim().length >= 2;

  // Busca global por código/nome
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return album.sections
      .flatMap((s) => s.stickers)
      .filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [search, isSearching, album.sections]);

  // Filtra figurinhas
  const baseStickers = isSearching ? searchResults : section ? section.stickers : allStickers;
  const filteredStickers = baseStickers.filter((s) => {
    if (filter === "in-stock") return (stock[s.code]?.quantity || 0) > 0;
    if (filter === "missing") return !stock[s.code] || stock[s.code].quantity === 0;
    return true;
  });

  // Contagens do conjunto base (seção atual ou álbum todo)
  const baseCount = section ? section.stickers.length : allStickers.length;
  const baseInStock = (section ? section.stickers : allStickers).filter(
    (s) => (stock[s.code]?.quantity || 0) > 0
  ).length;
  const baseMissing = baseCount - baseInStock;

  // Total geral em estoque (só conta stickers que existem no album atual)
  const totalInStock = allStickers.filter((s) => (stock[s.code]?.quantity || 0) > 0).length;
  const totalUnits = allStickers.reduce((sum, s) => sum + (stock[s.code]?.quantity || 0), 0);

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
        try {
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
        } catch {
          toast.error("Erro ao salvar estoque");
        }
      });
    },
    [stock, album.slug, toast.error]
  );

  // Toggle rápido: 0 → 1, >0 → 0
  const toggleSticker = useCallback(
    (code: string) => {
      const current = stock[code]?.quantity || 0;
      updateQuantity(code, current > 0 ? 0 : 1);
    },
    [stock, updateQuantity]
  );

  // Marca todas da seção (ou todas do álbum) como "tenho 1"
  function markAllSection() {
    const targetStickers = section ? section.stickers : allStickers;
    startSaving(async () => {
      const items = targetStickers
        .filter((s) => !stock[s.code] || stock[s.code].quantity === 0)
        .map((s) => ({ stickerCode: s.code, quantity: 1 }));

      if (items.length === 0) return;

      try {
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
        toast.success("Estoque atualizado");
      } catch {
        toast.error("Erro ao salvar estoque");
      }
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
        try {
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
        } catch {
          toast.error("Erro ao salvar estoque");
        }
      });
      setPriceModalSticker(null);
    },
    [stock, album.slug, toast.error]
  );

  // Zerar seção (ou todas do álbum)
  function clearSection() {
    const targetStickers = section ? section.stickers : allStickers;
    startSaving(async () => {
      const items = targetStickers
        .filter((s) => (stock[s.code]?.quantity || 0) > 0)
        .map((s) => ({ stickerCode: s.code, quantity: 0 }));

      if (items.length === 0) return;

      try {
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
        toast.success("Estoque atualizado");
      } catch {
        toast.error("Erro ao salvar estoque");
      }
    });
  }

  // Scroll suave até uma seção (view "all") — usa scrollIntoView para auto-detectar
  // o scroll container correto (.content do painel-shell tem overflow-y: auto).
  const scrollToSection = useCallback((index: number) => {
    const el = document.querySelector<HTMLElement>(`[data-section-index="${index}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Scroll até o próximo sticker faltante visível
  const scrollToNextMissing = useCallback(() => {
    const missing = document.querySelectorAll<HTMLElement>('[data-missing="true"]');
    if (missing.length === 0) return;

    const next = Array.from(missing).find((el) => el.getBoundingClientRect().top > 40);
    const target = next ?? missing[0];
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Handler do sidebar: em "all" scrolla; em view isolada muda isolamento
  function handleSidebarSectionClick(index: number) {
    if (isSearching) setSearch("");
    if (activeSection === "all") {
      scrollToSection(index);
    } else {
      setActiveSection(index);
      setFilter("all");
    }
  }

  // Scroll-spy em view "all" — atualiza `visibleSectionIndex` (usa viewport como root)
  useEffect(() => {
    if (activeSection !== "all" || isSearching) return;

    const headers = Array.from(document.querySelectorAll<HTMLElement>("[data-section-index]"));
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            idx: Number.parseInt(e.target.getAttribute("data-section-index") || "-1", 10),
            top: e.boundingClientRect.top,
          }))
          .filter((v) => v.idx >= 0)
          .sort((a, b) => a.top - b.top);
        if (visibles.length > 0) setVisibleSectionIndex(visibles[0].idx);
      },
      { rootMargin: "-8px 0px -70% 0px", threshold: 0 }
    );

    headers.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [activeSection, isSearching, filter, album.sections]);

  // Atalhos de teclado: /, 1, 2, 3, Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable === true;

      // Escape no search → desfoca
      if (e.key === "Escape" && isEditable && target === searchInputRef.current) {
        (target as HTMLInputElement).blur();
        return;
      }

      if (isEditable) return;

      // "/" foca search
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === "1") setFilter("all");
      if (e.key === "2") setFilter("in-stock");
      if (e.key === "3") setFilter("missing");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:items-start">
      {/* Sidebar de seções */}
      <aside className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md lg:self-start lg:h-[calc(100vh-56px)] lg:w-52 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-x-auto lg:overflow-y-auto">
        <div className="flex lg:flex-col p-2 gap-1">
          {/* Header */}
          <div className="hidden lg:block px-3 py-2">
            <Link
              href="/painel/estoque"
              className="text-[10px] text-zinc-500 hover:text-accent-400 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <p className="text-sm font-semibold mt-2">Copa {album.year}</p>
            <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {totalInStock}/{allStickers.length} tipos · {totalUnits} unidades
            </p>
          </div>

          {/* Botão "Todas" */}
          <button
            type="button"
            aria-label="Ver todas as figurinhas"
            onClick={() => {
              setActiveSection("all");
              setFilter("all");
              setSearch("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeSection === "all" && !isSearching
                ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent"
            }`}
          >
            <span className="lg:flex lg:items-center lg:justify-between lg:gap-2">
              <span className="truncate">Todas</span>
              <span className="hidden lg:inline font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-600">
                {totalInStock}/{allStickers.length}
              </span>
            </span>
          </button>

          {album.sections.map((sec, i) => {
            const secStock = sec.stickers.filter((s) => (stock[s.code]?.quantity || 0) > 0).length;
            const isIsolated = i === activeSection && !isSearching;
            const isVisibleInAll =
              activeSection === "all" && !isSearching && i === visibleSectionIndex;

            return (
              <button
                key={sec.name}
                type="button"
                onClick={() => handleSidebarSectionClick(i)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border relative ${
                  isIsolated
                    ? "bg-accent-500/10 text-accent-400 border-accent-500/20"
                    : isVisibleInAll
                      ? "text-zinc-300 border-transparent lg:before:absolute lg:before:left-0 lg:before:top-1.5 lg:before:bottom-1.5 lg:before:w-0.5 lg:before:rounded-full lg:before:bg-accent-500/60 lg:pl-3.5 hover:text-zinc-200 hover:bg-zinc-800"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-transparent"
                }`}
                aria-current={isIsolated ? "true" : isVisibleInAll ? "location" : undefined}
              >
                <span className="lg:flex lg:items-center lg:justify-between lg:gap-2">
                  <span className="truncate">
                    {flagFor(sec.name) && (
                      <span className="mr-1.5" aria-hidden="true">
                        {flagFor(sec.name)}
                      </span>
                    )}
                    {sec.name}
                  </span>
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
      <div className="flex-1">
        <div className="p-2 lg:p-3">
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
                {(() => {
                  const visibleSection = album.sections[visibleSectionIndex];
                  const filteredInVisibleSection = visibleSection
                    ? visibleSection.stickers.filter((s) => {
                        if (filter === "in-stock") return (stock[s.code]?.quantity || 0) > 0;
                        if (filter === "missing")
                          return !stock[s.code] || stock[s.code].quantity === 0;
                        return true;
                      }).length
                    : 0;
                  const counter = buildCounterText({
                    isSearching,
                    filteredCount: filteredStickers.length,
                    baseInStock,
                    baseCount,
                    filter,
                    activeSection,
                    visibleSectionName: visibleSection?.name ?? null,
                    filteredInVisibleSection,
                    saving,
                  });
                  return (
                    <p className="text-[11px] sm:text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                      {counter.primary}
                      {counter.secondary && (
                        <span className="ml-2 text-zinc-400">· {counter.secondary}</span>
                      )}
                      {counter.contextHint && (
                        <span className="ml-1 text-zinc-500">({counter.contextHint})</span>
                      )}
                      {counter.saving && (
                        <span className="ml-2 text-accent-400">Salvando...</span>
                      )}
                    </p>
                  );
                })()}
              </div>

              {/* Ações em lote - compacto */}
              {!isSearching && (
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMarkAllConfirm(true)}
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
                      onClick={() => setShowClearConfirm(true)}
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
                    onClick={scrollToNextMissing}
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

          {/* Grid */}
          {filteredStickers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {isSearching ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                    />
                  )}
                </svg>
              </div>
              <p className="text-zinc-400 text-sm font-medium">
                {isSearching ? "Nenhuma figurinha encontrada" : "Nenhuma figurinha com este filtro"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2">
              {(() => {
                // Quando "all" está ativo e sem busca, renderizar com headers por seção
                if (activeSection === "all" && !isSearching) {
                  return album.sections.map((sec, i) => {
                    const secStickers = sec.stickers.filter((s) => {
                      if (filter === "in-stock") return (stock[s.code]?.quantity || 0) > 0;
                      if (filter === "missing")
                        return !stock[s.code] || stock[s.code].quantity === 0;
                      return true;
                    });
                    if (secStickers.length === 0) return null;
                    const secInStock = sec.stickers.filter(
                      (s) => (stock[s.code]?.quantity || 0) > 0
                    ).length;
                    return (
                      <SectionBlock
                        key={sec.name}
                        sectionName={sec.name}
                        sectionIndex={i}
                        sectionCount={`${secInStock}/${sec.stickers.length}`}
                        stickers={secStickers}
                        stock={stock}
                        lastSaved={lastSaved}
                        toggleSticker={toggleSticker}
                        updateQuantity={updateQuantity}
                        setPriceModalSticker={setPriceModalSticker}
                      />
                    );
                  });
                }
                // Seção individual ou busca — flat list
                return filteredStickers.map((sticker) => (
                  <StickerCard
                    key={sticker.code}
                    sticker={sticker}
                    stock={stock}
                    lastSaved={lastSaved}
                    toggleSticker={toggleSticker}
                    updateQuantity={updateQuantity}
                    setPriceModalSticker={setPriceModalSticker}
                  />
                ));
              })()}
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

      {/* Confirmações de ações destrutivas */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Zerar esta seção"
        description="Deseja remover todo o estoque desta seção? Esta ação não pode ser desfeita."
        confirmLabel="Zerar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          setShowClearConfirm(false);
          clearSection();
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
      <ConfirmDialog
        open={showMarkAllConfirm}
        title="Marcar todas como tenho 1"
        description="Deseja marcar todas as figurinhas desta seção como estoque = 1?"
        confirmLabel="Marcar todas"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setShowMarkAllConfirm(false);
          markAllSection();
        }}
        onCancel={() => setShowMarkAllConfirm(false)}
      />
    </div>
  );
}
