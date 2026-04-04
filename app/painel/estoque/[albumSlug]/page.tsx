import { notFound } from "next/navigation";
import { albums } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import InventoryManager from "@/components/painel/inventory-manager";

export default async function AlbumEstoquePage({
  params,
}: {
  params: Promise<{ albumSlug: string }>;
}) {
  const { albumSlug } = await params;
  const seller = await getSession();
  if (!seller) return null;

  const album = albums.find((a) => a.slug === albumSlug);
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
