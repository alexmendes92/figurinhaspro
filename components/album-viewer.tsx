"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Album, Sticker } from "@/lib/albums";
import { useCart, type CartSticker } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { getDefaultPrice, getStickerTypeShortLabel } from "@/lib/sticker-types";

function toCartSticker(s: Sticker): CartSticker {
  return { ...s, price: getDefaultPrice(s.type) };
}

export default function AlbumViewer({ album, onBack }: { album: Album; onBack?: () => void }) {
  const [activeSection, setActiveSection] = useState(0);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const { addItem, items } = useCart();
  const { show } = useToast();

  // Busca todos os códigos já no carrinho para feedback visual
  const cartCodes = useMemo(() => {
    const codes = new Set<string>();
    items.forEach((item) => {
      codes.add(item.sticker.code + "-" + item.albumYear);
    });
    return codes;
  }, [items]);

  const section = album.sections[activeSection];

  function handleAddToCart(sticker: Sticker) {
    addItem(toCartSticker(sticker), album.year);
    show(`${sticker.code} - ${sticker.name} adicionada!`);
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar de seções */}
      <aside className="lg:w-56 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/50 overflow-x-auto lg:overflow-y-auto">
        <div className="flex lg:flex-col p-2 gap-1 lg:sticky lg:top-[57px]">
          <div className="hidden lg:block px-3 py-2 mb-1">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-[family-name:var(--font-geist-mono)]">
              Seções
            </p>
          </div>
          {album.sections.map((sec, i) => (
            <button
              key={sec.name}
              onClick={() => {
                setActiveSection(i);
                setSelectedSticker(null);
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
                  {sec.stickers.length}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Grid de figurinhas */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          {/* Header da seção */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{section.name}</h3>
              <p className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {section.stickers.length} figurinhas · Clique para adicionar ao
                carrinho
              </p>
            </div>
            <button
              onClick={() => {
                section.stickers.forEach((s) => handleAddToCart(s));
                show(`Todas as ${section.stickers.length} figurinhas de "${section.name}" adicionadas!`);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Adicionar todas
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
            {section.stickers.map((sticker) => {
              const inCart = cartCodes.has(sticker.code + "-" + album.year);
              const isSpecial = sticker.type === "foil" || sticker.type === "shiny";

              return (
                <button
                  key={sticker.code}
                  onClick={() => setSelectedSticker(sticker)}
                  className={`group relative rounded-lg overflow-hidden border transition-all hover:scale-105 hover:z-10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    inCart
                      ? "border-green-500/40 ring-1 ring-green-500/20"
                      : isSpecial
                      ? "border-amber-500/30 hover:border-amber-400/60"
                      : "border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {/* Imagem da figurinha */}
                  <div className="relative aspect-[2/3] bg-zinc-800">
                    <Image
                      src={sticker.image}
                      alt={`${sticker.code} - ${sticker.name}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
                    />

                    {/* Overlay ao hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Badge especial */}
                    {isSpecial && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500/80 flex items-center justify-center">
                        <span className="text-[8px]">✨</span>
                      </div>
                    )}

                    {/* Badge no carrinho */}
                    {inCart && (
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Código e preço */}
                  <div className="px-1.5 py-1 bg-zinc-900/90">
                    <div className="flex items-center justify-between">
                      <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-400 truncate">
                        {sticker.code}
                      </span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-amber-400">
                        R${getDefaultPrice(sticker.type).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de detalhe da figurinha */}
      {selectedSticker && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedSticker(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagem grande */}
            <div className="relative aspect-[2/3] bg-zinc-800">
              <Image
                src={selectedSticker.image}
                alt={selectedSticker.name}
                fill
                className="object-contain"
                sizes="400px"
                priority
              />
              <button
                onClick={() => setSelectedSticker(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-zinc-600 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-[family-name:var(--font-geist-mono)] text-xs text-zinc-500 mb-0.5">
                    {album.year} · {selectedSticker.code}
                  </p>
                  <h4 className="text-lg font-semibold">{selectedSticker.name}</h4>
                  {selectedSticker.type !== "regular" && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
                      ✨ {getStickerTypeShortLabel(selectedSticker.type)}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold text-amber-400 font-[family-name:var(--font-geist-mono)]">
                  R${getDefaultPrice(selectedSticker.type).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                onClick={() => {
                  handleAddToCart(selectedSticker);
                  setSelectedSticker(null);
                }}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
