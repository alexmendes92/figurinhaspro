import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const seller = await db.seller.findUnique({
      where: { email: data.email },
    });

    if (!seller) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
    }

    // Compara senha com hash bcrypt
    // Suporte a migração: se senha não é hash bcrypt, compara diretamente e rehasheia
    let passwordValid = false;
    if (seller.password.startsWith("$2")) {
      passwordValid = await bcrypt.compare(data.password, seller.password);
    } else {
      // Senha legada em texto puro — migrar para bcrypt no primeiro login
      passwordValid = seller.password === data.password;
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        await db.seller.update({
          where: { id: seller.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
    }

    await createSession(seller.id);

    return NextResponse.json({
      id: seller.id,
      name: seller.name,
      shopSlug: seller.shopSlug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Erro interno", detail: String(error) }, { status: 500 });
  }
}
