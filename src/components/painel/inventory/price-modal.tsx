"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { Sticker } from "@/lib/albums";
import { imgUrl } from "@/lib/images";
import { getDefaultPrice, getStickerTypeConfig } from "@/lib/sticker-types";
import { useDialog } from "@/lib/use-dialog";

interface PriceModalProps {
  sticker: Sticker;
  currentCustomPrice: number | null;
  canUseCustomPrices: boolean;
  onSave: (price: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function PriceModal({
  sticker,
  currentCustomPrice,
  canUseCustomPrices,
  onSave,
  onClear,
  onClose,
}: PriceModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  const defaultPrice = getDefaultPrice(sticker.type);
  const typeConf = getStickerTypeConfig(sticker.type);

  useEffect(() => {
    if (canUseCustomPrices) inputRef.current?.focus();
  }, [canUseCustomPrices]);

  function handleSave() {
    const val = Number.parseFloat(inputRef.current?.value || "");
    if (!Number.isNaN(val) && val > 0) onSave(val);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Preço customizado de ${sticker.name}`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-xs mx-4 bg-[#1a1f2e] border border-white/[0.14] rounded-2xl overflow-hidden shadow-2xl fade-in"
      >
        {/* Header com imagem */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
          <div className="relative w-10 h-14 rounded-lg overflow-hidden border border-zinc-700 shrink-0">
            <Image
              src={imgUrl(sticker.image)}
              alt={sticker.name}
              fill
              className="object-cover"
              sizes="40px"
            />
            {sticker.type !== "regular" && (
              <div
                className={`absolute top-0.5 left-0.5 px-1 py-[1px] rounded text-[7px] font-bold ${typeConf.badgeClass}`}
              >
                {typeConf.shortLabel}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{sticker.name}</p>
            <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {sticker.code}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar (Esc)"
            className="ml-auto h-7 w-7 shrink-0 [&_svg]:size-3.5"
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {/* Preço padrão */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Preço padrão ({typeConf.shortLabel})</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-zinc-400">
              R${defaultPrice.toFixed(2).replace(".", ",")}
            </span>
          </div>

          {canUseCustomPrices ? (
            <>
              {/* Input de preço */}
              <div>
                <label className="text-[10px] text-zinc-500 font-medium block mb-1">
                  Preço customizado
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">R$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.50"
                    min="0.50"
                    defaultValue={currentCustomPrice?.toFixed(2) ?? ""}
                    placeholder={defaultPrice.toFixed(2)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                    }}
                    aria-label={`Preço customizado de ${sticker.name}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm font-[family-name:var(--font-geist-mono)] text-accent-400 font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-accent-500/40 transition-colors focus-ring"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  className="flex-1"
                >
                  Salvar preço
                </Button>
                {currentCustomPrice !== null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="hover:text-rose-400 hover:border-rose-500/40"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </>
          ) : (
            /* Gate PRO+ */
            <div className="p-3 rounded-xl bg-accent-500/5 border border-accent-500/20">
              <p className="text-xs text-accent-400 font-medium mb-1">Recurso PRO</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Preço customizado por figurinha requer plano PRO ou superior.
              </p>
              <Link
                href="/painel/planos"
                className="inline-block mt-2 text-[10px] text-accent-400 font-semibold hover:underline"
              >
                Ver planos →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
