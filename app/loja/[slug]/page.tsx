import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { albums } from "@/lib/albums";
import { albumCovers } from "@/lib/album-covers";
import Image from "next/image";
import Link from "next/link";

export default async function LojaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const seller = await db.seller.findUnique({ where: { shopSlug: slug } });
  if (!seller) notFound();

  const inventory = await db.inventory.groupBy({
    by: ["albumSlug"],
    where: { sellerId: seller.id, quantity: { gt: 0 } },
    _count: { stickerCode: true },
  });

  const stockByAlbum = new Map<string, number>(
    inventory.map((i: { albumSlug: string; _count: { stickerCode: number } }) => [i.albumSlug, i._count.stickerCode])
  );
  const availableAlbums = albums
    .filter((a) => (stockByAlbum.get(a.slug) || 0) > 0)
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));
  const totalAvailable = inventory.reduce((s: number, i: { _count: { stickerCode: number } }) => s + i._count.stickerCode, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <span className="text-black font-bold text-sm font-[family-name:var(--font-geist-mono)]">
                {seller.shopName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{seller.shopName}</h1>
              <p className="text-[10px] text-zinc-500 font-[family-name:var(--font-geist-mono)]">
                {totalAvailable} figurinhas disponíveis
              </p>
            </div>
          </div>

          {seller.phone && (
            <a
              href={`https://wa.me/55${seller.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-600/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        {availableAlbums.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">Nenhuma figurinha disponível</p>
            <p className="text-xs text-zinc-600 mt-1">Esta loja ainda não adicionou figurinhas ao estoque.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Álbuns disponíveis</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Selecione um álbum para ver e comprar figurinhas
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {availableAlbums.map((album) => {
                const count = stockByAlbum.get(album.slug) || 0;
                const coverData = albumCovers[album.slug];
                const coverSrc = coverData?.cover;
                const flagSrc = coverData ? `/flags/${coverData.hostFlag}.svg` : null;

                return (
                  <Link
                    key={album.slug}
                    href={`/loja/${slug}/${album.slug}`}
                    className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30"
                  >
                    {/* Capa */}
                    <div className="relative aspect-[3/4] bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
                      {coverSrc ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={coverSrc}
                          alt={`Copa ${album.year}`}
                          className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-5xl">{album.flag}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        {flagSrc && (
                          <Image src={flagSrc} alt="" width={16} height={16} className="rounded-full" />
                        )}
                        <p className="text-sm font-bold text-white">Copa {album.year}</p>
                      </div>
                      <p className="text-xs text-amber-400 font-[family-name:var(--font-geist-mono)] font-semibold">
                        {count} figurinhas disponíveis
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-zinc-800/50 px-4 py-5 text-center">
        <p className="text-[10px] text-zinc-600">
          Powered by <span className="text-amber-500 font-semibold">FigurinhasPro</span>
        </p>
      </footer>
    </div>
  );
}
