"use client";

import { useState } from "react";
import type { Album } from "@/lib/albums";
import { useCart } from "@/lib/cart-context";
import AlbumShelf from "./album-shelf";
import AlbumViewer from "./album-viewer";
import CartDrawer from "./cart-drawer";
import Toast from "./toast";

export default function AppShell({ albums }: { albums: Album[] }) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { totalItems, setIsOpen } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedAlbum && (
              <button
                onClick={() => setSelectedAlbum(null)}
                className="mr-1 w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-amber-500 font-bold font-[family-name:var(--font-geist-mono)]">P</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                {selectedAlbum
                  ? `Copa ${selectedAlbum.year} — ${selectedAlbum.host}`
                  : "Figurinhas Avulsas Panini"}
              </h1>
              <p className="text-[11px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {selectedAlbum
                  ? `${selectedAlbum.totalStickers} figurinhas · 🏆 ${selectedAlbum.champion}`
                  : "Clique nas figurinhas para comprar"}
              </p>
            </div>
          </div>

          {/* Botão do carrinho */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-amber-500/40 hover:bg-zinc-800 transition-all"
          >
            <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span className="text-sm text-zinc-300 hidden sm:inline">Carrinho</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-bold flex items-center justify-center cart-badge-bounce">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      {selectedAlbum ? (
        <AlbumViewer album={selectedAlbum} />
      ) : (
        <AlbumShelf albums={albums} onSelect={setSelectedAlbum} />
      )}

      {/* Carrinho lateral */}
      <CartDrawer />

      {/* Toast de notificação */}
      <Toast />
    </div>
  );
}
