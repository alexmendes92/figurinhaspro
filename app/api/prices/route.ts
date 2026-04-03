import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// GET — lista regras de preço do revendedor
export async function GET() {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const rules = await db.priceRule.findMany({
    where: { sellerId: seller.id },
    orderBy: { stickerType: "asc" },
  });

  return NextResponse.json(rules);
}

const priceSchema = z.object({
  albumSlug: z.string().nullable().optional(),
  stickerType: z.enum(["regular", "foil", "shiny"]),
  price: z.number().positive(),
});

// POST — cria/atualiza regra de preço
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = priceSchema.parse(body);

    const rule = await db.priceRule.upsert({
      where: {
        sellerId_albumSlug_stickerType: {
          sellerId: seller.id,
          albumSlug: data.albumSlug ?? "",
          stickerType: data.stickerType,
        },
      },
      update: { price: data.price },
      create: {
        sellerId: seller.id,
        albumSlug: data.albumSlug ?? null,
        stickerType: data.stickerType,
        price: data.price,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
