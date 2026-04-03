import Stripe from "stripe";

// Lazy init — evita crash na build quando STRIPE_SECRET_KEY não existe
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  FREE: {
    name: "Starter",
    price: 0,
    stripePriceId: null as string | null,
  },
  PRO: {
    name: "Pro",
    price: 2900, // centavos
    stripePriceId: process.env.STRIPE_PRICE_PRO || null,
  },
  UNLIMITED: {
    name: "Ilimitado",
    price: 5900, // centavos
    stripePriceId: process.env.STRIPE_PRICE_UNLIMITED || null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
