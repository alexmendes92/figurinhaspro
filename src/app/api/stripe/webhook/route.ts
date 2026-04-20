import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Helper para extrair dados de subscription de forma type-safe
async function getSubscriptionData(subscriptionId: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const item = sub.items?.data?.[0];
  return {
    id: sub.id,
    metadata: sub.metadata,
    priceId: item?.price?.id,
    // Na API basil, period_end fica no item, não na subscription
    periodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Salvar evento para auditoria
  const obj = event.data.object as unknown as {
    metadata?: Record<string, string>;
  };
  const sellerId = obj.metadata?.sellerId;

  if (sellerId) {
    await db.subscriptionEvent.create({
      data: {
        sellerId,
        type: event.type,
        stripeEventId: event.id,
        data: JSON.stringify(event.data.object),
      },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata;
      if (meta?.sellerId && meta?.plan && session.subscription) {
        const sub = await getSubscriptionData(session.subscription as string);
        await db.seller.update({
          where: { id: meta.sellerId },
          data: {
            plan: meta.plan,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.priceId,
            stripeCurrentPeriodEnd: sub.periodEnd,
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // Na API basil, subscription fica em parent.subscription_details
      const subId = invoice.parent?.subscription_details?.subscription;
      if (subId) {
        const sub = await getSubscriptionData(typeof subId === "string" ? subId : subId.id);
        if (sub.metadata?.sellerId) {
          await db.seller.update({
            where: { id: sub.metadata.sellerId },
            data: { stripeCurrentPeriodEnd: sub.periodEnd },
          });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as unknown as Stripe.Subscription;
      if (subscription.metadata?.sellerId) {
        await db.seller.update({
          where: { id: subscription.metadata.sellerId },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as unknown as Stripe.Subscription;
      const updItem = subscription.items?.data?.[0];
      if (subscription.metadata?.sellerId && subscription.metadata?.plan) {
        await db.seller.update({
          where: { id: subscription.metadata.sellerId },
          data: {
            plan: subscription.metadata.plan,
            stripePriceId: updItem?.price?.id,
            stripeCurrentPeriodEnd: updItem?.current_period_end
              ? new Date(updItem.current_period_end * 1000)
              : null,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
