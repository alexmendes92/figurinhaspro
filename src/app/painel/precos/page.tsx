import { getSession } from "@/lib/auth";
import { albums } from "@/lib/albums";
import { albumCovers } from "@/lib/album-covers";
import { db } from "@/lib/db";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import Link from "next/link";
import Image from "next/image";
import PrecosGlobalEditor from "@/components/painel/precos-global-editor";
import { imgUrl } from "@/lib/images";

export default async function PrecosPage() {
  const seller = await getSession();
  if (!seller) return null;

  // Conta figurinhas em estoque por álbum
  const inventoryCounts = await db.inventory.groupBy({
    by: ["albumSlug"],
    where: { sellerId: seller.id, quantity: { gt: 0 } },
    _count: { stickerCode: true },
  });

  const countMap = new Map<string, number>(
    inventoryCounts.map((c: { albumSlug: string; _count: { stickerCode: number } }) => [c.albumSlug, c._count.stickerCode])
  );

  // Conta regras de preço configuradas por álbum
  const [albumRules, sectionRules, quantityTiers] = await Promise.all([
    db.priceRule.groupBy({
      by: ["albumSlug"],
      where: {
        sellerId: seller.id,
        albumSlug: { not: null },
        AND: [{ albumSlug: { not: "" } }],
      },
      _count: { id: true },
    }),
    db.sectionPriceRule.groupBy({
      by: ["albumSlug"],
      where: { sellerId: seller.id },
      _count: { id: true },
    }),
    db.quantityTier.groupBy({
      by: ["albumSlug"],
      where: { sellerId: seller.id },
      _count: { id: true },
    }),
  ]);

  const rulesCountMap = new Map<string, number>();
  for (const r of albumRules) {
    if (r.albumSlug) rulesCountMap.set(r.albumSlug, (rulesCountMap.get(r.albumSlug) || 0) + r._count.id);
  }
  for (const r of sectionRules) {
    rulesCountMap.set(r.albumSlug, (rulesCountMap.get(r.albumSlug) || 0) + r._count.id);
  }
  for (const r of quantityTiers) {
    rulesCountMap.set(r.albumSlug, (rulesCountMap.get(r.albumSlug) || 0) + r._count.id);
  }

  // Álbuns customizados
  const customAlbumsDb = await db.customAlbum.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
  const customAlbumsList = customAlbumsDb.map(customAlbumToAlbum);
  const customSlugs = new Set(customAlbumsList.map((a) => a.slug));

  // Ordena: estáticos por ano desc, customizados no final
  const sortedAlbums = [
    ...[...albums].sort((a, b) => parseInt(b.year) - parseInt(a.year)),
    ...customAlbumsList,
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl slide-up">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Preços</h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Configure preços globais e personalize por álbum, seção e quantidade.
        </p>
      </div>

      {/* Preços Globais */}
      <PrecosGlobalEditor sellerPlan={seller.plan} />

      {/* Grid de Álbuns */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight">Preços por álbum</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Clique em um álbum para configurar preços por tipo, seção e descontos por quantidade.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedAlbums.map((album) => {
            const isCustom = customSlugs.has(album.slug);
            const inStock = countMap.get(album.slug) || 0;
            const rulesCount = rulesCountMap.get(album.slug) || 0;
            const coverData = albumCovers[album.slug];
            const coverSrc = coverData?.cover;
            const flagSrc = coverData ? `/flags/${coverData.hostFlag}.svg` : null;

            return (
              <Link
                key={album.slug}
                href={`/painel/precos/${album.slug}`}
                className={`group relative rounded-2xl border bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30 ${
                  isCustom ? "border-amber-500/20" : "border-zinc-800"
                }`}
              >
                {/* Capa */}
                <div className="relative aspect-[3/4] bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center p-4 overflow-hidden">
                  {coverSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imgUrl(coverSrc)}
                      alt={`Copa ${album.year}`}
                      className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : isCustom ? (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-amber-400/70 font-medium">Personalizado</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">{album.flag}</span>
                      <p className="text-[10px] text-zinc-500 mt-1">Copa {album.year}</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {rulesCount > 0 && (
                      <div className="px-1.5 py-0.5 rounded-full bg-amber-500/90 text-[9px] font-bold text-black">
                        {rulesCount} {rulesCount === 1 ? "regra" : "regras"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    {flagSrc && (
                      <Image
                        src={imgUrl(flagSrc)}
                        alt={coverData?.host || ""}
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {isCustom ? album.title : `Copa ${album.year}`}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {inStock > 0 ? `${inStock} em estoque` : "Sem estoque"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
