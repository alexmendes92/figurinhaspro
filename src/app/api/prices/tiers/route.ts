import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const tierSchema = z.object({
  albumSlug: z.string().min(1),
  minQuantity: z.number().int().positive(),
  discount: z.number().min(0).max(99), // percentual de 0 a 99%
});

// POST — cria/atualiza faixa de desconto por quantidade
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = tierSchema.parse(body);

    const tier = await db.quantityTier.upsert({
      where: {
        sellerId_albumSlug_minQuantity: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          minQuantity: data.minQuantity,
        },
      },
      update: { discount: data.discount },
      create: {
        sellerId: seller.id,
        albumSlug: data.albumSlug,
        minQuantity: data.minQuantity,
        discount: data.discount,
      },
    });

    return NextResponse.json(tier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  albumSlug: z.string().min(1),
  minQuantity: z.number().int().positive(),
});

// DELETE — remove faixa de desconto
export async function DELETE(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = deleteSchema.parse(body);

    await db.quantityTier.delete({
      where: {
        sellerId_albumSlug_minQuantity: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          minQuantity: data.minQuantity,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Faixa não encontrada" }, { status: 404 });
  }
}
