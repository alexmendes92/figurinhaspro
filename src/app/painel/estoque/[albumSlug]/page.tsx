import { notFound } from "next/navigation";
import { albums } from "@/lib/albums";
import type { Album } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import InventoryManager from "@/components/painel/inventory-manager";

export default async function AlbumEstoquePage({
  params,
}: {
  params: Promise<{ albumSlug: string }>;
}) {
  const { albumSlug } = await params;
  const seller = await getSession();
  if (!seller) return null;

  // Busca primeiro nos estáticos, depois nos customizados
  let album: Album | undefined = albums.find((a) => a.slug === albumSlug);
  if (!album) {
    const custom = await db.customAlbum.findUnique({
      where: { sellerId_slug: { sellerId: seller.id, slug: albumSlug } },
    });
    if (custom) album = customAlbumToAlbum(custom);
  }
  if (!album) notFound();

  // Carrega estoque atual
  const inventory = await db.inventory.findMany({
    where: { sellerId: seller.id, albumSlug },
  });

  // Mapa code → { quantity, customPrice }
  const stockMap: Record<string, { quantity: number; customPrice: number | null }> = {};
  for (const item of inventory) {
    stockMap[item.stickerCode] = {
      quantity: item.quantity,
      customPrice: item.customPrice,
    };
  }

  return (
    <InventoryManager album={album} initialStock={stockMap} sellerPlan={seller.plan} />
  );
}
