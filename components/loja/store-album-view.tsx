"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Album, Sticker } from "@/lib/albums";
import { getStickerTypeConfig } from "@/lib/sticker-types";
import { resolveUnitPrice, resolveQuantityDiscount } from "@/lib/price-resolver";
import type { SectionRule } from "@/lib/price-resolver";

interface CartItem {
  sticker: Sticker;
  price: number;
  quantity: number;
}

interface AlbumPill {
  slug: string;
  title: string;
  flag: string;
  inStockTypes: number;
  isCustom: boolean;
}

export default function StoreAlbumView({
  album,
  stockMap,
  priceMap,
  sellerSlug,
  sellerName,
  sellerPhone,
  sellerDescription,
  sellerBusinessHours,
  sellerPaymentMethods,
  availableAlbums,
  stickerSectionMap,
  sectionRulesMap,
  quantityTiers,
}: {
  album: Album;
  stockMap: Record<string, { quantity: number; customPrice: number | null }>;
  priceMap: Record<string, number>;
  sellerSlug: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerDescription?: string | null;
  sellerBusinessHours?: string | null;
  sellerPaymentMethods?: string | null;
  availableAlbums?: AlbumPill[];
  stickerSectionMap: Record<string, string>;
  sectionRulesMap: Record<string, { adjustType: string; value: number }>;
  quantityTiers: { minQuantity: number; discount: number }[];
}) {
  const storageKey = `fp_cart_${sellerSlug}_${album.slug}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const { items, updatedAt } = JSON.parse(raw);
      if (Date.now() - updatedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey);
        return [];
      }
      return items || [];
    } catch { return []; }
  });
  const [activeSection, setActiveSection] = useState<number | "all">("all");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    try {
      if (cart.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify({ items: cart, updatedAt: Date.now() }));
      }
    } catch { /* quota exceeded */ }
  }, [cart, storageKey]);
  const [search, setSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [missingCodes, setMissingCodes] = useState<Set<string>>(new Set());
  const [importText, setImportText] = useState("");

  const filterByMissing = missingCodes.size > 0;

  // Monta Map de seção para resolveUnitPrice
  const sectionRulesRef = useMemo(() => {
    const map = new Map<string, SectionRule>();
    for (const [name, rule] of Object.entries(sectionRulesMap)) {
      map.set(name, {
        sectionName: name,
        adjustType: rule.adjustType as "FLAT" | "OFFSET",
        value: rule.value,
      });
    }
    return map;
  }, [sectionRulesMap]);

  function getPrice(sticker: Sticker): number {
    return resolveUnitPrice({
      customPrice: stockMap[sticker.code]?.customPrice ?? null,
      stickerType: sticker.type,
      sectionName: stickerSectionMap[sticker.code] ?? "",
      albumTypeRules: priceMap,
      globalTypeRules: {},
      sectionRules: sectionRulesRef,
    });
  }

  function parseMissingList(text: string): Set<string> {
    // Aceita: vírgula, espaço, tab, quebra de linha, ponto-e-vírgula
    const raw = text
      .split(/[,;\t\n\r]+/)
      .flatMap((chunk) => chunk.trim().split(/\s+/))
      .map((code) => code.trim().toUpperCase())
      .filter((code) => code.length > 0);
    return new Set(raw);
  }

  function handleImport() {
    const codes = parseMissingList(importText);
    setMissingCodes(codes);
    setShowImportModal(false);
    setSearch("");
  }

  function clearMissingFilter() {
    setMissingCodes(new Set());
    setImportText("");
  }

  function addAllMissingToCart() {
    const allStickers = album.sections.flatMap((s) => s.stickers);
    const toAdd = allStickers.filter(
      (s) =>
        missingCodes.has(s.code.toUpperCase()) &&
        (stockMap[s.code]?.quantity || 0) > 0 &&
        !cartCodes.has(s.code)
    );
    setCart((prev) => {
      const newItems: CartItem[] = toAdd.map((sticker) => ({
        sticker,
        price: getPrice(sticker),
        quantity: 1,
      }));
      return [...prev, ...newItems];
    });
  }

  const section = activeSection === "all" ? null : album.sections[activeSection];
  const allAvailableStickers = useMemo(
    () => album.sections.flatMap((s) => s.stickers).filter((s) => (stockMap[s.code]?.quantity || 0) > 0),
    [album.sections, stockMap]
  );

  // Figurinhas em estoque (seção atual ou busca global)
  const isSearching = search.trim().length >= 2;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.trim().toLowerCase();
    return album.sections
      .flatMap((s) => s.stickers)
      .filter(
        (s) =>
          (stockMap[s.code]?.quantity || 0) > 0 &&
          (s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      );
  }, [search, isSearching, album.sections, stockMap]);

  // Figurinhas da lista que falta e que estão em estoque (cross-album)
  const missingMatches = useMemo(() => {
    if (!filterByMissing) return [];
    return album.sections
      .flatMap((s) => s.stickers)
      .filter(
        (s) =>
          missingCodes.has(s.code.toUpperCase()) &&
          (stockMap[s.code]?.quantity || 0) > 0
      );
  }, [filterByMissing, missingCodes, album.sections, stockMap]);

  const availableStickers = isSearching
    ? searchResults
    : filterByMissing
      ? missingMatches
      : section
        ? section.stickers.filter((s) => (stockMap[s.code]?.quantity || 0) > 0)
        : allAvailableStickers;

  const totalAvailable = useMemo(
    () => album.sections.flatMap((s) => s.stickers).filter((s) => (stockMap[s.code]?.quantity || 0) > 0).length,
    [album.sections, stockMap]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discountPercent = resolveQuantityDiscount(cartItemCount, quantityTiers);
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const cartTotal = cartSubtotal - discountAmount;

  const cartCodes = useMemo(
    () => new Set(cart.map((i) => i.sticker.code)),
    [cart]
  );

  function addToCart(sticker: Sticker) {
    const price = getPrice(sticker);
    const maxQty = stockMap[sticker.code]?.quantity || 1;
    setCart((prev) => {
      const existing = prev.find((i) => i.sticker.code === sticker.code);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) =>
          i.sticker.code === sticker.code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { sticker, price, quantity: 1 }];
    });
  }

  function updateCartQty(code: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.sticker.code !== code) return i;
          const maxQty = stockMap[code]?.quantity || 1;
          const newQty = Math.min(Math.max(0, i.quantity + delta), maxQty);
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0);
    });
  }

  function removeFromCart(code: string) {
    setCart((prev) => prev.filter((i) => i.sticker.code !== code));
  }

  function generateWhatsAppMessage(customerName: string): string {
    let msg = `Olá! Sou *${customerName}* e gostaria de comprar as seguintes figurinhas:\n\n`;
    msg += `*Copa ${album.year} - ${album.host}*\n`;
    msg += `────────────────\n`;
    cart.forEach((item) => {
      msg += `${item.sticker.code} - ${item.sticker.name}`;
      if (item.quantity > 1) msg += ` (×${item.quantity})`;
      msg += ` → R$${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n`;
    });
    msg += `────────────────\n`;
    if (discountPercent > 0) {
      msg += `Subtotal: R$${cartSubtotal.toFixed(2).replace(".", ",")}\n`;
      msg += `Desconto: ${discountPercent}% (${cartItemCount}+ figurinhas)\n`;
      msg += `*Total: R$${cartTotal.toFixed(2).replace(".", ",")}*\n`;
    } else {
      msg += `*Total: R$${cartTotal.toFixed(2).replace(".", ",")}*\n`;
    }
    msg += `*${cartItemCount} figurinhas*\n\n`;
    msg += `Pedido feito pela loja online.`;
    return msg;
  }

  function getWhatsAppUrl(customerName: string): string {
    const phone = sellerPhone?.replace(/\D/g, "") || "";
    const msg = encodeURIComponent(generateWhatsAppMessage(customerName));
    return `https://wa.me/55${phone}?text=${msg}`;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/loja/${sellerSlug}?browse=true`}
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">
                {album.flag} {album.title || `Copa ${album.year}`}
              </h1>
              <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)] truncate">
                {sellerName} · {totalAvailable} disponíveis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
          {/* Importar lista */}
          <button
            onClick={() => setShowImportModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
              filterByMissing
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200"
            }`}
            title="Importar lista que falta"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <span className="hidden sm:inline">{filterByMissing ? `Lista (${missingCodes.size})` : "Importar lista"}</span>
          </button>

          {/* Carrinho */}
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-amber-500/40 transition-all"
          >
            <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cart.length > 0 && (
              <>
                <span className="text-xs font-bold text-amber-400 font-[family-name:var(--font-geist-mono)] hidden sm:inline">
                  R${cartTotal.toFixed(2).replace(".", ",")}
                </span>
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              </>
            )}
          </button>
          </div>
        </div>

        {/* Info do vendedor (descrição, horário, pagamento) */}
        {(sellerDescription || sellerBusinessHours || sellerPaymentMethods) && (
          <div className="max-w-6xl mx-auto px-4 pb-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-500">
              {sellerDescription && (
                <span className="text-zinc-400">{sellerDescription}</span>
              )}
              {sellerBusinessHours && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {sellerBusinessHours}
                </span>
              )}
              {sellerPaymentMethods && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  {sellerPaymentMethods}
                </span>
              )}
              {sellerPhone && (
                <a
                  href={`https://wa.me/55${sellerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-500 hover:text-green-400 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Pills de álbum — troca rápida entre álbuns */}
        {availableAlbums && availableAlbums.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 pb-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {availableAlbums.map((a) => (
                <Link
                  key={a.slug}
                  href={`/loja/${sellerSlug}/${a.slug}`}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    a.slug === album.slug
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {a.flag} {a.title}
                  <span className="ml-1 text-[10px] text-zinc-600">({a.inStockTypes})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Barra de busca */}
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número ou nome (ex: BRA 5, Neymar)"
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
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar seções — oculta durante busca ou filtro de lista */}
        {!isSearching && !filterByMissing && (
          <aside className="lg:w-48 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-x-auto lg:overflow-y-auto">
            <div className="flex lg:flex-col p-2 gap-1">
              {/* Botão "Todas" */}
              <button
                onClick={() => setActiveSection("all")}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeSection === "all"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent"
                }`}
              >
                Todas
                <span className="ml-1 text-[10px] text-zinc-600">({totalAvailable})</span>
              </button>

              {album.sections.map((sec, i) => {
                const available = sec.stickers.filter(
                  (s) => (stockMap[s.code]?.quantity || 0) > 0
                ).length;
                if (available === 0) return null;

                return (
                  <button
                    key={sec.name}
                    onClick={() => setActiveSection(i)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      i === activeSection
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    {sec.name}
                    <span className="ml-1 text-[10px] text-zinc-600">({available})</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Grid de figurinhas */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Banner filtro lista que falta */}
          {filterByMissing && !isSearching && (
            <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-400">
                  Lista que falta ativa
                </p>
                <p className="text-xs text-zinc-400">
                  {missingCodes.size} códigos importados · {missingMatches.length} disponíveis em estoque
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {missingMatches.length > 0 && (
                  <button
                    onClick={addAllMissingToCart}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
                  >
                    Adicionar todas ao carrinho
                  </button>
                )}
                <button
                  onClick={clearMissingFilter}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-white hover:border-zinc-500 transition-colors"
                >
                  Limpar filtro
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg font-semibold">
              {isSearching
                ? `Resultados para "${search.trim()}"`
                : filterByMissing
                  ? "Figurinhas que faltam"
                  : section
                    ? section.name
                    : "Todas as figurinhas"}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {availableStickers.length > 0 && (
                <button
                  onClick={() => {
                    const cartCodes = new Set(cart.map((c) => c.sticker.code));
                    const toAdd = availableStickers.filter((s) => !cartCodes.has(s.code));
                    if (toAdd.length === 0) return;
                    setCart((prev) => [
                      ...prev,
                      ...toAdd.map((s) => ({ sticker: s, price: getPrice(s), quantity: 1 })),
                    ]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all"
                >
                  + Todas ({availableStickers.length})
                </button>
              )}
              <span className="text-xs text-zinc-500">
                {availableStickers.length} {isSearching ? "encontradas" : filterByMissing ? "em estoque" : "disponiveis"}
              </span>
            </div>
          </div>

          {availableStickers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-zinc-400 text-sm font-medium">
                {isSearching ? "Nenhuma figurinha encontrada" : "Nenhuma figurinha desta seção em estoque"}
              </p>
              {isSearching && (
                <p className="text-zinc-600 text-xs mt-1">Tente buscar por outro código ou nome</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {(() => {
                const renderSticker = (sticker: Sticker) => {
                  const price = getPrice(sticker);
                  const inCart = cartCodes.has(sticker.code);
                  const typeConf = getStickerTypeConfig(sticker.type);
                  const qty = stockMap[sticker.code]?.quantity || 0;
                  return (
                    <button
                      key={sticker.code}
                      onClick={() => addToCart(sticker)}
                      className={`group relative rounded-lg overflow-hidden border transition-all active:scale-95 sm:hover:scale-105 focus:outline-none ${
                        inCart
                          ? "border-green-500/40 ring-1 ring-green-500/20"
                          : "border-zinc-700 hover:border-amber-500/40 active:border-amber-500/40"
                      }`}
                    >
                      <div className="relative aspect-[2/3] bg-zinc-800">
                        <Image
                          src={sticker.image}
                          alt={`${sticker.code} - ${sticker.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, 12vw"
                        />
                        {!inCart && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end sm:items-center justify-center pb-2 sm:pb-0">
                            <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/90 sm:bg-amber-500 flex items-center justify-center shadow-lg">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        {inCart && (
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {sticker.type !== "regular" && (
                          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${typeConf.badgeClass}`}>
                            {typeConf.shortLabel}
                          </div>
                        )}
                        {qty > 1 && (
                          <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[8px] text-zinc-300 font-[family-name:var(--font-geist-mono)]">
                            {qty}x
                          </div>
                        )}
                      </div>
                      <div className="px-1.5 py-1.5 bg-zinc-900/90">
                        <div className="flex items-center justify-between">
                          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-400 truncate">
                            {sticker.code}
                          </span>
                          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-amber-400 font-semibold">
                            R${price.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-600 truncate mt-0.5">{sticker.name}</p>
                      </div>
                    </button>
                  );
                };

                // Quando "all" está ativo e sem busca/filtro, renderizar com headers por seção
                if (activeSection === "all" && !isSearching && !filterByMissing) {
                  return album.sections.map((sec) => {
                    const secAvailable = sec.stickers.filter(
                      (s) => (stockMap[s.code]?.quantity || 0) > 0
                    );
                    if (secAvailable.length === 0) return null;
                    return (
                      <React.Fragment key={sec.name}>
                        <div className="col-span-full">
                          <div className="flex items-center gap-2 py-2 mt-2 first:mt-0">
                            <span className="text-xs font-semibold text-zinc-400">{sec.name}</span>
                            <span className="text-[10px] font-[family-name:var(--font-geist-mono)] text-zinc-600">({secAvailable.length})</span>
                            <div className="flex-1 h-px bg-zinc-800" />
                          </div>
                        </div>
                        {secAvailable.map(renderSticker)}
                      </React.Fragment>
                    );
                  });
                }
                // Seção individual, busca ou filtro de lista
                return availableStickers.map(renderSticker);
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Modal importar lista que falta */}
      {showImportModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Importar lista que falta</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Cole os códigos das figurinhas que você precisa. Vamos mostrar só as que o vendedor tem em estoque.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"Ex: 1, 2, 3, FWC1, BRA5, ARG10\n\nAceita separados por vírgula, espaço ou um por linha"}
              rows={6}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-600 mt-1.5 mb-4">
              {importText.trim()
                ? `${parseMissingList(importText).size} códigos detectados`
                : "Dica: copie direto de um grupo de WhatsApp ou planilha"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              {filterByMissing && (
                <button
                  type="button"
                  onClick={() => {
                    clearMissingFilter();
                    setShowImportModal(false);
                  }}
                  className="py-2.5 px-4 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrinho drawer */}
      {showCart && (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col slide-in">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-semibold">Orçamento</h2>
                <p className="text-[10px] text-zinc-500">{cartItemCount} figurinhas selecionadas</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Carrinho vazio</p>
                  <p className="text-zinc-600 text-xs mt-1">Clique nas figurinhas para adicioná-las</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {cart.map((item) => (
                    <div key={item.sticker.code} className="flex items-center gap-3 px-4 py-3">
                      <div className="relative w-10 h-14 rounded overflow-hidden border border-zinc-700 shrink-0">
                        <Image src={item.sticker.image} alt={item.sticker.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.sticker.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">{item.sticker.code}</span>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">R${item.price.toFixed(2).replace(".", ",")} un.</span>
                        </div>
                        {/* Controles de quantidade */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <button
                            onClick={() => updateCartQty(item.sticker.code, -1)}
                            className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 active:bg-zinc-700 transition-colors"
                          >
                            <span className="text-sm leading-none">−</span>
                          </button>
                          <span className="text-xs font-bold font-[family-name:var(--font-geist-mono)] text-white w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.sticker.code, 1)}
                            className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 active:bg-zinc-700 transition-colors"
                          >
                            <span className="text-sm leading-none">+</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-[family-name:var(--font-geist-mono)] text-amber-400 font-bold">
                          R${(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                        <button onClick={() => removeFromCart(item.sticker.code)} className="text-zinc-600 hover:text-red-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-zinc-800 p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-zinc-400">{cartItemCount} figurinhas</span>
                      {cart.length !== cartItemCount && (
                        <span className="text-[10px] text-zinc-600 ml-1">({cart.length} tipos)</span>
                      )}
                    </div>
                    {discountPercent > 0 ? (
                      <span className="text-sm text-zinc-500 line-through font-[family-name:var(--font-geist-mono)]">
                        R${cartSubtotal.toFixed(2).replace(".", ",")}
                      </span>
                    ) : (
                      <span className="text-xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                        R${cartTotal.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>
                  {discountPercent > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4m0 0l4-4m-4 4h11.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Desconto {discountPercent}%
                        </span>
                        <span className="text-xs text-green-400 font-[family-name:var(--font-geist-mono)]">
                          -R${discountAmount.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50">
                        <span className="text-sm font-semibold text-white">Total</span>
                        <span className="text-xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                          R${cartTotal.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
                >
                  Finalizar Orçamento
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Finalizar Orçamento</h3>
            <p className="text-xs text-zinc-500 mb-4">Preencha seus dados para enviar o pedido</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const name = form.get("name") as string;

                if (sellerPhone) {
                  window.open(getWhatsAppUrl(name), "_blank");
                }

                fetch("/api/orders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sellerSlug,
                    customerName: name,
                    customerPhone: form.get("phone") || undefined,
                    channel: sellerPhone ? "WHATSAPP" : "SYSTEM",
                    discountPercent,
                    items: cart.map((item) => ({
                      albumSlug: album.slug,
                      stickerCode: item.sticker.code,
                      stickerName: item.sticker.name,
                      quantity: item.quantity,
                      unitPrice: item.price,
                    })),
                  }),
                });

                setShowCheckout(false);
                setCart([]);
                setShowSuccess(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Seu nome</label>
                <input
                  name="name"
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">WhatsApp (opcional)</label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* Resumo do pedido */}
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800/80">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Resumo do pedido</p>
                </div>
                <div className="max-h-32 overflow-y-auto divide-y divide-zinc-800/50">
                  {cart.map((item) => (
                    <div key={item.sticker.code} className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 truncate mr-2">
                        <span className="font-[family-name:var(--font-geist-mono)] text-zinc-500">{item.sticker.code}</span>{" "}
                        {item.sticker.name}
                        {item.quantity > 1 && <span className="text-zinc-600"> ×{item.quantity}</span>}
                      </span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-amber-400 shrink-0">
                        R${(item.price * item.quantity).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-zinc-700 space-y-1">
                  {discountPercent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500">Subtotal ({cartItemCount} fig.)</span>
                      <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                        R${cartSubtotal.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[10px] text-green-400">Desconto {discountPercent}%</span>
                      <span className="text-[10px] text-green-400 font-[family-name:var(--font-geist-mono)]">
                        -R${discountAmount.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400 font-medium">
                      {discountPercent > 0 ? "Total" : `${cartItemCount} figurinhas`}
                    </span>
                    <span className="font-bold text-amber-400 font-[family-name:var(--font-geist-mono)] text-sm">
                      R${cartTotal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                  {sellerPhone ? (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Enviar por WhatsApp
                    </>
                  ) : (
                    "Enviar Pedido"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showSuccess && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pedido enviado!</h3>
            <p className="text-sm text-zinc-400 mb-1">
              {sellerPhone
                ? "Seu orçamento foi enviado por WhatsApp."
                : "Seu pedido foi registrado no sistema."}
            </p>
            <p className="text-xs text-zinc-600 mb-6">
              O vendedor entrará em contato para confirmar.
            </p>
            <div className="flex gap-2">
              <Link
                href={`/loja/${sellerSlug}?browse=true`}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors text-center"
              >
                Ver outros álbuns
              </Link>
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors"
              >
                Continuar comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra fixa do carrinho (mobile) */}
      {cart.length > 0 && !showCart && !showCheckout && !showSuccess && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800 lg:hidden safe-area-bottom">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:bg-amber-400"
          >
            Ver orçamento ({cartItemCount}) — R${cartTotal.toFixed(2).replace(".", ",")}
          </button>
        </div>
      )}
    </div>
  );
}
