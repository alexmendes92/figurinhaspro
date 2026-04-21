// src/lib/bot-search.ts
// Busca de figurinhas para o bot WhatsApp.
// Combina inventario real (DB) com metadados estaticos (albums.ts).
// Aplica price-resolver para calcular preco final.

import type { Album } from "@/lib/albums";
import { albums } from "@/lib/albums";
import { db } from "@/lib/db";
import {
  type PriceContext,
  type SectionRule,
  buildStickerSectionMap,
  resolveUnitPrice,
} from "@/lib/price-resolver";

export interface BotStickerResult {
  albumSlug: string;
  albumTitle: string;
  albumYear: string;
  stickerCode: string;
  stickerName: string;
  stickerType: string;
  priceBrl: number;
  inStock: boolean;
  quantityAvailable: number;
  imageUrl: string;
  imageAbsoluteUrl: string;
}

export interface SearchOptions {
  sellerId: string;
  query?: string;
  albumSlug?: string;
  limit?: number;
  baseUrl: string;
}

export async function searchBotStickers(
  opts: SearchOptions,
): Promise<BotStickerResult[]> {
  const limit = Math.min(Math.max(opts.limit ?? 5, 1), 20);

  const inventoryRows = await db.inventory.findMany({
    where: {
      sellerId: opts.sellerId,
      quantity: { gt: 0 },
      ...(opts.albumSlug ? { albumSlug: opts.albumSlug } : {}),
    },
  });

  if (inventoryRows.length === 0) return [];

  const albumsInInv = [...new Set(inventoryRows.map((i) => i.albumSlug))];
  const [priceRules, sectionRules] = await Promise.all([
    db.priceRule.findMany({ where: { sellerId: opts.sellerId } }),
    db.sectionPriceRule.findMany({
      where: { sellerId: opts.sellerId, albumSlug: { in: albumsInInv } },
    }),
  ]);

  const globalTypeRules: Record<string, number> = {};
  const albumTypeRulesByAlbum: Record<string, Record<string, number>> = {};
  for (const r of priceRules) {
    if (!r.albumSlug) {
      globalTypeRules[r.stickerType] = r.price;
    } else {
      (albumTypeRulesByAlbum[r.albumSlug] ??= {})[r.stickerType] = r.price;
    }
  }

  const sectionRulesByAlbum = new Map<string, Map<string, SectionRule>>();
  for (const r of sectionRules) {
    if (!sectionRulesByAlbum.has(r.albumSlug)) {
      sectionRulesByAlbum.set(r.albumSlug, new Map());
    }
    const m = sectionRulesByAlbum.get(r.albumSlug);
    if (!m) continue;
    m.set(r.sectionName, {
      sectionName: r.sectionName,
      adjustType: r.adjustType as "FLAT" | "OFFSET",
      value: r.value,
    });
  }

  const albumMap = new Map<string, Album>(albums.map((a) => [a.slug, a]));
  const sectionMapByAlbum = new Map<string, Record<string, string>>();
  for (const slug of albumsInInv) {
    const alb = albumMap.get(slug);
    if (alb) sectionMapByAlbum.set(slug, buildStickerSectionMap(alb.sections));
  }

  const q = (opts.query ?? "").trim().toLowerCase();

  const out: BotStickerResult[] = [];
  for (const inv of inventoryRows) {
    const album = albumMap.get(inv.albumSlug);
    if (!album) continue;

    const section = album.sections.find((s) =>
      s.stickers.some((st) => st.code === inv.stickerCode),
    );
    const sticker = section?.stickers.find((st) => st.code === inv.stickerCode);
    if (!sticker) continue;

    if (q) {
      const matchesName = sticker.name.toLowerCase().includes(q);
      const matchesCode =
        sticker.code.toLowerCase() === q || sticker.code.toLowerCase().includes(q);
      if (!matchesName && !matchesCode) continue;
    }

    const sectionName = sectionMapByAlbum.get(inv.albumSlug)?.[inv.stickerCode] ?? "";
    const ctx: PriceContext = {
      customPrice: inv.customPrice,
      stickerType: sticker.type,
      sectionName,
      albumTypeRules: albumTypeRulesByAlbum[inv.albumSlug] ?? {},
      globalTypeRules,
      sectionRules: sectionRulesByAlbum.get(inv.albumSlug) ?? new Map(),
    };
    const priceBrl = Math.round(resolveUnitPrice(ctx) * 100) / 100;

    out.push({
      albumSlug: album.slug,
      albumTitle: album.title || `Copa ${album.year}`,
      albumYear: album.year,
      stickerCode: sticker.code,
      stickerName: sticker.name,
      stickerType: sticker.type,
      priceBrl,
      inStock: inv.quantity > 0,
      quantityAvailable: inv.quantity,
      imageUrl: sticker.image,
      imageAbsoluteUrl: `${opts.baseUrl}${sticker.image}`,
    });

    if (out.length >= limit) break;
  }

  return out;
}
