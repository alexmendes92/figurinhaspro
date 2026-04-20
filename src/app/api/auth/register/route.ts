import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  shopName: z.string().min(2),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Gera slug a partir do nome da loja
    const shopSlug = data.shopName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Verifica se email ou slug já existe
    const existing = await db.seller.findFirst({
      where: { OR: [{ email: data.email }, { shopSlug }] },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: existing.email === data.email ? "Email já cadastrado" : "Nome de loja já em uso",
        },
        { status: 400 }
      );
    }

    // Hash da senha com bcrypt (custo 12)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const seller = await db.seller.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        shopName: data.shopName,
        shopSlug,
        phone: data.phone || null,
      },
    });

    // Cria regras de preço padrão
    await db.priceRule.createMany({
      data: [
        { sellerId: seller.id, stickerType: "regular", price: 2.5 },
        { sellerId: seller.id, stickerType: "foil", price: 5.0 },
        { sellerId: seller.id, stickerType: "shiny", price: 4.0 },
      ],
    });

    await createSession(seller.id);

    return NextResponse.json({
      id: seller.id,
      name: seller.name,
      shopSlug: seller.shopSlug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erro interno", detail: String(error) }, { status: 500 });
  }
}
