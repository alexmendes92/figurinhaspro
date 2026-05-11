"use client";

import type { Sticker } from "@/lib/albums";
import { flagFor } from "@/lib/country-flags";
import { StickerCard, type StockMap } from "./sticker-card";

interface SectionBlockProps {
  sectionName: string;
  sectionIndex: number;
  sectionCount: string;
  stickers: Sticker[];
  stock: StockMap;
  lastSaved: string | null;
  toggleSticker: (code: string) => void;
  updateQuantity: (code: string, qty: number) => void;
  setPriceModalSticker: (s: Sticker) => void;
}

export function SectionBlock({
  sectionName,
  sectionIndex,
  sectionCount,
  stickers,
  stock,
  lastSaved,
  toggleSticker,
  updateQuantity,
  setPriceModalSticker,
}: SectionBlockProps) {
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
