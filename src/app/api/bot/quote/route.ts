// src/app/api/bot/quote/route.ts
// Cria Order status QUOTE a partir de pedido do bot WhatsApp.
// HMAC obrigatorio. Nao processa pagamento - Seller fecha no chat.

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyBotSignature } from "@/lib/bot-hmac";
import { db } from "@/lib/db";
import { checkOrderLimit } from "@/lib/plan-limits";

export const dynamic = "force-dynamic";

const quoteSchema = z.object({
  sellerSlug: z.string().min(1),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(5).max(32),
  items: z
    .array(
      z.object({
        albumSlug: z.string().min(1),
        stickerCode: z.string().min(1),
        stickerName: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-bot-signature");

  const hmac = verifyBotSignature(sig, rawBody);
  if (!hmac.ok) {
    return NextResponse.json(
      { error: `hmac_${hmac.reason}` },
      { status: hmac.reason === "missing-secret" ? 503 : 401 },
    );
  }

  let body: z.infer<typeof quoteSchema>;
  try {
    body = quoteSchema.parse(JSON.parse(rawBody));
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details: err instanceof z.ZodError ? err.issues : String(err),
      },
      { status: 400 },
    );
  }

  const sellerRow = await db.seller.findUnique({
    where: { shopSlug: body.sellerSlug },
  });
  if (!sellerRow) {
    return NextResponse.json(
      { error: "seller_not_found", message: `Seller '${body.sellerSlug}' nao existe` },
      { status: 404 },
    );
  }

  const limit = await checkOrderLimit(sellerRow.id, sellerRow.plan);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "plan_limit", message: `Limite de ${limit.max} pedidos/mes atingido` },
      { status: 403 },
    );
  }

  const totalPrice = body.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const order = await db.order.create({
    data: {
      sellerId: sellerRow.id,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      channel: "WHATSAPP",
      notes: "Pedido criado pelo bot WhatsApp",
      totalPrice,
      items: {
        create: body.items.map((i) => ({
          albumSlug: i.albumSlug,
          stickerCode: i.stickerCode,
          stickerName: i.stickerName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.id.slice(-8).toUpperCase(),
    status: order.status,
    totalPrice: order.totalPrice,
    items: order.items.map((i) => ({
      albumSlug: i.albumSlug,
      stickerCode: i.stickerCode,
      stickerName: i.stickerName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    createdAt: order.createdAt.toISOString(),
  });
}
