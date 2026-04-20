import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { albums } from "@/lib/albums";
import { z } from "zod";

const setupSchema = z.object({
  albumSlug: z.string().min(1),
});

// POST — inicializa estoque de um álbum (qty=0 para todas as figurinhas)
// Usado no onboarding para que o vendedor chegue no painel com álbum já configurado
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { albumSlug } = setupSchema.parse(body);

    const album = albums.find((a) => a.slug === albumSlug);
    if (!album) return NextResponse.json({ error: "Álbum não encontrado" }, { status: 404 });

    // Coleta todos os códigos de figurinhas do álbum
    const allStickers = album.sections.flatMap((s) => s.stickers);

    // Verifica se já existe estoque para este álbum (evita duplicar)
    const existing = await db.inventory.count({
      where: { sellerId: seller.id, albumSlug },
    });

    if (existing > 0) {
      return NextResponse.json({ setup: false, message: "Álbum já configurado", count: existing });
    }

    // Cria registros com qty=0 em batch
    await db.$transaction(
      allStickers.map((sticker) =>
        db.inventory.create({
          data: {
            sellerId: seller.id,
            albumSlug,
            stickerCode: sticker.code,
            quantity: 0,
          },
        })
      )
    );

    return NextResponse.json({ setup: true, count: allStickers.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Setup inventory error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
