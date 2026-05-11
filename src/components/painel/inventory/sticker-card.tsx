"use client";

import Image from "next/image";
import { useState } from "react";
import type { Sticker } from "@/lib/albums";
import { imgUrl } from "@/lib/images";
import { getDefaultPrice, getStickerTypeConfig } from "@/lib/sticker-types";
import { parseQuantityInput } from "../inventory-quantity-parser";

export type StockMap = Record<string, { quantity: number; customPrice: number | null }>;

interface StickerCardProps {
  sticker: Sticker;
  stock: StockMap;
  lastSaved: string | null;
  toggleSticker: (code: string) => void;
  updateQuantity: (code: string, qty: number) => void;
  setPriceModalSticker: (s: Sticker) => void;
}

export function StickerCard({
  sticker,
  stock,
  lastSaved,
  toggleSticker,
  updateQuantity,
  setPriceModalSticker,
}: StickerCardProps) {
  const qty = stock[sticker.code]?.quantity || 0;
  const hasIt = qty > 0;
  const customPrice = stock[sticker.code]?.customPrice ?? null;
  const hasCustomPrice = customPrice !== null;
  const justSaved = lastSaved === sticker.code;
  const typeConf = getStickerTypeConfig(sticker.type);

  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState("");

  function commitQty() {
    const parsed = parseQuantityInput(qtyDraft, qty);
    if (parsed.valid && parsed.shouldUpdate) {
      updateQuantity(sticker.code, parsed.value);
    }
    setEditingQty(false);
  }

  function startEditingQty() {
    setQtyDraft(String(qty));
    setEditingQty(true);
  }

  return (
    <div
      data-sticker-code={sticker.code}
      data-missing={!hasIt ? "true" : "false"}
      className={`group relative rounded-lg overflow-hidden border transition-all ${
        hasIt
          ? "border-green-500/40 ring-1 ring-green-500/10 bg-zinc-900/90"
          : "border-dashed border-zinc-700/60 bg-zinc-900/30"
      } ${justSaved ? "sticker-added" : ""}`}
    >
      {/* Área da imagem (toggle) */}
      <div className="relative aspect-[2/3] bg-zinc-800 p-1.5">
        <Image
          src={imgUrl(sticker.image)}
          alt={`${sticker.code} - ${sticker.name}`}
          fill
          className={`object-contain p-1 transition ${hasIt ? "" : "grayscale-[40%] opacity-80"}`}
          sizes="(max-width: 640px) 33vw, 16vw"
        />

        {/* Botão invisível que cobre a imagem — toggle de "tenho" */}
        <button
          type="button"
          onClick={() => toggleSticker(sticker.code)}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
          aria-label={
            hasIt ? `Remover ${sticker.name} do estoque` : `Adicionar ${sticker.name} ao estoque`
          }
        />

        {/* Badge de tipo (canto superior esquerdo) */}
        {sticker.type !== "regular" && (
          <div
            className={`pointer-events-none absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm ${typeConf.badgeClass}`}
            title={typeConf.shortLabel}
          >
            {typeConf.shortLabel}
          </div>
        )}

        {/* Check (canto superior direito) */}
        {hasIt && (
          <div className="pointer-events-none absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Ícone $ — preço customizado (canto inferior direito, dentro da imagem) */}
        {hasIt && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPriceModalSticker(sticker);
            }}
            title={
              hasCustomPrice
                ? `Preço: R$${customPrice.toFixed(2).replace(".", ",")}`
                : "Definir preço customizado"
            }
            aria-label={hasCustomPrice ? "Editar preço customizado" : "Definir preço customizado"}
            className={`absolute bottom-1 right-1 z-10 w-6 h-6 min-h-[24px] min-w-[24px] rounded-md flex items-center justify-center transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950 ${
              hasCustomPrice
                ? "bg-accent-500 text-black hover:bg-accent-400"
                : "bg-zinc-900/85 border border-zinc-700 text-zinc-400 hover:text-accent-400 hover:border-accent-500/40 opacity-70 group-hover:opacity-100 focus:opacity-100"
            }`}
          >
            <span className="text-[11px] font-bold font-[family-name:var(--font-geist-mono)]">
              $
            </span>
          </button>
        )}
      </div>

      {/* Rodapé: código + preço + nome + stepper */}
      <div className="px-2 py-1.5 space-y-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="font-[family-name:var(--font-geist-mono)] text-xs font-semibold text-zinc-200 truncate">
            {sticker.code}
          </span>
          {hasIt && (
            <span
              className={`font-[family-name:var(--font-geist-mono)] text-[10px] font-bold shrink-0 ${
                hasCustomPrice ? "text-accent-400" : "text-zinc-400"
              }`}
            >
              R$
              {(hasCustomPrice ? customPrice : getDefaultPrice(sticker.type))
                .toFixed(2)
                .replace(".", ",")}
            </span>
          )}
        </div>
        <p
          className={`text-[10px] truncate leading-tight ${
            hasIt ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {sticker.name}
        </p>
        {hasIt && (
          <div className="flex items-center gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => updateQuantity(sticker.code, qty - 1)}
              className="flex-1 h-7 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            {editingQty ? (
              <input
                type="number"
                inputMode="numeric"
                value={qtyDraft}
                onChange={(e) => setQtyDraft(e.target.value)}
                onBlur={commitQty}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitQty();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingQty(false);
                  }
                }}
                autoFocus
                onFocus={(e) => e.target.select()}
                className="min-w-[2rem] w-12 text-center font-[family-name:var(--font-geist-mono)] text-xs font-bold text-green-400 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-accent-500/40 focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                aria-label="Editar quantidade"
              />
            ) : (
              <button
                type="button"
                onClick={startEditingQty}
                className="min-w-[32px] min-h-[24px] text-center font-[family-name:var(--font-geist-mono)] text-xs font-bold text-green-400 hover:text-accent-400 transition-colors cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950"
                aria-label={`Quantidade ${qty} (clique para editar)`}
                title="Clique para digitar a quantidade"
              >
                {qty}
              </button>
            )}
            <button
              type="button"
              onClick={() => updateQuantity(sticker.code, qty + 1)}
              className="flex-1 h-7 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 flex items-center justify-center transition-colors active:bg-zinc-700"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        )}
        {!hasIt && (
          <button
            type="button"
            onClick={() => toggleSticker(sticker.code)}
            className="w-full mt-1 h-7 rounded bg-accent-500/10 border border-accent-500/30 text-[11px] font-semibold text-accent-400 hover:bg-accent-500/20 hover:border-accent-500/50 transition-colors active:bg-accent-500/30"
            aria-label={`Adicionar ${sticker.name} ao estoque`}
          >
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}
