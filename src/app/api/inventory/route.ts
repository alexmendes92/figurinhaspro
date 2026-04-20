import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkStickerLimit, checkAlbumLimit } from "@/lib/plan-limits";
import { z } from "zod";

// GET — lista estoque do revendedor (opcionalmente filtrado por álbum)
export async function GET(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const albumSlug = req.nextUrl.searchParams.get("album");

  const inventory = await db.inventory.findMany({
    where: {
      sellerId: seller.id,
      ...(albumSlug ? { albumSlug } : {}),
    },
    orderBy: { stickerCode: "asc" },
  });

  return NextResponse.json(inventory);
}

const upsertSchema = z.object({
  albumSlug: z.string(),
  stickerCode: z.string(),
  quantity: z.number().int().min(0),
  customPrice: z.number().positive().optional().nullable(),
});

// POST — adiciona/atualiza item no estoque
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = upsertSchema.parse(body);

    // Guard: limite de figurinhas por plano
    if (data.quantity > 0) {
      const stickerCheck = await checkStickerLimit(seller.id, seller.plan);
      if (!stickerCheck.allowed) {
        return NextResponse.json(
          { error: "plan_limit", message: `Limite de ${stickerCheck.max} figurinhas atingido`, upgrade_url: "/painel/planos" },
          { status: 403 }
        );
      }

      const albumCheck = await checkAlbumLimit(seller.id, seller.plan, data.albumSlug);
      if (!albumCheck.allowed) {
        return NextResponse.json(
          { error: "plan_limit", message: `Limite de álbuns atingido no plano atual`, upgrade_url: "/painel/planos" },
          { status: 403 }
        );
      }
    }

    const item = await db.inventory.upsert({
      where: {
        sellerId_albumSlug_stickerCode: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          stickerCode: data.stickerCode,
        },
      },
      update: {
        quantity: data.quantity,
        customPrice: data.customPrice ?? null,
      },
      create: {
        sellerId: seller.id,
        albumSlug: data.albumSlug,
        stickerCode: data.stickerCode,
        quantity: data.quantity,
        customPrice: data.customPrice ?? null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
