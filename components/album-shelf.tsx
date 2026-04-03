"use client";

import Image from "next/image";
import type { Album } from "@/lib/albums";

interface AlbumShelfProps {
  albums: Album[];
  onSelect: (album: Album) => void;
}

export default function AlbumShelf({ albums, onSelect }: AlbumShelfProps) {
  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Título da seção */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Escolha um Álbum
          </h2>
          <p className="text-zinc-500 text-sm">
            Navegue pelas figurinhas e adicione ao carrinho as que você precisa
          </p>
        </div>

        {/* Grid de álbuns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album) => {
            // Usa a primeira figurinha como thumbnail
            const firstSticker = album.sections[0]?.stickers[0];
            const coverSrc = firstSticker?.image || "";

            return (
              <button
                key={album.slug}
                onClick={() => onSelect(album)}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden text-left transition-all hover:border-amber-500/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {/* Miniatura com mosaico de figurinhas */}
                <div className="relative aspect-[3/4] bg-zinc-800 overflow-hidden">
                  {/* Grid de 4 figurinhas como preview */}
                  <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-px bg-zinc-700">
                    {album.sections
                      .flatMap((s) => s.stickers)
                      .slice(0, 4)
                      .map((s, i) => (
                        <div key={i} className="relative overflow-hidden">
                          <Image
                            src={s.image}
                            alt={s.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 25vw, 15vw"
                          />
                        </div>
                      ))}
                  </div>

                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Badge do ano */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm border border-zinc-700 rounded-md px-2 py-0.5">
                    <span className="font-[family-name:var(--font-geist-mono)] text-xs font-bold text-amber-400">
                      {album.year}
                    </span>
                  </div>

                  {/* Flag */}
                  <div className="absolute top-2 right-2 text-lg">
                    {album.flag}
                  </div>

                  {/* Info na base */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-medium text-white truncate">
                      {album.host}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-amber-400/80">
                        🏆 {album.champion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra inferior */}
                <div className="px-3 py-2 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-500">
                    {album.totalStickers} figurinhas
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
