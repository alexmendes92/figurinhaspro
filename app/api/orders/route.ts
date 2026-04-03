import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

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
  items: z.array(
    z.object({
      albumSlug: z.string(),
      stickerCode: z.string(),
      stickerName: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
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

    const totalPrice = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const order = await db.order.create({
      data: {
        sellerId: seller.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        channel: data.channel,
        notes: data.notes || null,
        totalPrice,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
