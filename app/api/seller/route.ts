import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  return NextResponse.json({
    id: seller.id,
    name: seller.name,
    email: seller.email,
    shopName: seller.shopName,
    shopSlug: seller.shopSlug,
    phone: seller.phone,
    shopDescription: seller.shopDescription,
    businessHours: seller.businessHours,
    paymentMethods: seller.paymentMethods,
    plan: seller.plan,
    onboardingStep: seller.onboardingStep,
    createdAt: seller.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const seller = await getSession();
  if (!seller) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { shopName, phone, onboardingStep, shopDescription, businessHours, paymentMethods } = body;

  const data: Record<string, string | number | null> = {};
  if (shopName && typeof shopName === "string" && shopName.trim()) {
    data.shopName = shopName.trim();
  }
  if (typeof phone === "string") {
    data.phone = phone.trim() || null;
  }
  if (typeof onboardingStep === "number" && onboardingStep >= 0 && onboardingStep <= 5) {
    data.onboardingStep = onboardingStep;
  }
  if (typeof shopDescription === "string") {
    data.shopDescription = shopDescription.trim().slice(0, 200) || null;
  }
  if (typeof businessHours === "string") {
    data.businessHours = businessHours.trim() || null;
  }
  if (typeof paymentMethods === "string") {
    data.paymentMethods = paymentMethods.trim() || null;
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
    onboardingStep: updated.onboardingStep,
  });
}
