/**
 * Helper server-side para montar o catálogo de álbuns de um seller.
 * Centraliza a lógica que antes era duplicada em loja, estoque e preços.
 *
 * Nesta primeira entrega, apenas a loja pública e a rota de estatísticas usam.
 * As rotas de estoque e preços continuam com lógica inline (tech debt futuro).
 */

import type { Album } from "@/lib/albums";
import { albums } from "@/lib/albums";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import { db } from "@/lib/db";

export interface AlbumSummary {
  slug: string;
  title: string;
  year: string;
  flag: string;
  host: string;
  totalStickers: number;
  inStockTypes: number; // figurinhas distintas com qty > 0
  isCustom: boolean;
}

/**
 * Carrega catálogo completo do seller (estáticos + customizados),
 * com contagem de estoque por álbum.
 *
 * Ordenação: estáticos por ano desc, customizados no final.
 * Retorna apenas álbuns que possuem estoque.
 */
export async function getSellerCatalog(sellerId: string): Promise<AlbumSummary[]> {
  // Busca contagem e custom albums em paralelo
  const [inventoryCounts, customAlbumsDb] = await Promise.all([
    db.inventory.groupBy({
      by: ["albumSlug"],
      where: { sellerId, quantity: { gt: 0 } },
      _count: { stickerCode: true },
    }),
    db.customAlbum.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stockByAlbum = new Map<string, number>(
    inventoryCounts.map((i: { albumSlug: string; _count: { stickerCode: number } }) => [
      i.albumSlug,
      i._count.stickerCode,
    ])
  );

  const customAlbumsList = customAlbumsDb.map(customAlbumToAlbum);
  const customSlugs = new Set(customAlbumsList.map((a) => a.slug));
  const allAlbums: Album[] = [...albums, ...customAlbumsList];

  const summaries: AlbumSummary[] = allAlbums
    .filter((a) => (stockByAlbum.get(a.slug) || 0) > 0)
    .map((a) => ({
      slug: a.slug,
      title: customSlugs.has(a.slug) ? a.title : `Copa ${a.year}`,
      year: a.year,
      flag: a.flag,
      host: a.host,
      totalStickers: a.totalStickers,
      inStockTypes: stockByAlbum.get(a.slug) || 0,
      isCustom: customSlugs.has(a.slug),
    }))
    .sort((a, b) => {
      // Estáticos por ano desc, customizados no final
      if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
      return Number.parseInt(b.year || "0", 10) - Number.parseInt(a.year || "0", 10);
    });

  return summaries;
}

/**
 * Retorna o slug do álbum padrão — aquele com mais figurinhas distintas em estoque.
 * Em caso de empate, respeita a ordenação do catálogo (ano desc → estáticos primeiro).
 */
export function getDefaultAlbumSlug(catalog: AlbumSummary[]): string | null {
  if (catalog.length === 0) return null;

  let best = catalog[0];
  for (const album of catalog) {
    if (album.inStockTypes > best.inStockTypes) {
      best = album;
    }
  }
  return best.slug;
}
