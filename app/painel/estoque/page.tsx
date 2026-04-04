import { albums } from "@/lib/albums";
import { albumCovers } from "@/lib/album-covers";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { customAlbumToAlbum } from "@/lib/custom-albums";

export default async function EstoquePage() {
  const seller = await getSession();
  if (!seller) return null;

  const inventoryCounts = await db.inventory.groupBy({
    by: ["albumSlug"],
    where: { sellerId: seller.id, quantity: { gt: 0 } },
    _count: { stickerCode: true },
  });

  const countMap = new Map<string, number>(
    inventoryCounts.map((c: { albumSlug: string; _count: { stickerCode: number } }) => [c.albumSlug, c._count.stickerCode])
  );

  // Busca álbuns customizados do seller
  const customAlbumsDb = await db.customAlbum.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
  const customAlbumsList = customAlbumsDb.map(customAlbumToAlbum);

  const allAlbums = [...albums, ...customAlbumsList];

  const totalInStock = inventoryCounts.reduce((s: number, c: { _count: { stickerCode: number } }) => s + c._count.stickerCode, 0);
  const totalStickers = allAlbums.reduce((s: number, a: { totalStickers: number }) => s + a.totalStickers, 0);

  // Estáticos ordenados por ano, customizados no final
  const sortedStaticAlbums = [...albums].sort(
    (a, b) => parseInt(b.year) - parseInt(a.year)
  );
  const sortedAlbums = [...sortedStaticAlbums, ...customAlbumsList];
  const customSlugs = new Set(customAlbumsList.map((a) => a.slug));

  return (
    <div className="p-6 lg:p-8 max-w-6xl slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Selecione um álbum para gerenciar suas figurinhas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/painel/estoque/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Cadastrar álbum</span>
          </Link>
        <div className="text-right hidden sm:block">
          <p className="text-3xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
            {totalInStock.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            de {totalStickers.toLocaleString("pt-BR")} figurinhas
          </p>
        </div>
        </div>
      </div>

      {/* Grid de álbuns com capas oficiais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {sortedAlbums.map((album) => {
          const isCustom = customSlugs.has(album.slug);
          const inStock = countMap.get(album.slug) || 0;
          const pct = Math.round((inStock / album.totalStickers) * 100);
          const coverData = albumCovers[album.slug];
          const coverSrc = coverData?.cover;
          const flagSrc = coverData ? `/flags/${coverData.hostFlag}.svg` : null;

          return (
            <Link
              key={album.slug}
              href={`/painel/estoque/${album.slug}`}
              className={`group relative rounded-2xl border bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30 ${
                isCustom ? "border-amber-500/20" : "border-zinc-800"
              }`}
            >
              {/* Capa do álbum */}
              <div className="relative aspect-[3/4] bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center p-4 overflow-hidden">
                {coverSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={coverSrc}
                    alt={`Copa ${album.year}`}
                    className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : isCustom ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <p className="text-xs text-amber-400/70 font-medium">Personalizado</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl">{album.flag}</span>
                    <p className="text-xs text-zinc-500 mt-2">Copa {album.year}</p>
                  </div>
                )}

                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Badge estoque */}
                {inStock > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/90 text-[10px] font-bold text-black">
                    {pct}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2 mb-2">
                  {flagSrc && (
                    <Image
                      src={flagSrc}
                      alt={coverData?.host || ""}
                      width={18}
                      height={18}
                      className="rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {isCustom ? album.title : `Copa ${album.year}`}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {isCustom
                        ? `${album.totalStickers} figurinhas`
                        : coverData?.host || album.host}
                    </p>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-500">
                    {inStock}/{album.totalStickers}
                  </span>
                  <span
                    className={`font-[family-name:var(--font-geist-mono)] text-[10px] font-bold ${
                      pct === 0
                        ? "text-zinc-600"
                        : pct >= 80
                        ? "text-green-400"
                        : pct >= 30
                        ? "text-amber-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct === 0
                        ? "bg-zinc-700"
                        : pct >= 80
                        ? "bg-green-500"
                        : pct >= 30
                        ? "bg-amber-500"
                        : "bg-zinc-500"
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
