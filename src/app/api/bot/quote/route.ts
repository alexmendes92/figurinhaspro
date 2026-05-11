// src/app/api/bot/quote/route.ts
// Cria Order status QUOTE a partir de pedido do bot WhatsApp.
// HMAC obrigatorio. Nao processa pagamento - Seller fecha no chat.

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyBotSignature } from "@/lib/bot-hmac";
import { db } from "@/lib/db";
import { checkOrderLimit } from "@/lib/plan-limits";
import { createQuoteWithDecrement, InventoryNotFoundError, PriceManipulationError } from "@/lib/quote-service";

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

  try {
    const order = await createQuoteWithDecrement(
      sellerRow.id,
      body.customerName,
      body.customerPhone,
      null,
      body.items,
      "WHATSAPP"
    );

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
  } catch (error) {
    if (error instanceof PriceManipulationError) {
      return NextResponse.json(
        { error: "price_manipulation", message: error.message },
        { status: 422 }
      );
    }
    if (error instanceof InventoryNotFoundError) {
      return NextResponse.json(
        { error: "inventory_error", message: error.message },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "Seller not found") {
      return NextResponse.json(
        { error: "seller_not_found", message: "Seller nao encontrado" },
        { status: 404 }
      );
    }
    throw error;
  }
}
