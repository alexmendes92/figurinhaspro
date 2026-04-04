import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes } from "crypto";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const seller = await db.seller.findUnique({ where: { email } });

    // Sempre retorna sucesso (não revela se email existe)
    if (!seller) {
      return NextResponse.json({ ok: true });
    }

    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.seller.update({
      where: { id: seller.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // Em produção, enviar email com link. Por ora, logar no console.
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://album-digital-ashen.vercel.app"}/reset-senha?token=${token}`;
    console.log(`[RESET PASSWORD] ${email} → ${resetUrl}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
