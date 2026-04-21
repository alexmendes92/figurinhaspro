// src/app/api/bot/quote/[ref]/route.ts
// Consulta de QUOTE criada pelo bot. Sem HMAC.
// Apenas orders com channel=WHATSAPP sao expostas.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;

  const order = await db.order.findFirst({
    where: { id: ref, channel: "WHATSAPP" },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.id.slice(-8).toUpperCase(),
    status: order.status,
    totalPrice: order.totalPrice,
    customerName: order.customerName,
    items: order.items.map((i) => ({
      albumSlug: i.albumSlug,
      stickerCode: i.stickerCode,
      stickerName: i.stickerName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
}
