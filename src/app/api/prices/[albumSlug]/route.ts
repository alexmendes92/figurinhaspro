import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — retorna dados completos de preço para um álbum específico
// Inclui: PriceRules (globais + album), SectionPriceRules, QuantityTiers
export async function GET(_req: Request, { params }: { params: Promise<{ albumSlug: string }> }) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { albumSlug } = await params;

  const [priceRules, sectionRules, quantityTiers] = await Promise.all([
    db.priceRule.findMany({
      where: {
        sellerId: seller.id,
        OR: [{ albumSlug: null }, { albumSlug: "" }, { albumSlug }],
      },
      orderBy: { stickerType: "asc" },
    }),
    db.sectionPriceRule.findMany({
      where: { sellerId: seller.id, albumSlug },
      orderBy: { sectionName: "asc" },
    }),
    db.quantityTier.findMany({
      where: { sellerId: seller.id, albumSlug },
      orderBy: { minQuantity: "asc" },
    }),
  ]);

  // Separa regras globais e do álbum
  const globalRules = priceRules.filter((r) => !r.albumSlug);
  const albumRules = priceRules.filter((r) => r.albumSlug === albumSlug);

  return NextResponse.json({
    globalRules,
    albumRules,
    sectionRules,
    quantityTiers,
  });
}
