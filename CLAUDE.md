@AGENTS.md

# FigurinhasPro

Repo: `github.com/alexmendes92/figurinhaspro` (privado) | Branch: `master`

## Stack e arquitetura
Versoes, breaking changes (Next 16, Prisma 7, Tailwind 4, Zod 4, React 19) e detalhe de camadas (DB Neon, iron-session, Stripe, Sentry, Admin) → ver `AGENTS.md` (importado no topo deste arquivo). Estrutura canonica: `src/app/`, `src/lib/`, `src/components/`, `src/generated/prisma/`.

## Producao
- **Vercel project:** `album-digital`
- **URL**: https://album-digital-ashen.vercel.app
- **Env vars criticas em prod**: `DATABASE_URL` (Neon), `SESSION_PASSWORD` (iron-session), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_EMAIL`. Schema validado em `src/lib/env.ts` (strict em prod, fallbacks em dev).
- **Planos**: FREE / PRO / UNLIMITED — gates em `src/lib/plan-limits.ts` (temporariamente liberados — TODO restaurar).

## REGRAS XP (enforced por hooks)

- **Planejamento obrigatorio**: features novas passam por `/plan` antes de codar
- **Gate completo antes de commitar**: hook pre-commit roda `npm run test` + `npx tsc --noEmit` + `npm run build` automaticamente. Bloqueia commit se qualquer um falhar.
- **Commit atomico**: 1 commit = 1 unidade funcional que builda
- **Ciclo**: `/plan` → `/develop` → `/review`

## HOOKS AUTOMATIZADOS

Configurados em `.claude/settings.json`:
- **Pre-commit gate** (na ordem): `npm run test` → `npx tsc --noEmit` → `npm run build`. Qualquer falha bloqueia o commit. Confiar no hook substitui a tentação de pular `npm run test` "porque o build passou".
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
| `src/lib/cart-context.tsx` | Contexto do carrinho (client) |
| `src/lib/admin.ts` | Guard admin via `ADMIN_EMAIL` env var (trim + case-insensitive) |
| `src/lib/env.ts` | Validacao de env vars com Zod (fallbacks em dev, strict em prod) |
| `src/lib/seller-catalog.ts` | Catalogo do vendedor |
| `src/generated/prisma/` | Prisma Client gerado (gitignored) |
| `prisma.config.ts` | Config centralizada do Prisma 7 |
| `prisma/schema.prisma` | Schema do banco — 18 modelos (catalogo, pedidos, precos, cockpit comercial). Lista detalhada em `AGENTS.md` "Schema Prisma (modelos)". Generator `prisma-client` novo. |
| `src/app/painel/comercial/actions.ts` | Server Actions centralizadas do cockpit comercial (15 actions) |
| `src/app/api/comercial/seed/route.ts` | Seed idempotente — popula dados iniciais do cockpit |
| `docs/INDEX.md` | Indice das docs vivas do projeto (PLANO_SAAS_V2, DOCUMENTACAO_NEGOCIO_MONETIZACAO, UX_AUDIT_REPORT, etc) — consultar antes de afirmar "nao ha doc". |

## Cockpit Comercial (`/painel/comercial`)

Modulo admin-only (gate via `ADMIN_EMAIL` env var em producao). Rotas, sub-modulos e componentes detalhados em `AGENTS.md` "Cockpit Comercial — rotas".

## Sincronizacao global
Alteracao estrutural (porta, stack, deploy, servico compartilhado) → atualizar CLAUDE.md da raiz Arena Cards + propagar downstream. Ver `../.claude/rules/sync-global.md` na raiz Arena Cards.

## Testing + Spec Evolution (ADR 0005)

Padrao obrigatorio: `RED (teste) → GREEN (codigo) → REFACTOR → UPDATE SPEC → COMMIT`.

- Vitest `environment: "node"` (Prisma + Stripe — nao browser).
- `setupFiles: ["./src/__tests__/setup.ts"]` — mocks globais de Prisma (18 modelos) + Stripe.
- Hook pre-commit roda `npm run test` antes de `tsc --noEmit` + `next build`. Falha bloqueia commit.
- Review gate de PR: build/testes verdes **e** spec atualizado (CLAUDE.md, ADR, ou comentario `// @spec:`).

Status volatil do rollout (cobertura por layer, piloto P3, etc.) → [`docs/testing-rollout.md`](docs/testing-rollout.md). Guia mestre do workspace: [`docs/workspace/08-testing-strategy.md`](docs/workspace/08-testing-strategy.md). ADR: [`docs/workspace/adr/0005-tdd-spec-evolution.md`](docs/workspace/adr/0005-tdd-spec-evolution.md).
