import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
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
