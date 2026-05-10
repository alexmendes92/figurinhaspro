---
data: <YYYY-MM-DD>
tipo: plano
topico: <slug-curto>
autor: <email>
projeto: P8-FigurinhasPro
relacionados: [pesquisas/<arquivo>.md]
status: rascunho
sha: <git short SHA>
branch: <branch>
iteracoes: 0
data_ultima_iteracao: null
---

# Plano: <título descritivo>

## Goal

<1 frase objetiva. Ex: "Adicionar email transacional via Resend após pagamento Stripe.">

## Pesquisa-base

- `thoughts/pesquisas/<arquivo>.md` — <resumo curto>

## Architecture

<2-3 frases. Quais camadas P8 são tocadas (`src/app/`, `src/lib/`, `src/components/`, `prisma/`)? Decisões arquiteturais? Trade-offs?>

## Files affected

### Criar
- `src/lib/email.ts` — wrapper Resend
- `src/emails/order-paid.tsx` — template HTML

### Modificar
- `src/app/api/stripe/webhook/route.ts` — chamar `sendOrderPaidEmail` após `handleCheckoutCompleted`
- `src/lib/env.ts` — adicionar `RESEND_API_KEY`

### Deletar
- (nenhum)

## Phases (cada uma verificável)

### Fase 1 — Wrapper Resend

- [ ] **RED**: escrever `src/lib/__tests__/email.test.ts` com 3 casos (sucesso, erro de API, env var ausente)
- [ ] **GREEN**: implementar `src/lib/email.ts` com `sendOrderPaidEmail()`
- [ ] **REFACTOR**: extrair `resendClient` pro topo (se aplicável)
- [ ] Gate: `npm run test` verde, `npx tsc --noEmit` verde, `npm run build` verde
- [ ] Commit: `feat(email): add Resend service wrapper`

### Fase 2 — Template

- [ ] Criar `src/emails/order-paid.tsx`
- [ ] Gate: build verde
- [ ] Commit: `feat(email): add order paid HTML template`

### Fase 3 — Integração webhook

- [ ] **RED**: teste em `webhook.test.ts` que mock Resend é chamado 1x após `checkout.session.completed`
- [ ] **GREEN**: chamar `sendOrderPaidEmail` em `handleCheckoutCompleted`
- [ ] Gate: build verde
- [ ] Commit: `feat(stripe): trigger email on order paid`

### Fase 4 — Env schema

- [ ] Adicionar `RESEND_API_KEY` em `src/lib/env.ts` (required em prod)
- [ ] **GATE HUMANO**: confirmar adição em Vercel scope Production
- [ ] Commit: `feat(env): require RESEND_API_KEY`

### Fase 5 — Deploy + smoke

- [ ] Push origin
- [ ] **GATE HUMANO**: aprovar deploy prod
- [ ] `npx vercel deploy --prod`
- [ ] Smoke: `stripe trigger checkout.session.completed` → email chegou?

## Risks

- Email pode falhar silencioso → wrapper precisa logar erro (Sentry quando ativo).
- Webhook re-trigger duplica email → idempotência por `event.id` (gap conhecido).

## Out of scope (YAGNI)

- Múltiplos providers de email (só Resend agora).
- Templates dinâmicos por vendedor (template único).
- Notificação por SMS / WhatsApp.

## Open questions

- `RESEND_API_KEY` está em qual env scope hoje?
- Email do destinatário é `order.email` ou `seller.email`?

---

## Histórico de iterações

(adicionado por `/p8-master:itera`)
