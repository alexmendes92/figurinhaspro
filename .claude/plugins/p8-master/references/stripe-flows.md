# Stripe Flows — referência P8-FigurinhasPro

> Fluxos de pagamento implementados em P8 via Stripe SDK 22. Consultar antes de mexer em `src/app/api/stripe/*` ou `src/lib/stripe.ts`.

---

## Visão geral

P8 usa Stripe para 3 fluxos:
1. **Checkout** — cliente paga pedido (one-shot, modo `payment`)
2. **Subscription** — vendedor assina plano FREE/PRO/UNLIMITED (modo `subscription`)
3. **Customer Portal** — vendedor gerencia plano (atualiza payment method, cancela)

---

## Cliente paga pedido (Order)

```
Cliente clica "Comprar" em /loja/[slug]/[albumSlug]
   ↓
POST /api/stripe/create-checkout
   - Cria Order com status: QUOTE no DB
   - stripe.checkout.sessions.create({
       mode: 'payment',
       line_items: [...]
       metadata: { orderId }
     })
   - Retorna URL de Stripe Checkout
   ↓
Cliente é redirecionado pra checkout.stripe.com
   ↓
Cliente completa pagamento
   ↓
Stripe envia webhook → POST /api/stripe/webhook
   - Event: checkout.session.completed
   - Validação: stripe.webhooks.constructEvent(body, sig, secret)
   - Atualiza Order para status: PAID
   - Cria SubscriptionEvent log
   - (futuro) Dispara email Resend de confirmação
   ↓
Cliente é redirecionado pra success_url
```

Arquivos:
- `src/app/api/stripe/create-checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/stripe.ts`
- Schema: `Order` + `OrderItem` + `SubscriptionEvent`

**Gaps:**
- ❌ Sem idempotência (Stripe retry → Order pode duplicar)
- ❌ Email pós-pagamento não implementado
- ⚠️ Plan limits desabilitados (não bloqueia FREE de criar Order)

---

## Vendedor assina plano

```
Vendedor clica "Upgrade pra PRO" em /painel/planos
   ↓
POST /api/stripe/create-subscription
   - Verifica Seller.stripeCustomerId (cria via stripe.customers.create se não existe)
   - stripe.checkout.sessions.create({
       mode: 'subscription',
       customer: stripeCustomerId,
       line_items: [{ price: PRICE_ID_PRO, quantity: 1 }],
       metadata: { sellerId }
     })
   ↓
Vendedor completa em checkout.stripe.com
   ↓
Webhook customer.subscription.created
   - Atualiza Seller.plan = 'PRO'
   - Atualiza Seller.stripeSubscriptionId
   - Cria SubscriptionEvent
   ↓
Webhook invoice.paid (recorrente, mensal)
   - Confirma Seller.plan continua ativo
   - Renova trial/grace period
```

**Gaps:**
- Plan limits TODO restaurar (gates atualmente true)
- Trial/grace period não implementado

---

## Customer Portal

```
Vendedor clica "Gerenciar assinatura" em /painel/planos
   ↓
POST /api/stripe/customer-portal
   - stripe.billingPortal.sessions.create({
       customer: seller.stripeCustomerId,
       return_url: '/painel/planos'
     })
   ↓
Vendedor é redirecionado pra portal.stripe.com
   - Atualiza payment method
   - Cancela subscription (Stripe trata grace period)
   - Vê histórico
   ↓
Vendedor é redirecionado de volta
   ↓
Webhook customer.subscription.updated ou .deleted
   - Atualiza Seller.plan accordingly
```

---

## Webhook event types tratados

Em `src/app/api/stripe/webhook/route.ts`:

| Event | Ação |
|---|---|
| `checkout.session.completed` (mode payment) | Order → PAID |
| `checkout.session.completed` (mode subscription) | Seller.plan inicial |
| `invoice.paid` | Confirma plano ativo |
| `invoice.payment_failed` | Marca grace period (futuro) |
| `customer.subscription.updated` | Seller.plan refletindo nova subscription |
| `customer.subscription.deleted` | Seller.plan = FREE (após grace period) |

Eventos não tratados (silenciados com 200): tudo o resto.

---

## Validação de signature (CRÍTICO)

```ts
// src/app/api/stripe/webhook/route.ts
import { headers } from "next/headers"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()  // RAW body, NÃO json()
  const sig = (await headers()).get("stripe-signature")!
  const event = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET!
  )
  // ... handler
}
```

**Anti-padrões a evitar:**
- ❌ `await req.json()` antes de `constructEvent` — body modificado, signature inválida
- ❌ Reuso de `STRIPE_WEBHOOK_SECRET` entre dev/prod
- ❌ Tolerar erro de signature (deveria 400 sempre)

---

## Env vars obrigatórias

| Var | Descrição | Scope |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side (sk_live_ em prod, sk_test_ em dev) | Production + Development |
| `STRIPE_WEBHOOK_SECRET` | Validação signature (whsec_***) | Production + Development separados |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side (pk_live_ em prod, pk_test_ em dev) | Production + Development |

Validação em `src/lib/env.ts` via Zod (strict prod, fallback dev).

---

## Testes locais

```bash
# Terminal 1: dev server
npm run dev

# Terminal 2: stripe listen
stripe listen --forward-to localhost:3009/api/stripe/webhook
# Output: whsec_*** — adicionar a .env.local

# Terminal 3: trigger
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
```

Wrapper: `/p8-master:p8-stripe-sync` ou `pwsh -File scripts/stripe-smoke.ps1`.

---

## Versão da API Stripe

P8 usa Stripe SDK `^22.x`. API version implícita = última estável quando SDK foi instalado.

Para fixar versão (recomendado):
```ts
// src/lib/stripe.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-XX-XX",  // pin pra evitar surpresa em upgrade
})
```

Verificar https://stripe.com/docs/upgrades anualmente — Stripe deprecia API versions antigas após 12 meses.

---

## Dashboard Stripe

- Live: https://dashboard.stripe.com/
- Test: https://dashboard.stripe.com/test/

Logs de webhook: Developers → Events. Filtrar por `metadata.orderId` ou `metadata.sellerId` pra rastrear evento específico.

---

## Ver também

- [skills/p8-stripe-sync/SKILL.md](../skills/p8-stripe-sync/SKILL.md)
- [scripts/stripe-smoke.ps1](../scripts/stripe-smoke.ps1)
- [P8-FigurinhasPro/src/app/api/stripe/](../../../src/app/api/stripe/)
- [P8-FigurinhasPro/src/lib/stripe.ts](../../../src/lib/stripe.ts)
