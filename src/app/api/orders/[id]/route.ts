import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH — atualiza status do pedido
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const order = await db.order.findFirst({
    where: { id, sellerId: seller.id },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const updated = await db.order.update({
    where: { id },
    data: { status: body.status },
    include: { items: true },
  });

  return NextResponse.json(updated);
}
