import { db } from "./db";

export const PLAN_LIMITS = {
  FREE: {
    maxStickers: 100,
    maxOrdersPerMonth: 10,
    maxAlbums: 1,
    features: ["basic_store"] as string[],
  },
  PRO: {
    maxStickers: 1000,
    maxOrdersPerMonth: 100,
    maxAlbums: 13,
    features: ["basic_store", "whatsapp", "custom_prices"] as string[],
  },
  UNLIMITED: {
    maxStickers: Infinity,
    maxOrdersPerMonth: Infinity,
    maxAlbums: 13,
    features: [
      "basic_store",
      "whatsapp",
      "custom_prices",
      "reports",
      "priority_support",
    ] as string[],
  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanKey] ?? PLAN_LIMITS.FREE;
}

export async function checkStickerLimit(sellerId: string, plan: string) {
  const limits = getPlanLimits(plan);
  if (limits.maxStickers === Infinity) return { allowed: true, current: 0, max: Infinity };

  const count = await db.inventory.count({
    where: { sellerId, quantity: { gt: 0 } },
  });

  return {
    allowed: count < limits.maxStickers,
    current: count,
    max: limits.maxStickers,
  };
}

export async function checkOrderLimit(sellerId: string, plan: string) {
  const limits = getPlanLimits(plan);
  if (limits.maxOrdersPerMonth === Infinity) return { allowed: true, current: 0, max: Infinity };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await db.order.count({
    where: { sellerId, createdAt: { gte: startOfMonth } },
  });

  return {
    allowed: count < limits.maxOrdersPerMonth,
    current: count,
    max: limits.maxOrdersPerMonth,
  };
}

export async function checkAlbumLimit(
  sellerId: string,
  plan: string,
  albumSlug: string
) {
  const limits = getPlanLimits(plan);
  if (limits.maxAlbums >= 13) return { allowed: true };

  // Pega álbuns distintos que o seller já tem no estoque
  const existingAlbums = await db.inventory.groupBy({
    by: ["albumSlug"],
    where: { sellerId, quantity: { gt: 0 } },
  });

  const albumSlugs = existingAlbums.map((a) => a.albumSlug);

  // Se já usa este álbum, permite
  if (albumSlugs.includes(albumSlug)) return { allowed: true };

  return {
    allowed: albumSlugs.length < limits.maxAlbums,
    current: albumSlugs.length,
    max: limits.maxAlbums,
  };
}

export function hasFeature(plan: string, feature: string) {
  const limits = getPlanLimits(plan);
  return limits.features.includes(feature);
}

export function getUsageInfo(plan: string) {
  return getPlanLimits(plan);
}
