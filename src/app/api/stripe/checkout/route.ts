import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe, PLANS } from "@/lib/stripe";
import type { PlanKey } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const seller = await getSession();
  if (!seller) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: string };

  if (plan !== "PRO" && plan !== "UNLIMITED") {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const planConfig = PLANS[plan as PlanKey];
  if (!planConfig.stripePriceId) {
    return NextResponse.json(
      { error: "Preço Stripe não configurado para este plano" },
      { status: 500 }
    );
  }

  // Criar ou reusar Stripe Customer
  let customerId = seller.stripeCustomerId;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: seller.email,
      name: seller.name,
      metadata: { sellerId: seller.id, shopSlug: seller.shopSlug },
    });
    customerId = customer.id;
    await db.seller.update({
      where: { id: seller.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3009";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/painel?upgrade=success`,
    cancel_url: `${appUrl}/painel?upgrade=cancelled`,
    metadata: { sellerId: seller.id, plan },
    subscription_data: {
      metadata: { sellerId: seller.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
