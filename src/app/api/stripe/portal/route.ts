import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const seller = await getSession();
  if (!seller) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!seller.stripeCustomerId) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3009";

  const session = await getStripe().billingPortal.sessions.create({
    customer: seller.stripeCustomerId,
    return_url: `${appUrl}/painel`,
  });

  return NextResponse.json({ url: session.url });
}
