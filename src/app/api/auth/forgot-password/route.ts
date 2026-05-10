import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

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

    // TODO: Implementar envio de email real com Resend/SendGrid
    // Atualmente apenas gera token e loga em console
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://album-digital-ashen.vercel.app"}/reset-senha?token=${token}`;
    console.log(`[RESET PASSWORD] ${email} → ${resetUrl}`);
    console.warn(
      "[RESET PASSWORD] Email não foi enviado. Configure RESEND_API_KEY ou SENDGRID_API_KEY para habilitar envio real."
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
