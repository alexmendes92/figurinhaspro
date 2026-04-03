"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart-context";

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
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col slide-in">
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
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50"
                >
                  {/* Thumb */}
                  <div className="relative w-10 h-14 rounded overflow-hidden border border-zinc-700 shrink-0">
                    <Image
                      src={item.sticker.image}
                      alt={item.sticker.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.sticker.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                      {item.albumYear} · {item.sticker.code}
                      {item.sticker.type !== "regular" && (
                        <span className="ml-1 text-amber-400">
                          ✨ {item.sticker.type}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Quantidade */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.sticker.code + "-" + item.albumYear,
                          item.quantity - 1
                        )
                      }
                      className="w-6 h-6 rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 text-xs"
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
                      className="w-6 h-6 rounded border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Preço */}
                  <span className="text-sm font-[family-name:var(--font-geist-mono)] text-amber-400 w-16 text-right">
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
                    className="text-zinc-600 hover:text-red-400 transition-colors"
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
          <div className="border-t border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total</span>
              <span className="text-xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
                R${totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <button className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Finalizar Pedido
            </button>
            <p className="text-[10px] text-zinc-600 text-center">
              Enviaremos os detalhes por WhatsApp para confirmar o pedido
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
