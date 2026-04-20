import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { albums } from "@/lib/albums";
import { getSession } from "@/lib/auth";
import { generateAlbumSlug, parseStickersInput } from "@/lib/custom-albums";
import { db } from "@/lib/db";

const createSchema = z.object({
  title: z.string().min(2).max(100),
  year: z.string().max(4).optional().default(""),
  stickersText: z.string().min(1),
});

// GET — lista álbuns customizados do revendedor
export async function GET() {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const customAlbums = await db.customAlbum.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customAlbums);
}

// POST — cria novo álbum customizado
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, year, stickersText } = parsed.data;
  const slug = generateAlbumSlug(title);

  // Verifica conflito com álbuns estáticos
  if (albums.some((a) => a.slug === slug)) {
    return NextResponse.json(
      { error: "Já existe um álbum com esse nome no sistema" },
      { status: 409 }
    );
  }

  // Verifica conflito com álbuns customizados do mesmo seller
  const existing = await db.customAlbum.findUnique({
    where: { sellerId_slug: { sellerId: seller.id, slug } },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já tem um álbum com esse nome" }, { status: 409 });
  }

  const stickers = parseStickersInput(stickersText);
  if (stickers.length === 0) {
    return NextResponse.json({ error: "Nenhuma figurinha válida encontrada" }, { status: 400 });
  }
  if (stickers.length > 2000) {
    return NextResponse.json({ error: "Máximo de 2000 figurinhas por álbum" }, { status: 400 });
  }

  const album = await db.customAlbum.create({
    data: {
      sellerId: seller.id,
      slug,
      title,
      year: year || "",
      stickers: JSON.stringify(stickers),
    },
  });

  return NextResponse.json(album, { status: 201 });
}
