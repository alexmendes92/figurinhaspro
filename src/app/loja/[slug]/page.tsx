import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { albumCovers } from "@/lib/album-covers";
import { getSellerCatalog, getDefaultAlbumSlug } from "@/lib/seller-catalog";
import Image from "next/image";
import Link from "next/link";
import { imgUrl } from "@/lib/images";

export default async function LojaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const seller = await db.seller.findUnique({ where: { shopSlug: slug } });
  if (!seller) notFound();

  const catalog = await getSellerCatalog(seller.id);
  const defaultSlug = getDefaultAlbumSlug(catalog);
  const browse = sp?.browse === "true";

  // Redirect automático para o álbum com mais estoque
  if (!browse && defaultSlug) {
    redirect(`/loja/${slug}/${defaultSlug}`);
  }

  const totalAvailable = catalog.reduce((s, a) => s + a.inStockTypes, 0);

  return (
    <div className="min-h-screen">
      {/* Header com identidade */}
      <header className="sticky top-0 z-50 bg-[#0b0e14]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <span className="text-black font-bold text-sm font-[family-name:var(--font-geist-mono)]">
                  {seller.shopName[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{seller.shopName}</h1>
                <p className="text-[10px] text-gray-500 font-[family-name:var(--font-geist-mono)]">
                  {totalAvailable} figurinhas disponiveis
                </p>
              </div>
            </div>

            {seller.phone && (
              <a
                href={`https://wa.me/55${seller.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-600/20 shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
                <span className="hidden sm:inline">{seller.phone}</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            )}
          </div>

          {/* Info expandida — descrição, horário, pagamento */}
          {(seller.shopDescription || seller.businessHours || seller.paymentMethods) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-gray-500">
              {seller.shopDescription && (
                <span className="text-gray-400">{seller.shopDescription}</span>
              )}
              {seller.businessHours && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {seller.businessHours}
                </span>
              )}
              {seller.paymentMethods && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  {seller.paymentMethods}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        {catalog.length === 0 ? (
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
              {catalog.map((album) => {
                const coverData = albumCovers[album.slug];
                const coverSrc = coverData?.cover;
                const flagSrc = coverData ? `/flags/${coverData.hostFlag}.svg` : null;

                return (
                  <Link
                    key={album.slug}
                    href={`/loja/${slug}/${album.slug}`}
                    className={`group rounded-2xl border bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30 ${
                      album.isCustom ? "border-amber-500/20" : "border-zinc-800"
                    }`}
                  >
                    {/* Capa */}
                    <div className="relative aspect-[3/4] bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden">
                      {coverSrc ? (
                        <Image
                          src={imgUrl(coverSrc)}
                          alt={album.title}
                          fill
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : album.isCustom ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2">
                              <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                            </div>
                            {album.year && <p className="text-xs text-zinc-500">{album.year}</p>}
                          </div>
                        </div>
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
                          <Image src={imgUrl(flagSrc)} alt="" width={16} height={16} className="rounded-full" />
                        )}
                        <p className="text-sm font-bold text-white truncate">
                          {album.title}
                        </p>
                      </div>
                      <p className="text-xs text-amber-400 font-[family-name:var(--font-geist-mono)] font-semibold">
                        {album.inStockTypes} figurinhas disponíveis
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
