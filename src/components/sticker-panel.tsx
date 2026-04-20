"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useCart, type CartSticker } from "@/lib/cart-context";
import { getStickersForPage, getSectionNameForPage } from "@/lib/page-sticker-map";
import type { Sticker } from "@/lib/albums";
import { getDefaultPrice, getStickerTypeShortLabel, getStickerTypeConfig } from "@/lib/sticker-types";
import { imgUrl } from "@/lib/images";

function getPrice(sticker: Sticker): number {
  return getDefaultPrice(sticker.type);
}

// Animação de "fly to cart" — partícula que voa para o ícone do carrinho
function FlyParticle({ from, onDone }: { from: { x: number; y: number }; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Destino: canto superior direito (onde fica o badge do carrinho)
    const targetX = window.innerWidth - 60;
    const targetY = 20;

    const animation = el.animate(
      [
        {
          transform: `translate(${from.x}px, ${from.y}px) scale(1)`,
          opacity: 1,
        },
        {
          transform: `translate(${(from.x + targetX) / 2}px, ${from.y - 80}px) scale(0.8)`,
          opacity: 0.8,
          offset: 0.4,
        },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(0.2)`,
          opacity: 0,
        },
      ],
      { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
    );

    animation.onfinish = onDone;
    return () => animation.cancel();
  }, [from, onDone]);

  return (
    <div
      ref={ref}
      className="fixed z-[500] w-6 h-6 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 pointer-events-none"
      style={{ top: 0, left: 0 }}
    />
  );
}

interface StickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pagePath: string;
  albumYear: number;
}

export default function StickerPanel({ isOpen, onClose, pagePath, albumYear }: StickerPanelProps) {
  const { addItem, items } = useCart();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [sectionName, setSectionName] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<Set<string>>(new Set());
  const [flyParticles, setFlyParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const particleIdRef = useRef(0);

  // Atualiza figurinhas quando a página muda
  useEffect(() => {
    const found = getStickersForPage(pagePath, albumYear);
    setStickers(found);
    setSectionName(getSectionNameForPage(pagePath, albumYear));
  }, [pagePath, albumYear]);

  // Verifica quais já estão no carrinho
  const inCart = new Set(
    items
      .filter((i) => i.albumYear === String(albumYear))
      .map((i) => i.sticker.code)
  );

  const handleAdd = (sticker: Sticker, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const cartSticker: CartSticker = {
      ...sticker,
      price: getPrice(sticker),
    };
    addItem(cartSticker, String(albumYear));

    // Animação de partícula
    const id = ++particleIdRef.current;
    setFlyParticles((prev) => [...prev, { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);

    // Feedback visual
    setAddedCodes((prev) => new Set(prev).add(sticker.code));
    setTimeout(() => {
      setAddedCodes((prev) => {
        const next = new Set(prev);
        next.delete(sticker.code);
        return next;
      });
    }, 1200);
  };

  const removeParticle = (id: number) => {
    setFlyParticles((prev) => prev.filter((p) => p.id !== id));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Partículas voando para o carrinho */}
      {flyParticles.map((p) => (
        <FlyParticle key={p.id} from={{ x: p.x, y: p.y }} onDone={() => removeParticle(p.id)} />
      ))}

      {/* Painel lateral */}
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800/50 flex flex-col"
          style={{
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Figurinhas
              </h3>
              {sectionName && (
                <p className="text-[11px] text-amber-400/70 font-[family-name:var(--font-geist-mono)] mt-0.5">
                  {sectionName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {stickers.length} figs
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtro rápido por tipo */}
          <div className="px-4 py-2 flex items-center gap-1.5 border-b border-zinc-800/30">
            {["all", "regular", "foil", "shiny"].map((type) => {
              const count = type === "all"
                ? stickers.length
                : stickers.filter((s) => s.type === type).length;
              if (count === 0 && type !== "all") return null;
              const conf = type !== "all" ? getStickerTypeConfig(type) : null;
              return (
                <span
                  key={type}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-[family-name:var(--font-geist-mono)] ${
                    type === "all"
                      ? "bg-zinc-800 text-zinc-300"
                      : type === "foil"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : type === "shiny"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-zinc-800/50 text-zinc-400"
                  }`}
                >
                  {type === "all" ? "Todas" : conf!.shortLabel} ({count})
                </span>
              );
            })}
          </div>

          {/* Grid de figurinhas */}
          <div className="flex-1 overflow-y-auto p-3">
            {stickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-xs">Nenhuma figurinha mapeada para esta página</p>
                <p className="text-zinc-700 text-[10px] mt-1">Navegue para uma página de seleção/time</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {stickers.map((sticker) => {
                  const isInCart = inCart.has(sticker.code);
                  const justAdded = addedCodes.has(sticker.code);

                  return (
                    <button
                      key={sticker.code}
                      onClick={(e) => handleAdd(sticker, e)}
                      className={`group relative rounded-lg overflow-hidden border transition-all duration-200 ${
                        justAdded
                          ? "border-green-500/50 bg-green-500/5 scale-95"
                          : isInCart
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-600 hover:bg-zinc-800/50 hover:scale-[1.02] active:scale-95"
                      }`}
                    >
                      {/* Imagem da figurinha */}
                      <div className="relative aspect-[3/4] w-full bg-zinc-900">
                        <Image
                          src={imgUrl(sticker.image)}
                          alt={sticker.name}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />

                        {/* Badge de tipo especial */}
                        {sticker.type !== "regular" && (
                          <span className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold ${getStickerTypeConfig(sticker.type).badgeClass}`}>
                            {getStickerTypeShortLabel(sticker.type)}
                          </span>
                        )}

                        {/* Overlay de "adicionado" */}
                        {justAdded && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        )}

                        {/* Badge "no carrinho" */}
                        {isInCart && !justAdded && (
                          <div className="absolute top-1 left-1">
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/90 text-[7px] font-bold text-black">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                              </svg>
                            </span>
                          </div>
                        )}

                        {/* Overlay hover com "+" */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Info da figurinha */}
                      <div className="px-1.5 py-1.5">
                        <p className="text-[9px] font-medium text-zinc-300 truncate leading-tight">
                          {sticker.name}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[8px] text-zinc-600 font-[family-name:var(--font-geist-mono)]">
                            {sticker.code}
                          </span>
                          <span className={`text-[9px] font-bold font-[family-name:var(--font-geist-mono)] ${
                            sticker.type === "foil" ? "text-amber-400" :
                            sticker.type === "shiny" ? "text-purple-400" :
                            "text-zinc-400"
                          }`}>
                            R${getPrice(sticker).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — resumo rápido */}
          <div className="border-t border-zinc-800/50 px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              Clique para adicionar ao carrinho
            </span>
            <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {stickers.filter((s) => inCart.has(s.code)).length}/{stickers.length} selecionadas
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
