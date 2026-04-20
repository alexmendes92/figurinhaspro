"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Album, Sticker } from "@/lib/albums";
import { imgUrl } from "@/lib/images";
import type { SectionRule } from "@/lib/price-resolver";
import { resolveQuantityDiscount, resolveUnitPrice } from "@/lib/price-resolver";
import { STICKER_TYPES, getStickerTypeConfig } from "@/lib/sticker-types";
import StoreHero from "./store-hero";
import StorePromoRow from "./store-promo-row";
import StoreSidebar from "./store-sidebar";
import StoreFooter from "./store-footer";
import styles from "./store-album-view.module.css";

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
    } catch {
      return [];
    }
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
    } catch {
      /* quota exceeded */
    }
  }, [cart, storageKey]);

  const [search, setSearch] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [missingCodes, setMissingCodes] = useState<Set<string>>(new Set());
  const [importText, setImportText] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(() => new Set(STICKER_TYPES));

  const filterByMissing = missingCodes.size > 0;
  const gridRef = useRef<HTMLDivElement | null>(null);

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

  const section = activeSection === "all" ? null : album.sections[activeSection];

  const allAvailableStickers = useMemo(
    () =>
      album.sections
        .flatMap((s) => s.stickers)
        .filter((s) => (stockMap[s.code]?.quantity || 0) > 0),
    [album.sections, stockMap]
  );

  // Faixa global de preços (para slider)
  const priceBounds = useMemo(() => {
    if (allAvailableStickers.length === 0) return { min: 0, max: 10 };
    let min = Infinity;
    let max = -Infinity;
    for (const s of allAvailableStickers) {
      const p = getPrice(s);
      if (p < min) min = p;
      if (p > max) max = p;
    }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max) || max <= min) max = min + 1;
    return { min: Math.floor(min * 2) / 2, max: Math.ceil(max * 2) / 2 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAvailableStickers, priceMap, stockMap, sectionRulesRef, stickerSectionMap]);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceBounds.min,
    priceBounds.max,
  ]);

  // Ajusta range quando bounds mudam (ex: álbum trocar)
  useEffect(() => {
    setPriceRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

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

  const missingMatches = useMemo(() => {
    if (!filterByMissing) return [];
    return album.sections
      .flatMap((s) => s.stickers)
      .filter(
        (s) => missingCodes.has(s.code.toUpperCase()) && (stockMap[s.code]?.quantity || 0) > 0
      );
  }, [filterByMissing, missingCodes, album.sections, stockMap]);

  // Baseline antes dos filtros adicionais (tipo + preço)
  const baselineStickers = isSearching
    ? searchResults
    : filterByMissing
      ? missingMatches
      : section
        ? section.stickers.filter((s) => (stockMap[s.code]?.quantity || 0) > 0)
        : allAvailableStickers;

  // Aplica filtros: tipo + faixa de preço
  const availableStickers = useMemo(() => {
    const [lo, hi] = priceRange;
    const usePriceFilter = lo > priceBounds.min || hi < priceBounds.max;
    const useTypeFilter = activeTypes.size !== STICKER_TYPES.length;
    if (!usePriceFilter && !useTypeFilter) return baselineStickers;
    return baselineStickers.filter((s) => {
      if (useTypeFilter && !activeTypes.has(s.type)) return false;
      if (usePriceFilter) {
        const p = getPrice(s);
        if (p < lo - 0.001 || p > hi + 0.001) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineStickers, activeTypes, priceRange, priceBounds.min, priceBounds.max]);

  const totalAvailable = allAvailableStickers.length;

  const sectionCounts = useMemo(
    () =>
      album.sections.map((sec) => ({
        name: sec.name,
        count: sec.stickers.filter((s) => (stockMap[s.code]?.quantity || 0) > 0).length,
      })),
    [album.sections, stockMap]
  );

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discountPercent = resolveQuantityDiscount(cartItemCount, quantityTiers);
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const cartTotal = cartSubtotal - discountAmount;
  const cartCodes = useMemo(() => new Set(cart.map((i) => i.sticker.code)), [cart]);

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

  function addToCart(sticker: Sticker) {
    const price = getPrice(sticker);
    const maxQty = stockMap[sticker.code]?.quantity || 1;
    setCart((prev) => {
      const existing = prev.find((i) => i.sticker.code === sticker.code);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) =>
          i.sticker.code === sticker.code ? { ...i, quantity: i.quantity + 1 } : i
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
    msg += "────────────────\n";
    cart.forEach((item) => {
      msg += `${item.sticker.code} - ${item.sticker.name}`;
      if (item.quantity > 1) msg += ` (×${item.quantity})`;
      msg += ` → R$${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n`;
    });
    msg += "────────────────\n";
    if (discountPercent > 0) {
      msg += `Subtotal: R$${cartSubtotal.toFixed(2).replace(".", ",")}\n`;
      msg += `Desconto: ${discountPercent}% (${cartItemCount}+ figurinhas)\n`;
      msg += `*Total: R$${cartTotal.toFixed(2).replace(".", ",")}*\n`;
    } else {
      msg += `*Total: R$${cartTotal.toFixed(2).replace(".", ",")}*\n`;
    }
    msg += `*${cartItemCount} figurinhas*\n\n`;
    msg += "Pedido feito pela loja online.";
    return msg;
  }

  function getWhatsAppUrl(customerName: string): string {
    const phone = sellerPhone?.replace(/\D/g, "") || "";
    const msg = encodeURIComponent(generateWhatsAppMessage(customerName));
    return `https://wa.me/55${phone}?text=${msg}`;
  }

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleStickerType(type: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const heroStickers = allAvailableStickers.slice(0, 5);
  const money = (v: number) => `R$${v.toFixed(2).replace(".", ",")}`;

  function renderStickerCard(sticker: Sticker) {
    const price = getPrice(sticker);
    const inCart = cartCodes.has(sticker.code);
    const cartItem = cart.find((c) => c.sticker.code === sticker.code);
    const qty = cartItem?.quantity ?? 0;
    const maxQty = stockMap[sticker.code]?.quantity || 0;
    const typeConf = getStickerTypeConfig(sticker.type);
    const cardClass = inCart ? `${styles.card} ${styles.cardInCart}` : styles.card;

    return (
      <button
        key={sticker.code}
        type="button"
        className={cardClass}
        onClick={() => !inCart && addToCart(sticker)}
      >
        <div className={styles.cardImg}>
          <Image
            src={imgUrl(sticker.image)}
            alt={`${sticker.code} - ${sticker.name}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 180px"
            style={{ objectFit: "cover" }}
          />
          <div className={styles.cardCode}>{sticker.code}</div>
          {sticker.type === "foil" && (
            <div className={`${styles.cardTypeBadge} ${styles.cardTypeFoil}`}>
              {typeConf.shortLabel}
            </div>
          )}
          {sticker.type === "shiny" && (
            <div className={`${styles.cardTypeBadge} ${styles.cardTypeShiny}`}>
              {typeConf.shortLabel}
            </div>
          )}
          {inCart && (
            <div className={styles.cardInCartBadge} aria-label="No carrinho">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {maxQty > 1 && <div className={styles.cardStock}>{maxQty}x</div>}
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardTitle}>{sticker.name}</div>
          <div className={styles.cardFoot}>
            <div className={styles.cardPrice}>
              {money(price)}
              <small> un.</small>
            </div>
            {inCart ? (
              <div
                className={styles.cardQty}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQty(sticker.code, -1);
                  }}
                >
                  −
                </button>
                <span className={styles.n}>{qty}</span>
                <button
                  type="button"
                  aria-label="Adicionar"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQty(sticker.code, +1);
                  }}
                  disabled={qty >= maxQty}
                >
                  +
                </button>
              </div>
            ) : (
              <span className={styles.cardAdd} aria-hidden>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  const renderAllSections =
    activeSection === "all" && !isSearching && !filterByMissing;

  return (
    <div className={styles.root}>
      <StoreHero
        album={album}
        sellerName={sellerName}
        sellerPhone={sellerPhone}
        sellerSlug={sellerSlug}
        totalAvailable={totalAvailable}
        minPrice={priceBounds.min}
        heroStickers={heroStickers}
        cartCount={cartItemCount}
        onScrollToGrid={scrollToGrid}
        onOpenImport={() => setShowImportModal(true)}
        onOpenCart={() => setShowCart(true)}
      />

      <StorePromoRow
        onOpenImport={() => setShowImportModal(true)}
        quantityTiers={quantityTiers}
        sellerBusinessHours={sellerBusinessHours}
        sellerPaymentMethods={sellerPaymentMethods}
      />

      <div className={styles.shell}>
        <StoreSidebar
          album={album}
          sellerSlug={sellerSlug}
          availableAlbums={availableAlbums}
          search={search}
          onSearchChange={setSearch}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          totalAvailable={totalAvailable}
          sectionCounts={sectionCounts}
          activeTypes={activeTypes}
          onToggleType={toggleStickerType}
          priceMin={priceBounds.min}
          priceMax={priceBounds.max}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />

        <main className={styles.mainCol} ref={gridRef}>
          <div className={styles.controlBar}>
            <div className={styles.ctrlLead}>
              <h2>
                {isSearching
                  ? `Resultados para "${search.trim()}"`
                  : filterByMissing
                    ? "Figurinhas que faltam"
                    : section
                      ? section.name
                      : "Todas as figurinhas"}
                <span className={styles.tag}>{availableStickers.length}</span>
              </h2>
              <p>
                {isSearching
                  ? "Busca ativa"
                  : filterByMissing
                    ? `${missingCodes.size} códigos na lista`
                    : `${totalAvailable} em estoque neste álbum`}
              </p>
            </div>
            <div className={styles.ctrlRight}>
              {availableStickers.length > 0 && (
                <button
                  type="button"
                  className={styles.actionPill}
                  onClick={() => {
                    const existingCodes = new Set(cart.map((c) => c.sticker.code));
                    const toAdd = availableStickers.filter((s) => !existingCodes.has(s.code));
                    if (toAdd.length === 0) return;
                    setCart((prev) => [
                      ...prev,
                      ...toAdd.map((s) => ({ sticker: s, price: getPrice(s), quantity: 1 })),
                    ]);
                  }}
                >
                  + Adicionar todas ({availableStickers.length})
                </button>
              )}
            </div>
          </div>

          {filterByMissing && (
            <div className={styles.filterBanner}>
              <div className={styles.filterBannerInfo}>
                <div className={styles.filterBannerTitle}>Lista que falta ativa</div>
                <div className={styles.filterBannerSub}>
                  {missingCodes.size} códigos importados · {missingMatches.length} disponíveis em
                  estoque
                </div>
              </div>
              <div className={styles.filterBannerActions}>
                {missingMatches.length > 0 && (
                  <button
                    type="button"
                    className={styles.actionPill}
                    onClick={addAllMissingToCart}
                  >
                    Adicionar todas ao carrinho
                  </button>
                )}
                <button
                  type="button"
                  className={styles.actionPill}
                  onClick={clearMissingFilter}
                >
                  Limpar filtro
                </button>
              </div>
            </div>
          )}

          {availableStickers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <h4>
                {isSearching
                  ? "Nenhuma figurinha encontrada"
                  : "Nada corresponde aos filtros"}
              </h4>
              <p>
                {isSearching
                  ? "Tente buscar por outro código ou nome"
                  : "Ajuste tipo, preço ou seção"}
              </p>
            </div>
          ) : renderAllSections ? (
            album.sections.map((sec) => {
              const secStickers = sec.stickers
                .filter((s) => (stockMap[s.code]?.quantity || 0) > 0)
                .filter((s) => availableStickers.some((a) => a.code === s.code));
              if (secStickers.length === 0) return null;
              return (
                <React.Fragment key={sec.name}>
                  <div className={styles.sectionHd}>
                    <span className="flag">{album.flag}</span>
                    <h3>{sec.name}</h3>
                    <span className="meta">{secStickers.length} disponíveis</span>
                  </div>
                  <div className={styles.grid}>{secStickers.map(renderStickerCard)}</div>
                </React.Fragment>
              );
            })
          ) : (
            <div className={styles.grid}>{availableStickers.map(renderStickerCard)}</div>
          )}
        </main>
      </div>

      <StoreFooter sellerName={sellerName} sellerPhone={sellerPhone} />

      {/* Modal importar lista */}
      {showImportModal && (
        <div
          className={styles.modal}
          onClick={() => setShowImportModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalHeadIcon}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 3h6m-6 3h3M9 8h.01M9 5h6a2 2 0 012 2v11a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
                </svg>
              </div>
              <div>
                <h3>Importar lista que falta</h3>
                <p>Cole os códigos — mostramos só o que o vendedor tem.</p>
              </div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label htmlFor="importText">Códigos</label>
                <textarea
                  id="importText"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={"Ex: 1, 2, 3, FWC1, BRA5, ARG10\n\nSeparados por vírgula, espaço ou um por linha"}
                  rows={6}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-mute)", marginTop: -4 }}>
                {importText.trim()
                  ? `${parseMissingList(importText).size} códigos detectados`
                  : "Dica: copie direto de grupo de WhatsApp ou planilha"}
              </p>
            </div>
            <div className={styles.modalFoot}>
              <button
                type="button"
                className={styles.actionPill}
                onClick={() => setShowImportModal(false)}
              >
                Cancelar
              </button>
              {filterByMissing && (
                <button
                  type="button"
                  className={styles.actionPill}
                  onClick={() => {
                    clearMissingFilter();
                    setShowImportModal(false);
                  }}
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                className={styles.checkoutBtn}
                onClick={handleImport}
                disabled={!importText.trim()}
                style={{ width: "auto", padding: "10px 20px" }}
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer carrinho */}
      {showCart && (
        <>
          <div
            className={styles.modal}
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setShowCart(false)}
          />
          <aside className={styles.drawer}>
            <div className={styles.drawerHead}>
              <div>
                <h3>Orçamento</h3>
                <p>{cartItemCount} figurinhas selecionadas</p>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setShowCart(false)}
                aria-label="Fechar"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={styles.drawerBody}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <div className={styles.emptyCartBig}>🛒</div>
                  <h4>Carrinho vazio</h4>
                  <p>Clique nas figurinhas para adicioná-las.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.sticker.code} className={styles.cartItem}>
                    <div className={styles.cartThumb}>
                      <Image
                        src={imgUrl(item.sticker.image)}
                        alt={item.sticker.name}
                        fill
                        sizes="42px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className={styles.ciInfo}>
                      <div className={styles.ciName}>{item.sticker.name}</div>
                      <div className={styles.ciSub}>
                        {item.sticker.code} · {money(item.price)} un.
                      </div>
                    </div>
                    <div className={styles.ciCtrl}>
                      <button type="button" onClick={() => updateCartQty(item.sticker.code, -1)} aria-label="Diminuir">
                        −
                      </button>
                      <span className={styles.n}>{item.quantity}</span>
                      <button type="button" onClick={() => updateCartQty(item.sticker.code, +1)} aria-label="Aumentar">
                        +
                      </button>
                    </div>
                    <div className={styles.ciPrice}>{money(item.price * item.quantity)}</div>
                    <button
                      type="button"
                      className={styles.ciRemove}
                      onClick={() => removeFromCart(item.sticker.code)}
                      aria-label="Remover"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <>
                <div className={styles.drawerSummary}>
                  <div className={styles.sumRow}>
                    <span>
                      {cartItemCount} figurinhas
                      {cart.length !== cartItemCount && ` · ${cart.length} tipos`}
                    </span>
                    <span className={styles.mono}>{money(cartSubtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className={styles.sumRow} style={{ color: "var(--lime)" }}>
                      <span>Desconto {discountPercent}%</span>
                      <span className={styles.mono}>−{money(discountAmount)}</span>
                    </div>
                  )}
                  <div className={`${styles.sumRow} ${styles.sumRowTotal}`}>
                    <span>Total</span>
                    <span className={styles.mono} style={{ color: "var(--accent)" }}>
                      {money(cartTotal)}
                    </span>
                  </div>
                </div>
                <div className={styles.drawerFoot}>
                  <button
                    type="button"
                    className={styles.checkoutBtn}
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                  >
                    Finalizar orçamento →
                  </button>
                </div>
              </>
            )}
          </aside>
        </>
      )}

      {/* Modal checkout */}
      {showCheckout && (
        <div
          className={styles.modal}
          onClick={() => setShowCheckout(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalHeadIcon}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3>Finalizar orçamento</h3>
                <p>Envie por WhatsApp ou registre o pedido.</p>
              </div>
            </div>
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
            >
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label htmlFor="name">Seu nome</label>
                  <input id="name" name="name" required placeholder="Seu nome" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">WhatsApp (opcional)</label>
                  <input id="phone" name="phone" type="tel" placeholder="(11) 99999-9999" />
                </div>

                <div className={styles.orderSummary}>
                  <div className={styles.orderSummaryH}>Resumo do pedido</div>
                  {cart.map((item) => (
                    <div key={item.sticker.code} className={styles.osItem}>
                      <span>
                        {item.sticker.code} {item.sticker.name}
                        {item.quantity > 1 && ` ×${item.quantity}`}
                      </span>
                      <span className={styles.mono}>
                        {money(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {discountPercent > 0 && (
                    <div className={styles.osItem} style={{ color: "var(--lime)" }}>
                      <span>Desconto {discountPercent}%</span>
                      <span className={styles.mono}>−{money(discountAmount)}</span>
                    </div>
                  )}
                  <div className={styles.osTotal}>
                    <span>Total</span>
                    <span className={styles.mono}>{money(cartTotal)}</span>
                  </div>
                </div>
              </div>
              <div className={styles.modalFoot}>
                <button
                  type="button"
                  className={styles.actionPill}
                  onClick={() => setShowCheckout(false)}
                >
                  Voltar
                </button>
                <button type="submit" className={styles.whatsBtn}>
                  {sellerPhone ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
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

      {/* Modal sucesso */}
      {showSuccess && (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={`${styles.modalBox} ${styles.successBox}`}>
            <div className={styles.successIcon}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Pedido enviado!</h3>
            <p style={{ fontSize: 13, color: "var(--fg-dim)", marginBottom: 4 }}>
              {sellerPhone
                ? "Seu orçamento foi enviado por WhatsApp."
                : "Seu pedido foi registrado no sistema."}
            </p>
            <p style={{ fontSize: 11.5, color: "var(--fg-mute)", marginBottom: 20 }}>
              O vendedor entrará em contato para confirmar.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Link href={`/loja/${sellerSlug}?browse=true`} className={styles.actionPill}>
                Ver outros álbuns
              </Link>
              <button
                type="button"
                className={styles.checkoutBtn}
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={() => setShowSuccess(false)}
              >
                Continuar comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra mobile fixa */}
      {cart.length > 0 && !showCart && !showCheckout && !showSuccess && (
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.mobileBarBtn}
            onClick={() => setShowCart(true)}
          >
            Ver orçamento ({cartItemCount}) — {money(cartTotal)}
          </button>
        </div>
      )}
    </div>
  );
}
