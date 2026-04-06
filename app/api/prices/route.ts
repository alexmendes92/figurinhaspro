import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasFeature } from "@/lib/plan-limits";
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

    const albumSlug = data.albumSlug || null;

    if (albumSlug && !hasFeature(seller.plan, "custom_prices")) {
      return NextResponse.json(
        { error: "plan_limit", message: "Preços por álbum requer plano Pro", upgrade_url: "/painel/planos" },
        { status: 403 }
      );
    }

    // Para o unique constraint: null → usar string vazia na busca (Prisma/Postgres)
    const slugForUnique = albumSlug ?? "";

    const rule = await db.priceRule.upsert({
      where: {
        sellerId_albumSlug_stickerType: {
          sellerId: seller.id,
          albumSlug: slugForUnique,
          stickerType: data.stickerType,
        },
      },
      update: { price: data.price },
      create: {
        sellerId: seller.id,
        albumSlug: albumSlug,
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

const deleteSchema = z.object({
  albumSlug: z.string().min(1),
  stickerType: z.enum(["regular", "foil", "shiny"]),
});

// DELETE — remove regra de preço por álbum (nunca permite remover global)
export async function DELETE(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = deleteSchema.parse(body);

    await db.priceRule.delete({
      where: {
        sellerId_albumSlug_stickerType: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          stickerType: data.stickerType,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  }
}
