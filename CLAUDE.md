@AGENTS.md

# FigurinhasPro

Repo: `github.com/alexmendes92/figurinhaspro` (privado) | Branch: `master`

## Stack
Next.js 16.2.4 + React 19.2 + Prisma 7.7 (generator `prisma-client` novo) + Neon Postgres + Tailwind 4 + Zod 4.3 + React Compiler + iron-session + bcryptjs + Stripe + Sentry + Vercel Analytics + Biome (lint/format)

Estrutura canonica: `src/app/`, `src/lib/`, `src/components/`, `src/generated/prisma/` (migrado em 2026-04-20, Fase 2).

## Producao
- **Vercel project:** `album-digital`
- **URL**: https://album-digital-ashen.vercel.app
- **DB**: Neon Postgres (PrismaNeon WebSocket Pool + Lazy Proxy em `src/lib/db.ts`)
- **Auth**: iron-session (cookies criptografados) + bcryptjs (hash de senhas)
- **Pagamentos**: Stripe SDK (checkout, webhook, portal) — endpoints em `src/app/api/stripe/*`
- **Planos**: FREE / PRO / UNLIMITED — gates em `src/lib/plan-limits.ts` (temporariamente liberados)
- **Monitoring**: Sentry (`@sentry/nextjs`) + Vercel Analytics + Speed Insights
- **Env validation**: Zod schema em `src/lib/env.ts` (valida rigorosamente em producao)
- **Admin**: `src/lib/admin.ts` — guard via `ADMIN_EMAIL` env var (cockpit comercial)

## REGRAS XP (enforced por hooks)

- **Planejamento obrigatorio**: features novas passam por `/plan` antes de codar
- **Build antes de commitar**: hook pre-commit roda `npm run build` automaticamente
- **Commit atomico**: 1 commit = 1 unidade funcional que builda
- **Ciclo**: `/plan` → `/develop` → `/review`

## HOOKS AUTOMATIZADOS

Configurados em `.claude/settings.json`:
- **Pre-commit**: roda `npm run build` antes de cada `git commit`
- **Seguranca**: bloqueia `git add` de `.env`, `dev.db`, credentials
- **Destrutivos**: bloqueia `rm -rf`, `drop table`, `git push --force`

## Deploy (OBRIGATORIO — NUNCA PULAR)

Apos CADA alteracao que builda com sucesso, executar os 3 passos:
```bash
git add <arquivos> && git commit -m "tipo(escopo): descricao"
git push
npx vercel deploy --prod
```

**Regras inviolaveis:**
- **NUNCA** terminar uma tarefa sem fazer deploy em producao
- **NUNCA** perguntar "quer que eu faca deploy?" — SEMPRE fazer automaticamente
- **NUNCA** acumular multiplos commits sem deploy — deployar apos cada commit
- O deploy faz parte da tarefa. Tarefa sem deploy = tarefa incompleta
- Se `vercel deploy --prod` falhar, investigar e resolver antes de declarar concluido
- Se o schema Prisma mudou, rodar `npx prisma db push` antes do deploy

## Comandos
```bash
npm run dev        # Dev server (Turbopack, porta 3009)
npm run build      # Build producao (prisma generate && next build)
npm run lint       # Biome check
npm run lint:fix   # Biome check --write
npm run format     # Biome format --write
vercel deploy --prod  # Deploy producao (obrigatorio apos push)

# Stripe CLI (testar webhooks localmente)
stripe listen --forward-to localhost:3009/api/stripe/webhook
stripe trigger checkout.session.completed
stripe logs tail
```

## Arquivos-chave

| Arquivo | Funcao |
|---------|--------|
| `src/lib/db.ts` | Conexao Prisma/Neon (Lazy Proxy — evita conexao durante build) |
| `src/lib/auth.ts` | Sessao iron-session + lookup do seller |
| `src/lib/plan-limits.ts` | Limites por plano + guards (`checkStickerLimit`, `hasFeature`) |
| `src/lib/sticker-types.ts` | Config centralizada de tipos (Regular/Especial/Brilhante) |
| `src/lib/stripe.ts` | Cliente Stripe |
| `src/lib/custom-albums.ts` | Conversao CustomAlbum→Album, parser de stickers, gerador de slug |
| `src/lib/price-resolver.ts` | Resolucao centralizada de precos (3 eixos) + mapa sticker→secao |
| `src/lib/price-summary.ts` | Resumo de overrides por album (chip "padrao" vs "N personalizacoes") |
| `src/lib/cart-context.tsx` | Contexto do carrinho (client) |
| `src/lib/admin.ts` | Guard admin via `ADMIN_EMAIL` env var (trim + case-insensitive) |
| `src/lib/env.ts` | Validacao de env vars com Zod (fallbacks em dev, strict em prod) |
| `src/lib/seller-catalog.ts` | Catalogo do vendedor |
| `src/generated/prisma/` | Prisma Client gerado (gitignored) |
| `prisma.config.ts` | Config centralizada do Prisma 7 |
| `prisma/schema.prisma` | Schema: Seller, Inventory, Order, PriceRule, SectionPriceRule, QuantityTier, CustomAlbum, SubscriptionEvent + 9 modelos Biz*. Generator `prisma-client` novo |
| `src/app/painel/comercial/actions.ts` | Server Actions centralizadas do cockpit comercial (15 actions) |
| `src/app/api/comercial/seed/route.ts` | Seed idempotente — popula dados iniciais do cockpit |

## Cockpit Comercial (`/painel/comercial`)

Modulo admin-only (visivel apenas para `ADMIN_EMAIL`). Cockpit de operacao comercial com 7 sub-modulos:

| Rota | Modulo | Descricao |
|------|--------|-----------|
| `/painel/comercial` | Dashboard | Metricas de produto, pipeline, tarefas urgentes, resumo geral |
| `/painel/comercial/leads` | CRM | Pipeline de leads (PROSPECT→WON/LOST), filtro por estagio |
| `/painel/comercial/leads/[id]` | Lead Detail | Detalhe do lead, atividades, historico, stage buttons |
| `/painel/comercial/ofertas` | Ofertas | Grid de ofertas ativas/pausadas, receita, vendas |
| `/painel/comercial/experimentos` | Experimentos | Hipoteses de growth, status flow, resultados |
| `/painel/comercial/iniciativas` | Iniciativas | Kanban 4 colunas (BACKLOG→DONE), milestones |
| `/painel/comercial/tarefas` | Tarefas | Checklist com filtro, vinculo a lead/iniciativa/experimento |
| `/painel/comercial/kpis` | KPIs | Metricas com historico, delta, target, mini-graficos |

**Padrao de formularios**: `?new=1` no searchParam mostra form de criacao (Server Component, sem estado client).

**Componentes**: `src/components/painel/comercial/comercial-tabs.tsx` (navegacao), `seed-button.tsx` (popular dados).

**Env var obrigatoria em producao**: `ADMIN_EMAIL` (configurada no Vercel).

## Sincronizacao global
Alteracao estrutural (porta, stack, deploy, servico compartilhado) → atualizar CLAUDE.md da raiz Arena Cards + propagar downstream. Ver `../.claude/rules/sync-global.md` na raiz Arena Cards.

## Testing + Spec Evolution (ADR 0005) — Fase 5c Rollout

**Padrão obrigatório (copy-sync de P3 piloto):**

```
RED (teste) → GREEN (código) → REFACTOR → UPDATE SPEC → COMMIT
```

### Setup Vitest

- `environment: "node"` (Prisma + Stripe, não browser)
- `setupFiles: ["./src/__tests__/setup.ts"]` (Prisma + Stripe mocks globais) ✅ Criado
- `npm run test` bloqueia commit (hook pré-commit) — TBD

### Mocks Globais (src/__tests__/setup.ts)

- **Prisma**: 18 modelos (Seller, Order, PriceRule, BizLead, etc.)
- **Stripe**: checkout.sessions, customers, products, prices
- **beforeEach()**: limpa todos os mocks (isola testes)

### Layer Padrão (herdado de P3)

| Layer | Padrão | Arquivo | Status |
|-------|--------|---------|--------|
| **Utils** | Puro funcional, 100% coverage | `lib/*.test.ts` | 🟡 Próximo |
| **Services** | Integration + Prisma mock, 80%+ | `lib/services/*.test.ts` | 🟡 Próximo |
| **API routes** | Zod validation + handler, 90%+ | `app/api/*/route.test.ts` | 🟡 Fila |
| **Plan limits** | Guard functions, 80%+ | `lib/plan-limits.test.ts` | 🟡 Fila |
| **Components** | React Testing Library, 80%+ | `components/*.test.tsx` | 🟡 Fila |

### Review Gate (PR)

- [ ] Build + testes passam (CI)
- [ ] **Spec foi atualizado?** (CLAUDE.md/ADR/comentário inline)

### Referência

- **ADR 0005**: `docs/workspace/adr/0005-tdd-spec-evolution.md`
- **Guia testing**: `docs/workspace/08-testing-strategy.md`
- **Piloto P3**: commit `bb86878` — 37 testes (26+5+6), ciclo completo
