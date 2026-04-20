"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getStickerTypeShortLabel } from "@/lib/sticker-types";
import { imgUrl } from "@/lib/images";

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    setIsOpen,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col slide-in safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold">Carrinho</h2>
            <p className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
              {totalItems} {totalItems === 1 ? "figurinha" : "figurinhas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              aria-label="Fechar carrinho"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm mb-1">Carrinho vazio</p>
              <p className="text-zinc-600 text-xs">
                Clique nas figurinhas do álbum para adicioná-las aqui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {items.map((item) => (
                <div
                  key={item.sticker.code + "-" + item.albumYear}
                  className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-zinc-900/50"
                >
                  {/* Thumb */}
                  <div className="relative w-9 h-12 sm:w-10 sm:h-14 rounded overflow-hidden border border-zinc-700 shrink-0">
                    <Image
                      src={imgUrl(item.sticker.image)}
                      alt={item.sticker.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-sm font-medium truncate">
                      {item.sticker.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                      {item.albumYear} · {item.sticker.code}
                      {item.sticker.type !== "regular" && (
                        <span className="ml-1 text-amber-400">
                          {getStickerTypeShortLabel(item.sticker.type)}
                        </span>
                      )}
                    </p>
                    {/* Preço - inline no mobile */}
                    <p className="text-[11px] font-[family-name:var(--font-geist-mono)] text-amber-400 mt-0.5 sm:hidden">
                      R${(item.sticker.price * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  {/* Quantidade */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.sticker.code + "-" + item.albumYear,
                          item.quantity - 1
                        )
                      }
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 text-xs active:bg-zinc-700"
                      aria-label={`Diminuir ${item.sticker.name}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs font-[family-name:var(--font-geist-mono)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.sticker.code + "-" + item.albumYear,
                          item.quantity + 1
                        )
                      }
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 text-xs active:bg-zinc-700"
                      aria-label={`Aumentar ${item.sticker.name}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Preço - só desktop */}
                  <span className="hidden sm:inline text-sm font-[family-name:var(--font-geist-mono)] text-amber-400 w-16 text-right">
                    R$
                    {(item.sticker.price * item.quantity)
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>

                  {/* Remover */}
                  <button
                    onClick={() =>
                      removeItem(item.sticker.code + "-" + item.albumYear)
                    }
                    className="w-8 h-8 sm:w-auto sm:h-auto rounded-lg sm:rounded-none flex items-center justify-center text-zinc-600 hover:text-red-400 active:bg-red-500/10 transition-colors shrink-0"
                    aria-label={`Remover ${item.sticker.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com total */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 p-4 space-y-3 safe-area-bottom">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="text-xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                R${totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              Encontrar Vendedor
            </Link>
            <p className="text-[10px] text-zinc-600 text-center">
              Visite a loja de um vendedor para finalizar seu pedido
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
