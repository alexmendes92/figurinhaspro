import { albums } from "@/lib/albums";
import { albumCovers } from "@/lib/album-covers";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const totalInStock = inventoryCounts.reduce((s: number, c: { _count: { stickerCode: number } }) => s + c._count.stickerCode, 0);
  const totalStickers = albums.reduce((s: number, a: { totalStickers: number }) => s + a.totalStickers, 0);

  // Ordena do mais recente para o mais antigo
  const sortedAlbums = [...albums].sort(
    (a, b) => parseInt(b.year) - parseInt(a.year)
  );

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
        <div className="text-right hidden sm:block">
          <p className="text-3xl font-bold font-[family-name:var(--font-geist-mono)] text-amber-400">
            {totalInStock.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            de {totalStickers.toLocaleString("pt-BR")} figurinhas
          </p>
        </div>
      </div>

      {/* Grid de álbuns com capas oficiais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {sortedAlbums.map((album) => {
          const inStock = countMap.get(album.slug) || 0;
          const pct = Math.round((inStock / album.totalStickers) * 100);
          const coverData = albumCovers[album.slug];
          const coverSrc = coverData?.cover;
          const flagSrc = coverData ? `/flags/${coverData.hostFlag}.svg` : null;

          return (
            <Link
              key={album.slug}
              href={`/painel/estoque/${album.slug}`}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30"
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
                      Copa {album.year}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {coverData?.host || album.host}
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
