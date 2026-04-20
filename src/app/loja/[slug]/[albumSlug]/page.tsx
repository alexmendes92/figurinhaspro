import { Bebas_Neue } from "next/font/google";
import { notFound } from "next/navigation";
import StoreAlbumView from "@/components/loja/store-album-view";
import type { Album } from "@/lib/albums";
import { albums } from "@/lib/albums";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import { db } from "@/lib/db";
import { buildStickerSectionMap } from "@/lib/price-resolver";
import { getSellerCatalog } from "@/lib/seller-catalog";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export default async function LojaAlbumPage({
  params,
}: {
  params: Promise<{ slug: string; albumSlug: string }>;
}) {
  const { slug, albumSlug } = await params;

  const seller = await db.seller.findUnique({
    where: { shopSlug: slug },
  });
  if (!seller) notFound();

  // Busca estático ou customizado
  let album: Album | undefined = albums.find((a) => a.slug === albumSlug);
  if (!album) {
    const custom = await db.customAlbum.findUnique({
      where: { sellerId_slug: { sellerId: seller.id, slug: albumSlug } },
    });
    if (custom) album = customAlbumToAlbum(custom);
  }
  if (!album) notFound();

  // Busca estoque, regras de preço, section rules, quantity tiers e catálogo em paralelo
  const [inventory, priceRules, sectionRules, quantityTiers, catalog] = await Promise.all([
    db.inventory.findMany({
      where: { sellerId: seller.id, albumSlug, quantity: { gt: 0 } },
    }),
    db.priceRule.findMany({
      where: {
        sellerId: seller.id,
        OR: [{ albumSlug: null }, { albumSlug: "" }, { albumSlug }],
      },
    }),
    db.sectionPriceRule.findMany({
      where: { sellerId: seller.id, albumSlug },
    }),
    db.quantityTier.findMany({
      where: { sellerId: seller.id, albumSlug },
      orderBy: { minQuantity: "asc" },
    }),
    getSellerCatalog(seller.id),
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
    if (!rule.albumSlug) {
      priceMap[rule.stickerType] = rule.price;
    }
  }
  for (const rule of priceRules) {
    if (rule.albumSlug === albumSlug) {
      priceMap[rule.stickerType] = rule.price;
    }
  }

  // Mapa seção por figurinha (pré-calculado server-side, não envia albums.ts ao client)
  const stickerSectionMap = buildStickerSectionMap(album.sections);

  // Serializa section rules para o client
  const sectionRulesMap: Record<string, { adjustType: string; value: number }> = {};
  for (const rule of sectionRules) {
    sectionRulesMap[rule.sectionName] = {
      adjustType: rule.adjustType,
      value: rule.value,
    };
  }

  // Serializa quantity tiers para o client
  const tiersData = quantityTiers.map((t) => ({
    minQuantity: t.minQuantity,
    discount: t.discount,
  }));

  return (
    <div className={bebas.variable}>
      <StoreAlbumView
        album={album}
        stockMap={stockMap}
        priceMap={priceMap}
        sellerSlug={slug}
        sellerName={seller.shopName}
        sellerPhone={seller.phone}
        sellerDescription={seller.shopDescription}
        sellerBusinessHours={seller.businessHours}
        sellerPaymentMethods={seller.paymentMethods}
        availableAlbums={catalog}
        stickerSectionMap={stickerSectionMap}
        sectionRulesMap={sectionRulesMap}
        quantityTiers={tiersData}
      />
    </div>
  );
}
