import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { albums } from "@/lib/albums";
import StoreAlbumView from "@/components/loja/store-album-view";

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

  const album = albums.find((a) => a.slug === albumSlug);
  if (!album) notFound();

  // Busca estoque desse álbum
  const inventory = await db.inventory.findMany({
    where: { sellerId: seller.id, albumSlug, quantity: { gt: 0 } },
  });

  const stockMap: Record<string, { quantity: number; customPrice: number | null }> = {};
  for (const item of inventory) {
    stockMap[item.stickerCode] = {
      quantity: item.quantity,
      customPrice: item.customPrice,
    };
  }

  // Busca regras de preço (globais + específicas deste álbum)
  const priceRules = await db.priceRule.findMany({
    where: {
      sellerId: seller.id,
      OR: [
        { albumSlug: null },
        { albumSlug: "" },
        { albumSlug },
      ],
    },
  });

  // Monta priceMap com prioridade: albumRule > globalRule
  const priceMap: Record<string, number> = {};
  // Primeiro globais (albumSlug null ou "")
  for (const rule of priceRules) {
    if (!rule.albumSlug) {
      priceMap[rule.stickerType] = rule.price;
    }
  }
  // Depois album-specific (sobrescreve)
  for (const rule of priceRules) {
    if (rule.albumSlug === albumSlug) {
      priceMap[rule.stickerType] = rule.price;
    }
  }

  return (
    <StoreAlbumView
      album={album}
      stockMap={stockMap}
      priceMap={priceMap}
      sellerSlug={slug}
      sellerName={seller.shopName}
      sellerPhone={seller.phone}
    />
  );
}
