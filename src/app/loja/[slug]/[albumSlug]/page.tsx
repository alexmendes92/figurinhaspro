import { cacheTag } from "next/cache";
import { Bebas_Neue } from "next/font/google";
import { notFound } from "next/navigation";
import StoreAlbumView from "@/components/loja/store-album-view";
import type { Album } from "@/lib/albums";
import { albums } from "@/lib/albums";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import { db } from "@/lib/db";
import { buildStickerSectionMap } from "@/lib/price-resolver";
import { getSellerCatalog } from "@/lib/seller-catalog";
import { storeCacheTag } from "@/lib/store-cache";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

/**
 * Dados cacheados da vitrine pública.
 *
 * Recebe sellerId + albumSlug como ARGUMENTOS (não relê de params/cookies dentro
 * do escopo cached). Tag isolada por seller — vetor B1 do plano v6 fechado:
 * dois sellers com mesmo albumSlug retornam dados distintos sem cross-leak.
 *
 * Inválida via revalidateTag(storeCacheTag(sellerId, albumSlug)) nas APIs de
 * inventory (src/app/api/inventory/{route,bulk/route}.ts).
 */
async function getStorePageData(sellerId: string, albumSlug: string) {
  "use cache";
  cacheTag(storeCacheTag(sellerId, albumSlug));

  // Re-resolver seller dentro do cache (não usa cookies/headers — só DB)
  const seller = await db.seller.findUnique({ where: { id: sellerId } });
  if (!seller) return null;

  // Busca estático ou customizado
  let album: Album | undefined = albums.find((a) => a.slug === albumSlug);
  if (!album) {
    const custom = await db.customAlbum.findUnique({
      where: { sellerId_slug: { sellerId, slug: albumSlug } },
    });
    if (custom) album = customAlbumToAlbum(custom);
  }
  if (!album) return null;

  const [inventory, priceRules, sectionRules, quantityTiers, catalog] = await Promise.all([
    db.inventory.findMany({
      where: { sellerId, albumSlug, quantity: { gt: 0 } },
    }),
    db.priceRule.findMany({
      where: {
        sellerId,
        OR: [{ albumSlug: null }, { albumSlug: "" }, { albumSlug }],
      },
    }),
    db.sectionPriceRule.findMany({
      where: { sellerId, albumSlug },
    }),
    db.quantityTier.findMany({
      where: { sellerId, albumSlug },
      orderBy: { minQuantity: "asc" },
    }),
    getSellerCatalog(sellerId),
  ]);

  const stockMap: Record<string, { quantity: number; customPrice: number | null }> = {};
  for (const item of inventory) {
    stockMap[item.stickerCode] = {
      quantity: item.quantity,
      customPrice: item.customPrice,
    };
  }

  // Monta priceMap com prioridade: albumRule > globalRule
  const priceMap: Record<string, number> = {};
  for (const rule of priceRules) {
    if (!rule.albumSlug) priceMap[rule.stickerType] = rule.price;
  }
  for (const rule of priceRules) {
    if (rule.albumSlug === albumSlug) priceMap[rule.stickerType] = rule.price;
  }

  const stickerSectionMap = buildStickerSectionMap(album.sections);

  const sectionRulesMap: Record<string, { adjustType: string; value: number }> = {};
  for (const rule of sectionRules) {
    sectionRulesMap[rule.sectionName] = {
      adjustType: rule.adjustType,
      value: rule.value,
    };
  }

  const tiersData = quantityTiers.map((t) => ({
    minQuantity: t.minQuantity,
    discount: t.discount,
  }));

  return {
    album,
    seller: {
      shopName: seller.shopName,
      phone: seller.phone,
      shopDescription: seller.shopDescription,
      businessHours: seller.businessHours,
      paymentMethods: seller.paymentMethods,
    },
    stockMap,
    priceMap,
    stickerSectionMap,
    sectionRulesMap,
    tiersData,
    catalog,
  };
}

export default async function LojaAlbumPage({
  params,
}: {
  params: Promise<{ slug: string; albumSlug: string }>;
}) {
  const { slug, albumSlug } = await params;

  // Resolve seller fora do escopo cached (slug → id). Necessário porque o cache
  // chave por seller.id (não por shopSlug) pra evitar invalidação cross-seller.
  const seller = await db.seller.findUnique({ where: { shopSlug: slug } });
  if (!seller) notFound();

  const data = await getStorePageData(seller.id, albumSlug);
  if (!data) notFound();

  return (
    <div className={bebas.variable}>
      <StoreAlbumView
        album={data.album}
        stockMap={data.stockMap}
        priceMap={data.priceMap}
        sellerSlug={slug}
        sellerName={data.seller.shopName}
        sellerPhone={data.seller.phone}
        sellerDescription={data.seller.shopDescription}
        sellerBusinessHours={data.seller.businessHours}
        sellerPaymentMethods={data.seller.paymentMethods}
        availableAlbums={data.catalog}
        stickerSectionMap={data.stickerSectionMap}
        sectionRulesMap={data.sectionRulesMap}
        quantityTiers={data.tiersData}
      />
    </div>
  );
}
