import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE — remove álbum customizado (e todo estoque associado)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const album = await db.customAlbum.findUnique({ where: { id } });
  if (!album || album.sellerId !== seller.id) {
    return NextResponse.json({ error: "Álbum não encontrado" }, { status: 404 });
  }

  // Remove estoque associado ao álbum
  await db.inventory.deleteMany({
    where: { sellerId: seller.id, albumSlug: album.slug },
  });

  await db.customAlbum.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
