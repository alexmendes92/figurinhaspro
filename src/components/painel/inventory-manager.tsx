"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import type { Album, Sticker } from "@/lib/albums";
import { flagFor } from "@/lib/country-flags";
import { useToast } from "@/lib/toast-context";
import { InventoryToolbar } from "./inventory/inventory-toolbar";
import { PriceModal } from "./inventory/price-modal";
import { SectionBlock } from "./inventory/section-block";
import { StickerCard, type StockMap } from "./inventory/sticker-card";

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
          <InventoryToolbar
            album={album}
            stock={stock}
            search={search}
            setSearch={setSearch}
            searchInputRef={searchInputRef}
            isSearching={isSearching}
            filter={filter}
            setFilter={setFilter}
            activeSection={activeSection}
            visibleSectionIndex={visibleSectionIndex}
            section={section}
            filteredStickersCount={filteredStickers.length}
            baseCount={baseCount}
            baseInStock={baseInStock}
            baseMissing={baseMissing}
            saving={saving}
            onMarkAll={() => setShowMarkAllConfirm(true)}
            onClearSection={() => setShowClearConfirm(true)}
            onScrollToNextMissing={scrollToNextMissing}
          />

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
