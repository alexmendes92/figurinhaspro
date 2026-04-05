@AGENTS.md

# FigurinhasPro

Repo: `github.com/amendes92/figurinhaspro` (privado) | Branch: `master`

## Stack
Next.js 16.2.1 + React 19.2 + Prisma 7.5 + Neon Postgres + Tailwind 4 + Zod 4.3 + React Compiler + iron-session + bcryptjs + Stripe

## Producao
- **Vercel project:** `album-digital`
- **URL**: https://album-digital-ashen.vercel.app
- **DB**: Neon Postgres (PrismaNeon WebSocket Pool + Lazy Proxy em `lib/db.ts`)
- **Auth**: iron-session (cookies criptografados) + bcryptjs (hash de senhas)
- **Pagamentos**: Stripe SDK (checkout, webhook, portal) — endpoints em `api/stripe/*`
- **Planos**: FREE / PRO / UNLIMITED — gates em `lib/plan-limits.ts` (temporariamente liberados)

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
npm run lint       # ESLint
vercel deploy --prod  # Deploy producao (obrigatorio apos push)

# Stripe CLI (testar webhooks localmente)
stripe listen --forward-to localhost:3009/api/stripe/webhook
stripe trigger checkout.session.completed
stripe logs tail
```

## Arquivos-chave

| Arquivo | Funcao |
|---------|--------|
| `lib/db.ts` | Conexao Prisma/Neon (Lazy Proxy — evita conexao durante build) |
| `lib/auth.ts` | Sessao iron-session + lookup do seller |
| `lib/plan-limits.ts` | Limites por plano + guards (`checkStickerLimit`, `hasFeature`) |
| `lib/sticker-types.ts` | Config centralizada de tipos (Regular/Especial/Brilhante) |
| `lib/stripe.ts` | Cliente Stripe |
| `lib/custom-albums.ts` | Conversao CustomAlbum→Album, parser de stickers, gerador de slug |
| `lib/price-resolver.ts` | Resolucao centralizada de precos (3 eixos) + mapa sticker→secao |
| `lib/cart-context.tsx` | Contexto do carrinho (client) |
| `prisma.config.ts` | Config centralizada do Prisma 7 |
| `prisma/schema.prisma` | Schema: Seller, Inventory, Order, PriceRule, SectionPriceRule, QuantityTier, CustomAlbum, SubscriptionEvent |

## Sincronizacao global
Alteracao estrutural (porta, stack, deploy, servico compartilhado) → atualizar CLAUDE.md da raiz Arena Cards + propagar downstream. Ver `../.claude/rules/sync-global.md` na raiz Arena Cards.
