import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { shopName, phone } = body;

  const data: Record<string, string> = {};
  if (shopName && typeof shopName === "string" && shopName.trim()) {
    data.shopName = shopName.trim();
  }
  if (typeof phone === "string") {
    data.phone = phone.trim() || null as unknown as string;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const updated = await db.seller.update({
    where: { id: seller.id },
    data,
  });

  return NextResponse.json({
    shopName: updated.shopName,
    phone: updated.phone,
  });
}
