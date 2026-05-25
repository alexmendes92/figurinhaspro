import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAlbumLimit, checkStickerLimit } from "@/lib/plan-limits";

const importSchema = z.object({
  albumSlug: z.string(),
  items: z.array(
    z.object({
      stickerCode: z.string(),
      quantity: z.number().int().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = importSchema.parse(body);

    if (data.items.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Check Plan Limits
    const stickerCheck = await checkStickerLimit(seller.id, seller.plan);
    if (!stickerCheck.allowed) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message: `Limite de ${stickerCheck.max} figurinhas atingido`,
          upgrade_url: "/painel/planos",
        },
        { status: 403 }
      );
    }

    const albumCheck = await checkAlbumLimit(seller.id, seller.plan, data.albumSlug);
    if (!albumCheck.allowed) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message: "Limite de álbuns atingido no plano atual",
          upgrade_url: "/painel/planos",
        },
        { status: 403 }
      );
    }

    // Dividir os itens em lotes (chunks) de 50 para evitar sobrecarga no banco de dados e erros de timeout
    const BATCH_SIZE = 50;
    let totalUpdated = 0;

    for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
      const batch = data.items.slice(i, i + BATCH_SIZE);
      
      const results = await db.$transaction(
        batch.map((item) =>
          db.inventory.upsert({
            where: {
              sellerId_albumSlug_stickerCode: {
                 sellerId: seller.id,
                 albumSlug: data.albumSlug,
                 stickerCode: item.stickerCode,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              sellerId: seller.id,
              albumSlug: data.albumSlug,
              stickerCode: item.stickerCode,
              quantity: item.quantity,
            },
          })
        )
      );
      
      totalUpdated += results.length;
    }

    return NextResponse.json({ updated: totalUpdated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
