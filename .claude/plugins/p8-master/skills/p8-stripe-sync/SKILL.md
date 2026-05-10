---
name: p8-master:p8-stripe-sync
description: Auto-ativa quando o usuário mexe em `src/app/api/stripe/*`, `src/lib/stripe.ts`, `src/lib/plan-limits.ts`, ou pede pra "testar Stripe webhook", "validar checkout", "smoke Stripe". Roda `stripe trigger checkout.session.completed` em ambiente local, valida que webhook recebe + processa, checa portal customer + reporta discrepâncias.
argument-hint: "[evento opcional, default: checkout.session.completed]"
---

Vou testar fluxo Stripe end-to-end em P8-FigurinhasPro: $ARGUMENTS

## Pré-condições

- Stripe CLI instalado (`stripe --version`)
- Dev server rodando na porta 3009 (`npm run dev`) — sem isso, webhook não chega.
- Env vars locais: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Sequência

1. **Verificar pré-condições.** Se Stripe CLI ausente OU dev server não rodando, paro e oriento.

2. **Listen no webhook local:**
   ```bash
   stripe listen --forward-to localhost:3009/api/stripe/webhook
   ```
   Captura `Webhook signing secret: whsec_...` — registra em log temporário (NÃO commita).

3. **Trigger evento** via [scripts/stripe-smoke.ps1](../../scripts/stripe-smoke.ps1):
   ```bash
   pwsh -File .claude/plugins/p8-master/scripts/stripe-smoke.ps1 -Event checkout.session.completed
   ```

   Default: `checkout.session.completed`. Outros úteis em P8:
   - `customer.subscription.created` — assinatura PRO/UNLIMITED criada
   - `customer.subscription.deleted` — downgrade pra FREE
   - `invoice.payment_succeeded` — renovação
   - `invoice.payment_failed` — falha cobrança

4. **Validar webhook recebido** lendo log do dev server:
   - Status 200 retornado? → Stripe não retenta.
   - Status 400/500? → falha (sinaliza no relatório).
   - Body parseado corretamente? → checa via `stripe.webhooks.constructEvent`.

5. **Checa side effects:**
   - Order foi atualizada para `PAID`?
   - SubscriptionEvent foi gravada?
   - Email transacional disparou? (gap conhecido — Resend não implementado)
   - Plan limits ativados? (gap conhecido — `plan-limits.ts` retorna `true`)

6. **Reporta discrepâncias** em formato:

```markdown
## Stripe Sync Smoke — <currentDate>

**Evento:** checkout.session.completed
**Status webhook:** 200 OK (esperado) | 400/500 (FALHA)

### Side effects observados
- [x] Order ID 123 atualizada de `CONFIRMED` → `PAID`
- [x] SubscriptionEvent gravada (id: ...)

### Side effects esperados mas faltando
- [ ] Email transacional não disparou (gap: Resend não implementado)
- [ ] Plan limits não foram aplicados (gap: gates desabilitados em plan-limits.ts)

### Discrepâncias
1. ...

### Recomendações
- Restaurar `checkStickerLimit` em `src/lib/plan-limits.ts` (TODO conhecido)
```

7. **NÃO modifico código.** Só reporto.

## Restrições

- **Nunca expõe webhook secret no relatório.** `whsec_...` é mascarado como `whsec_***`.
- **Nunca cria customer/subscription real em prod.** Smoke é só local (Stripe CLI no modo `listen` + `trigger`).
- **Nunca commita log do webhook.** Cache em `state/stripe-smoke-<data>.log` (gitignored).
- **Para `--prod` testes:** EXIGE `--force` E confirmação dupla. Default é `--mode local`.

## Modelo recomendado

- **Main session: Sonnet** — orquestra Stripe CLI + parse log + relatório.
- **Sub-agent (raro):** se for diagnosticar erro complexo, `revisor` (Sonnet) lê código webhook.

## Quando usar

- Antes de PR que toca Stripe (regressão).
- Após upgrade Stripe SDK (versão major).
- Após mudança em `src/app/api/stripe/webhook/route.ts`.
- Smoke em prod (com `--prod --force`) antes de release crítico.

## Ver também

- [scripts/stripe-smoke.ps1](../../scripts/stripe-smoke.ps1)
- [references/stripe-flows.md](../../references/stripe-flows.md)
- [P8-FigurinhasPro/src/app/api/stripe/webhook/route.ts](../../../../src/app/api/stripe/webhook/route.ts)
- [P8-FigurinhasPro/src/lib/stripe.ts](../../../../src/lib/stripe.ts)
