import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const sectionRuleSchema = z.object({
  albumSlug: z.string().min(1),
  sectionName: z.string().min(1),
  adjustType: z.enum(["FLAT", "OFFSET"]),
  value: z.number(),
});

// POST — cria/atualiza regra de preço por seção
export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = sectionRuleSchema.parse(body);

    // Validação: FLAT precisa ser positivo, OFFSET pode ser negativo
    if (data.adjustType === "FLAT" && data.value <= 0) {
      return NextResponse.json({ error: "Preço fixo deve ser maior que zero" }, { status: 400 });
    }

    const rule = await db.sectionPriceRule.upsert({
      where: {
        sellerId_albumSlug_sectionName: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          sectionName: data.sectionName,
        },
      },
      update: { adjustType: data.adjustType, value: data.value },
      create: {
        sellerId: seller.id,
        albumSlug: data.albumSlug,
        sectionName: data.sectionName,
        adjustType: data.adjustType,
        value: data.value,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

const deleteSchema = z.object({
  albumSlug: z.string().min(1),
  sectionName: z.string().min(1),
});

// DELETE — remove regra de preço por seção
export async function DELETE(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const data = deleteSchema.parse(body);

    await db.sectionPriceRule.delete({
      where: {
        sellerId_albumSlug_sectionName: {
          sellerId: seller.id,
          albumSlug: data.albumSlug,
          sectionName: data.sectionName,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  }
}
