import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const bulkSchema = z.object({
  albumSlug: z.string(),
  items: z.array(
    z.object({
      stickerCode: z.string(),
      quantity: z.number().int().min(0),
    })
  ),
});

// POST — atualiza estoque em massa (marcar várias figurinhas de uma vez)
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bulkSchema.parse(body);

    // Upsert em batch usando transaction
    const results = await db.$transaction(
      data.items.map((item) =>
        db.inventory.upsert({
          where: {
            sellerId_albumSlug_stickerCode: {
              sellerId: seller.id,
              albumSlug: data.albumSlug,
              stickerCode: item.stickerCode,
            },
          },
          update: { quantity: item.quantity },
          create: {
            sellerId: seller.id,
            albumSlug: data.albumSlug,
            stickerCode: item.stickerCode,
            quantity: item.quantity,
          },
        })
      )
    );

    return NextResponse.json({ updated: results.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
