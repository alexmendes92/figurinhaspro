"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Album, Sticker } from "@/lib/albums";
import { getStickerTypeConfig, getDefaultPrice } from "@/lib/sticker-types";

interface CartItem {
  sticker: Sticker;
  price: number;
  quantity: number;
}

function getPrice(
  sticker: Sticker,
  stockMap: Record<string, { quantity: number; customPrice: number | null }>,
  priceMap: Record<string, number>
): number {
  const custom = stockMap[sticker.code]?.customPrice;
  if (custom != null) return custom;
  return priceMap[sticker.type] ?? getDefaultPrice(sticker.type);
}

export default function StoreAlbumView({
  album,
  stockMap,
  priceMap,
  sellerSlug,
  sellerName,
  sellerPhone,
}: {
  album: Album;
  stockMap: Record<string, { quantity: number; customPrice: number | null }>;
  priceMap: Record<string, number>;
  sellerSlug: string;
  sellerName: string;
  sellerPhone: string | null;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [search, setSearch] = useState("");

  const section = album.sections[activeSection];

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

  const availableStickers = isSearching
    ? searchResults
    : section.stickers.filter((s) => (stockMap[s.code]?.quantity || 0) > 0);

  const totalAvailable = useMemo(
    () => album.sections.flatMap((s) => s.stickers).filter((s) => (stockMap[s.code]?.quantity || 0) > 0).length,
    [album.sections, stockMap]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartCodes = useMemo(
    () => new Set(cart.map((i) => i.sticker.code)),
    [cart]
  );

  function addToCart(sticker: Sticker) {
    const price = getPrice(sticker, stockMap, priceMap);
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
    msg += `*Total: R$${cartTotal.toFixed(2).replace(".", ",")}*\n`;
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
          <div className="flex items-center gap-3">
            <Link
              href={`/loja/${sellerSlug}`}
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-sm font-semibold">
                {album.flag} Copa {album.year}
              </h1>
              <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {sellerName} · {totalAvailable} disponíveis
              </p>
            </div>
          </div>

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
        {/* Sidebar seções — oculta durante busca */}
        {!isSearching && (
          <aside className="lg:w-48 border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-x-auto lg:overflow-y-auto">
            <div className="flex lg:flex-col p-2 gap-1">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {isSearching ? `Resultados para "${search.trim()}"` : section.name}
            </h3>
            <span className="text-xs text-zinc-500">
              {availableStickers.length} {isSearching ? "encontradas" : "disponíveis"}
            </span>
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
              {availableStickers.map((sticker) => {
                const price = getPrice(sticker, stockMap, priceMap);
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
                      {/* Add-to-cart overlay — visible on hover (desktop) or always subtle on mobile */}
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
                      {/* Badge de tipo especial */}
                      {sticker.type !== "regular" && (
                        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${typeConf.badgeClass}`}>
                          {typeConf.shortLabel}
                        </div>
                      )}
                      {/* Quantidade em estoque */}
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
              })}
            </div>
          )}
        </div>
      </div>

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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-zinc-400">{cartItemCount} figurinhas</span>
                    {cart.length !== cartItemCount && (
                      <span className="text-[10px] text-zinc-600 ml-1">({cart.length} tipos)</span>
                    )}
                  </div>
                  <span className="text-xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                    R${cartTotal.toFixed(2).replace(".", ",")}
                  </span>
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
                <div className="px-3 py-2 border-t border-zinc-700 flex justify-between">
                  <span className="text-xs text-zinc-400 font-medium">{cartItemCount} figurinhas</span>
                  <span className="font-bold text-amber-400 font-[family-name:var(--font-geist-mono)] text-sm">
                    R${cartTotal.toFixed(2).replace(".", ",")}
                  </span>
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
                href={`/loja/${sellerSlug}`}
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
