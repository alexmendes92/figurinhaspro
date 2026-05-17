/**
 * Cria pedido (Order) com preço revalidado server-side e decremento atômico
 * de Inventory na mesma transação. Compartilhado por /api/orders (vitrine)
 * e /api/bot/quote (WhatsApp).
 *
 * Spec: thoughts/planos/2026-05-17-seguranca-pedido.md — Furo 1 (server confia
 * em campo do cliente). resolveUnitPrice é chamado server-side; cliente envia
 * unitPrice apenas para validação de coerência (underpay rejeitado), nunca
 * persistido — Order.items grava o preço resolvido.
 */

import { db } from "@/lib/db";
import { albums, type Album, type Sticker } from "@/lib/albums";
import { customAlbumToAlbum } from "@/lib/custom-albums";
import {
  resolveUnitPrice,
  type PriceContext,
  type SectionRule,
} from "@/lib/price-resolver";
import type { Order, OrderItem } from "@/generated/prisma/client";

export interface QuoteItem {
  albumSlug: string;
  stickerCode: string;
  stickerName: string;
  quantity: number;
  /** Preço informado pelo cliente — server compara contra o resolvido. Nunca persistido. */
  unitPrice: number;
}

export type Channel = "SYSTEM" | "WHATSAPP" | "MANUAL";

export class PriceManipulationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceManipulationError";
  }
}
export class InventoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryNotFoundError";
  }
}
export class AlbumNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlbumNotFoundError";
  }
}

interface PricingContext {
  globalTypeRules: Record<string, number>;
  albumTypeRulesMap: Map<string, Record<string, number>>;
  sectionRulesMap: Map<string, Map<string, SectionRule>>;
  albumsBySlug: Map<string, Album>;
}

interface ResolvedItem {
  item: QuoteItem;
  resolvedPrice: number;
}

async function loadPricingContext(sellerId: string): Promise<PricingContext> {
  const [priceRules, sectionRules, customAlbums] = await Promise.all([
    db.priceRule.findMany({ where: { sellerId } }),
    db.sectionPriceRule.findMany({ where: { sellerId } }),
    db.customAlbum.findMany({ where: { sellerId } }),
  ]);

  const globalTypeRules: Record<string, number> = {};
  const albumTypeRulesMap = new Map<string, Record<string, number>>();
  for (const rule of priceRules) {
    if (!rule.albumSlug) {
      globalTypeRules[rule.stickerType] = rule.price;
      continue;
    }
    const existing = albumTypeRulesMap.get(rule.albumSlug) ?? {};
    existing[rule.stickerType] = rule.price;
    albumTypeRulesMap.set(rule.albumSlug, existing);
  }

  const sectionRulesMap = new Map<string, Map<string, SectionRule>>();
  for (const r of sectionRules) {
    const albumMap = sectionRulesMap.get(r.albumSlug) ?? new Map<string, SectionRule>();
    albumMap.set(r.sectionName, {
      sectionName: r.sectionName,
      adjustType: r.adjustType as "FLAT" | "OFFSET",
      value: r.value,
    });
    sectionRulesMap.set(r.albumSlug, albumMap);
  }

  const albumsBySlug = new Map<string, Album>();
  for (const a of albums) albumsBySlug.set(a.slug, a);
  for (const ca of customAlbums) albumsBySlug.set(ca.slug, customAlbumToAlbum(ca));

  return { globalTypeRules, albumTypeRulesMap, sectionRulesMap, albumsBySlug };
}

function findStickerInAlbum(
  album: Album,
  stickerCode: string
): { sticker: Sticker; sectionName: string } | null {
  for (const section of album.sections) {
    const found = section.stickers.find((s) => s.code === stickerCode);
    if (found) return { sticker: found, sectionName: section.name };
  }
  return null;
}

async function resolveItem(
  sellerId: string,
  item: QuoteItem,
  ctx: PricingContext
): Promise<ResolvedItem> {
  const album = ctx.albumsBySlug.get(item.albumSlug);
  if (!album) {
    throw new AlbumNotFoundError(
      `Álbum '${item.albumSlug}' não encontrado (esperado: catálogo estático ou CustomAlbum do seller).`
    );
  }

  const inventory = await db.inventory.findUnique({
    where: {
      sellerId_albumSlug_stickerCode: {
        sellerId,
        albumSlug: item.albumSlug,
        stickerCode: item.stickerCode,
      },
    },
  });
  if (!inventory) {
    throw new InventoryNotFoundError(
      `Sticker ${item.stickerCode} do álbum '${item.albumSlug}' não está no estoque do seller ${sellerId}.`
    );
  }

  const meta = findStickerInAlbum(album, item.stickerCode);
  const stickerType = meta?.sticker.type ?? "regular";
  const sectionName = meta?.sectionName ?? "Geral";

  const priceCtx: PriceContext = {
    customPrice: inventory.customPrice ?? null,
    stickerType,
    sectionName,
    albumTypeRules: ctx.albumTypeRulesMap.get(item.albumSlug) ?? {},
    globalTypeRules: ctx.globalTypeRules,
    sectionRules: ctx.sectionRulesMap.get(item.albumSlug) ?? new Map(),
  };
  const resolvedPrice = resolveUnitPrice(priceCtx);

  if (item.unitPrice < resolvedPrice) {
    throw new PriceManipulationError(
      `unitPrice do cliente (${item.unitPrice}) abaixo do preço resolvido server-side (${resolvedPrice}) para ${item.stickerCode}.`
    );
  }

  return { item, resolvedPrice };
}

export async function createQuoteWithDecrement(
  sellerId: string,
  customerName: string,
  customerPhone: string | null,
  customerEmail: string | null,
  items: QuoteItem[],
  channel: Channel,
  notes: string | null = null
): Promise<Order & { items: OrderItem[] }> {
  const ctx = await loadPricingContext(sellerId);
  const resolved: ResolvedItem[] = [];
  for (const item of items) {
    resolved.push(await resolveItem(sellerId, item, ctx));
  }

  const totalPrice = resolved.reduce(
    (sum, r) => sum + r.resolvedPrice * r.item.quantity,
    0
  );

  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        sellerId,
        customerName,
        customerPhone,
        customerEmail,
        channel,
        notes,
        totalPrice,
        items: {
          create: resolved.map((r) => ({
            albumSlug: r.item.albumSlug,
            stickerCode: r.item.stickerCode,
            stickerName: r.item.stickerName,
            quantity: r.item.quantity,
            unitPrice: r.resolvedPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const r of resolved) {
      const inv = await tx.inventory.findUnique({
        where: {
          sellerId_albumSlug_stickerCode: {
            sellerId,
            albumSlug: r.item.albumSlug,
            stickerCode: r.item.stickerCode,
          },
        },
      });
      if (!inv || inv.quantity < r.item.quantity) {
        throw new InventoryNotFoundError(
          `Estoque insuficiente para ${r.item.stickerCode} na transação: precisa ${r.item.quantity}, tem ${inv?.quantity ?? 0}.`
        );
      }
      await tx.inventory.update({
        where: {
          sellerId_albumSlug_stickerCode: {
            sellerId,
            albumSlug: r.item.albumSlug,
            stickerCode: r.item.stickerCode,
          },
        },
        data: { quantity: { decrement: r.item.quantity } },
      });
    }

    return order;
  });
}
