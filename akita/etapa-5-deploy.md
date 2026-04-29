> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28

# Etapa 5 — Deploy e Pós-Deploy (DRAFT)

## Categoria

**W** (Web app)

## Deploy proposto

### Ramo W (Web) — manter Vercel

| Item | Estado atual | Decisão |
|---|---|---|
| Host | Vercel projeto `album-digital` | Manter |
| URL | `album-digital-ashen.vercel.app` | Manter (domínio custom postergado) |
| Auto-deploy | **Desativado** | Manter desativado — deploy manual via `vercel deploy --prod` é regra do projeto |
| DNS/CDN | Vercel built-in | Manter |
| TLS | Vercel auto | Manter |
| DB | Neon Postgres (us-east) | Manter — pooling WebSocket via `@prisma/adapter-neon` |
| Migrations | `npx prisma db push` (manual antes do deploy) | Manter — schema mudou? roda push antes |
| Webhook Stripe | URL: `https://album-digital-ashen.vercel.app/api/stripe/webhook` | Manter — secret em `STRIPE_WEBHOOK_SECRET` |
| Observabilidade | Sentry (`@sentry/nextjs` 10.49) + Vercel Analytics + Speed Insights | Manter |
| Análise extra | Vercel Web Vitals já coleta automaticamente | Adicionar Umami custom events pós-v0 |

> **Não-aplicável:** Ramo C (CLI) e Ramo P (Port). Não é CLI, não é port — é re-arquitetura técnica/de escopo dentro da mesma stack/host.

## Comando canônico de deploy

```bash
# A partir de C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
git add <arquivos-específicos>
git commit -m "tipo(escopo): descricao"   # hook roda test → tsc → build
git push
npx vercel deploy --prod                  # deploy obrigatório (regra inviolável)
```

Se schema Prisma mudou:
```bash
npx prisma db push   # ANTES do vercel deploy --prod
```

## Métricas obrigatórias (Sentry + Vercel Analytics + Web Vitals)

Já coletadas automaticamente pelo stack atual:

| Métrica | Fonte | Alerta? |
|---|---|---|
| Erros runtime client | Sentry | Sim — Sentry email |
| Erros runtime server (route handlers) | Sentry | Sim |
| LCP / INP / CLS | Vercel Speed Insights | Threshold default |
| Page views | Vercel Analytics | Dashboard semanal |
| Unique visitors | Vercel Analytics | Dashboard semanal |
| Stripe webhook delivery | Stripe Dashboard | Sim — alerta Stripe se fail rate > 5% |

Métricas faltantes (adicionar pós-v0):
- **Funil de signup → primeiro pedido → upgrade FREE→PRO** (custom events Umami)
- **Tempo médio de onboarding** (timestamp `Seller.createdAt` → primeiro `Inventory.createdAt`)
- **MRR** (somatório de `Seller` com `stripeCurrentPeriodEnd > now` × preço do `stripePriceId`) — pode ser script Node ou KPI manual em `BizKpiSnapshot`

## Loop pós-deploy

```
Bug em prod                    → /pesquisa <bug> → /plano fix → TDD red→green → /implementa → deploy
Métrica anormal (LCP↑/erro↑)   → /pesquisa diagnóstico → fix isolado → deploy
Nova feature pequena           → /plano direto → TDD → /implementa → deploy
Nova feature de domínio        → /akita-bootstrap:akita-etapa-1-escopo (sub-escopo) antes
Stack major version            → /pesquisa avaliar → ADR antes de upgradar
Schema Prisma mudou            → npx prisma db push ANTES de vercel deploy --prod
```

## Rollback strategy

- Vercel mantém histórico de deploys por commit. Rollback = promover deploy anterior pelo dashboard Vercel ou `vercel rollback <deployment-url> --yes`.
- Migration destrutiva sem reversão (`DROP COLUMN`, `DROP TABLE`) → **proibida sem confirmação humana explícita** (regra workspace global).
- Stripe webhook events idempotentes (via `SubscriptionEvent.stripeEventId @unique`) — re-processar não causa side-effects duplicados.

## Pendências de produção (já conhecidas)

- ⏳ Auto-deploy desativado por decisão (mantém)
- ⏳ Domínio custom (album-digital-ashen.vercel.app → figurinhas.pro?) postergado
- ⏳ DKIM/SPF/DMARC do remetente transactional (reset senha) — quando reset for ativado pós-v0
- ⏳ Sentry release tracking (commit SHA → release) — útil pra correlacionar erro com deploy
- ⏳ Backup periódico do Neon — verificar política Neon ou exportar dump diário

## Observability pós-v0

Quando primeira métrica de funil for instrumentada (Umami):

| Evento custom | Quando dispara | Properties |
|---|---|---|
| `signup_completed` | `api/auth/register` 200 | `plan`, `referrer` |
| `inventory_first_added` | primeira linha de `Inventory` do `Seller` | `albumSlug`, `quantity` |
| `order_created` | `api/orders` 201 status QUOTE | `totalPrice`, `itemCount` |
| `checkout_started` | `api/stripe/checkout` 200 | `targetPlan` |
| `subscription_activated` | webhook `customer.subscription.created` | `plan`, `priceId` |
| `subscription_canceled` | webhook `customer.subscription.deleted` | `plan`, `daysActive` |

---

**Plugin akita-bootstrap concluiu o ciclo (DRAFT).**
Revise os 5 artefatos e o `blueprint.md` antes de iniciar implementação.
