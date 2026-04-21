"use client";

import Link from "next/link";
import type { Album } from "@/lib/albums";
import { getStickerTypeConfig, STICKER_TYPES } from "@/lib/sticker-types";
import styles from "./store-album-view.module.css";

interface AlbumPill {
  slug: string;
  title: string;
  flag: string;
  inStockTypes: number;
  isCustom: boolean;
}

interface StoreSidebarProps {
  album: Album;
  sellerSlug: string;
  availableAlbums?: AlbumPill[];

  search: string;
  onSearchChange: (value: string) => void;

  activeSection: number | "all";
  onSectionChange: (value: number | "all") => void;

  totalAvailable: number;
  sectionCounts: Array<{ name: string; count: number }>;

  activeTypes: Set<string>;
  onToggleType: (type: string) => void;

  priceMin: number;
  priceMax: number;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export default function StoreSidebar({
  album,
  sellerSlug,
  availableAlbums,
  search,
  onSearchChange,
  activeSection,
  onSectionChange,
  totalAvailable,
  sectionCounts,
  activeTypes,
  onToggleType,
  priceMin,
  priceMax,
  priceRange,
  onPriceRangeChange,
}: StoreSidebarProps) {
  const [rangeLo, rangeHi] = priceRange;

  const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  function handleLoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    if (Number.isNaN(next)) return;
    onPriceRangeChange([Math.min(next, rangeHi), rangeHi]);
  }

  function handleHiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    if (Number.isNaN(next)) return;
    onPriceRangeChange([rangeLo, Math.max(next, rangeLo)]);
  }

  const span = Math.max(priceMax - priceMin, 1);
  const loPct = ((rangeLo - priceMin) / span) * 100;
  const hiPct = ((rangeHi - priceMin) / span) * 100;

  return (
    <aside className={styles.sideCol} aria-label="Filtros">
      {/* Busca */}
      <div className={styles.filterSearch}>
        <svg
          className={styles.filterSearchIcon}
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
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar nº ou nome"
          aria-label="Buscar figurinhas"
        />
        {search && (
          <button
            type="button"
            className={styles.filterSearchClear}
            onClick={() => onSearchChange("")}
            aria-label="Limpar busca"
          >
            <svg
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Álbuns */}
      {availableAlbums && availableAlbums.length > 1 && (
        <>
          <h4 className={styles.sideH}>Álbuns</h4>
          {availableAlbums.map((a) => {
            const isActive = a.slug === album.slug;
            const classes = isActive ? `${styles.sideItem} ${styles.sideItemOn}` : styles.sideItem;
            return (
              <Link key={a.slug} href={`/loja/${sellerSlug}/${a.slug}`} className={classes}>
                <span className={styles.sideItemFlag}>{a.flag}</span>
                <span className={styles.sideItemNm}>{a.title}</span>
                <span className={styles.sideItemQt}>{a.inStockTypes}</span>
              </Link>
            );
          })}
          <div className={styles.sideDivider} />
        </>
      )}

      {/* Seções */}
      <h4 className={styles.sideH}>Seções</h4>
      <button
        type="button"
        className={
          activeSection === "all" ? `${styles.sideItem} ${styles.sideItemOn}` : styles.sideItem
        }
        onClick={() => onSectionChange("all")}
      >
        <span className={styles.sideItemNm}>Todas</span>
        <span className={styles.sideItemQt}>{totalAvailable}</span>
      </button>
      {album.sections.map((sec, i) => {
        const count = sectionCounts[i]?.count ?? 0;
        if (count === 0) return null;
        const isActive = i === activeSection;
        return (
          <button
            key={sec.name}
            type="button"
            className={isActive ? `${styles.sideItem} ${styles.sideItemOn}` : styles.sideItem}
            onClick={() => onSectionChange(i)}
          >
            <span className={styles.sideItemNm}>{sec.name}</span>
            <span className={styles.sideItemQt}>{count}</span>
          </button>
        );
      })}

      <div className={styles.sideDivider} />

      {/* Tipo de figurinha */}
      <h4 className={styles.sideH}>Tipo</h4>
      {STICKER_TYPES.map((type) => {
        const cfg = getStickerTypeConfig(type);
        const on = activeTypes.has(type);
        return (
          <button
            key={type}
            type="button"
            className={styles.sideToggle}
            onClick={() => onToggleType(type)}
            aria-pressed={on}
          >
            <span>{cfg.label}</span>
            <span className={on ? `${styles.switch} ${styles.switchOn}` : styles.switch} />
          </button>
        );
      })}

      <div className={styles.sideDivider} />

      {/* Price range */}
      <h4 className={styles.sideH}>Preço</h4>
      <div className={styles.priceRange}>
        <div className={styles.priceRangeLabels}>
          <span>{formatPrice(rangeLo)}</span>
          <span>{formatPrice(rangeHi)}</span>
        </div>
        <div className={styles.priceRangeTrack}>
          <div
            className={styles.priceRangeFill}
            style={{ left: `${loPct}%`, width: `${Math.max(hiPct - loPct, 0)}%` }}
          />
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            step={0.5}
            value={rangeLo}
            onChange={handleLoChange}
            className={styles.priceRangeInput}
            aria-label="Preço mínimo"
          />
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            step={0.5}
            value={rangeHi}
            onChange={handleHiChange}
            className={styles.priceRangeInput}
            aria-label="Preço máximo"
          />
        </div>
      </div>
    </aside>
  );
}
