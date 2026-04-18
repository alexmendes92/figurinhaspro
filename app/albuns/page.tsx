import Image from "next/image";
import Link from "next/link";
import { albums } from "@/lib/albums-data";
import { imgUrl } from "@/lib/images";

export const metadata = {
  title: "Álbuns Panini — Copa do Mundo 1974–2022",
  description: "Coleção digital completa dos álbuns Panini da Copa do Mundo FIFA",
};

export default function AlbunsPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-black font-bold text-xs font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">FigurinhasPro</span>
          </Link>
          <span className="text-xs text-zinc-500 font-[family-name:var(--font-geist-mono)]">
            13 Copas · 704 páginas
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          Coleção Digital Completa
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Álbuns Panini{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Copa do Mundo
          </span>
        </h1>
        <p className="text-zinc-400 max-w-lg mx-auto">
          De 1974 a 2022 — navegue por todas as páginas de cada álbum
        </p>
      </section>

      {/* Grid de álbuns */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {albums.map((album) => (
            <Link
              key={album.year}
              href={`/albuns/${album.year}`}
              className="group relative"
            >
              {/* Card */}
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 group-hover:border-amber-500/40 group-hover:shadow-xl group-hover:shadow-amber-500/5 transition-all duration-300">
                <Image
                  src={imgUrl(album.cover)}
                  alt={`Panini World Cup ${album.year}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)] text-white">
                    {album.year}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
                    {album.host}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                      {album.pageCount} páginas
                    </span>
                  </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-500/0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-amber-500 transition-all duration-300">
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-black text-[8px] font-bold font-[family-name:var(--font-geist-mono)]">F</span>
            </div>
            <span className="text-xs text-zinc-500">FigurinhasPro</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-[family-name:var(--font-geist-mono)]">
            figurinhaspro.com
          </span>
        </div>
      </footer>
    </div>
  );
}
