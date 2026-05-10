import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOrderLimit } from "@/lib/plan-limits";
import { createQuoteWithDecrement, InventoryNotFoundError, PriceManipulationError } from "@/lib/quote-service";

// GET — lista pedidos do revendedor
export async function GET(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  const orders = await db.order.findMany({
    where: {
      sellerId: seller.id,
      ...(status ? { status } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

const orderSchema = z.object({
  sellerSlug: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  channel: z.enum(["SYSTEM", "WHATSAPP", "MANUAL"]).default("SYSTEM"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        albumSlug: z.string(),
        stickerCode: z.string(),
        stickerName: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1),
});

// POST — cria pedido/orçamento (chamado pelo cliente na vitrine)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    // Busca revendedor pelo slug
    const seller = await db.seller.findUnique({
      where: { shopSlug: data.sellerSlug },
    });

    if (!seller) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    // Guard: limite de pedidos por plano
    const orderCheck = await checkOrderLimit(seller.id, seller.plan);
    if (!orderCheck.allowed) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message: `Limite de ${orderCheck.max} pedidos/mês atingido`,
          upgrade_url: "/painel/planos",
        },
        { status: 403 }
      );
    }

    const order = await createQuoteWithDecrement(
      seller.id,
      data.customerName,
      data.customerPhone || null,
      data.customerEmail || null,
      data.items,
      data.channel
    );

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof PriceManipulationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }
    if (error instanceof InventoryNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "Seller not found") {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
