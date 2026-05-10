# P8-FigurinhasPro — Glossário do domínio

> Referência de termos do projeto. Carregado por hook `SessionStart`. Consulte antes de afirmar qualquer conceito do domínio.

---

## Domínio de negócio

- **Sticker (figurinha)** — entidade base do catálogo. Tipos: `regular`, `foil` (especial), `shiny` (brilhante). Config centralizada em [src/lib/sticker-types.ts](../../../src/lib/sticker-types.ts) — valores internos NUNCA mudam, apenas labels visíveis (`Normal`, `Especial`, `Brilhante`). Use `getStickerTypeConfig()` / `getStickerTypeShortLabel()` para labels.

- **Album (álbum)** — coleção de stickers. Há dois tipos:
  - **Estáticos** — definidos em código em `src/lib/albums.ts` (~1.4MB, ~7.122 cards em 13 Copas).
  - **Customizados (CustomAlbum)** — criados por vendedor via `/painel/estoque/novo`. Schema Prisma `CustomAlbum`. Slug com prefixo `custom_` para evitar conflito com estáticos. Conversão `CustomAlbum → Album` em [src/lib/custom-albums.ts](../../../src/lib/custom-albums.ts). Parser suporta ranges (`1-670`), prefixos (`BRA1-BRA20`), listas mistas.

- **Section (seção)** — agrupamento dentro de um álbum (ex: "Brasil", "Argentina" numa Copa). Modelado em código + influencia regras de preço (`SectionPriceRule`).

- **Seller (vendedor)** — usuário do SaaS, dono de inventário e ofertas. Schema Prisma `Seller`. Identificado por `email` (chave única). Tem `plan` (FREE/PRO/UNLIMITED) e `stripeCustomerId`/`stripeSubscriptionId` quando paga.

- **Inventory (estoque)** — quantidade de cada sticker que o vendedor tem. Unique `sellerId+albumSlug+stickerCode`. Editado em `/painel/estoque`.

- **Order (pedido)** — compra de stickers feita por cliente final. Workflow: `QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED`. Pagamento via Stripe Checkout.

- **Plan (plano)** — FREE / PRO / UNLIMITED. Gates em [src/lib/plan-limits.ts](../../../src/lib/plan-limits.ts) — funções `checkStickerLimit()`, `checkOrderLimit()`, `checkAlbumLimit()`, `hasFeature()`. **Atualmente desabilitados** (todos retornam `true`) — TODO restaurar.

- **Cockpit Comercial** — módulo admin-only em `/painel/comercial`. Gate via `ADMIN_EMAIL` env var. Server Actions centralizadas em [src/app/painel/comercial/actions.ts](../../../src/app/painel/comercial/actions.ts) (15 actions). Sub-módulos: `/leads`, `/ofertas`, `/experimentos`, `/iniciativas`, `/tarefas`, `/kpis`. Modelos Prisma com prefixo `Biz*` (BizLead, BizActivity, BizOffer, etc.).

- **Loja pública** — vitrine do vendedor em `/loja/[slug]`. Cliente final pode pesquisar stickers e fazer pedido sem logar. Importação de "lista faltante" em `/loja/[slug]/[albumSlug]` permite filtrar só o que o vendedor tem.

---

## Stack técnico (resumo)

- **Next.js 16** — App Router, Server Components default, Turbopack, React Compiler ativado, APIs async (`await params`, `await cookies()`, `await headers()`).
- **React 19** — sem `useMemo`/`useCallback`/`React.memo` (Compiler otimiza).
- **Prisma 7.7** — config centralizada em `prisma.config.ts`, generator `prisma-client` novo (output `src/generated/prisma`), driver adapter PrismaNeon (WebSocket Pool).
- **Neon Postgres** — produção. Lazy Proxy em [src/lib/db.ts](../../../src/lib/db.ts) (evita conexão durante build).
- **Tailwind CSS 4** — config CSS-first em `globals.css` via `@theme inline`. SEM `tailwind.config.js`.
- **Zod 4** — reescrita completa, performance 2-7x melhor, novas APIs.
- **iron-session 8** — cookies criptografados, env var `SESSION_PASSWORD` (≥32 chars).
- **bcryptjs 3** — hash de senhas.
- **Stripe SDK 22** — checkout, webhooks, customer portal. Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Sentry 10.49** — `@sentry/nextjs`, configs client/server/edge + `instrumentation.ts`. **Atualmente inativo** (DSN opcional).
- **Vitest 4** — `environment: "node"`, mocks globais em [src/__tests__/setup.ts](../../../src/__tests__/setup.ts) (Prisma 18 modelos + Stripe).
- **Sharp** — processamento de imagens, `images.unoptimized: true`.
- **Vercel Analytics + Speed Insights** — embutidos no layout.

---

## Arquivos-chave

| Arquivo | Função |
|---|---|
| `src/lib/db.ts` | Conexão Prisma/Neon (Lazy Proxy) |
| `src/lib/auth.ts` | iron-session + lookup de Seller |
| `src/lib/plan-limits.ts` | Gates de plano (desabilitados — TODO restaurar) |
| `src/lib/sticker-types.ts` | Config Regular/Especial/Brilhante |
| `src/lib/stripe.ts` | Cliente Stripe SDK 22 |
| `src/lib/custom-albums.ts` | Conversão CustomAlbum→Album, parser stickers |
| `src/lib/price-resolver.ts` | Resolução 3-eixos (individual > seção > tipo álbum > tipo global > padrão) |
| `src/lib/admin.ts` | Guard `isAdmin(email)` via `ADMIN_EMAIL` |
| `src/lib/env.ts` | Validação env vars com Zod (strict prod, fallback dev) |
| `prisma/schema.prisma` | 18 modelos (catálogo, pedidos, preços, cockpit comercial) |
| `prisma.config.ts` | Config Prisma 7 centralizada |
| `src/__tests__/setup.ts` | Mocks globais Vitest |
| `instrumentation.ts` | Sentry hook (inativo) |

---

## Env vars críticas em prod

- `DATABASE_URL` — Neon Postgres connection string
- `SESSION_PASSWORD` — iron-session, ≥32 chars
- `STRIPE_SECRET_KEY` — Stripe SDK
- `STRIPE_WEBHOOK_SECRET` — assinatura webhook
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — público
- `ADMIN_EMAIL` — guard cockpit comercial
- `SENTRY_DSN` — opcional (inativo)
- `BOT_HMAC_SECRET` — integração WhatsApp bot via n8n

Schema validado em [src/lib/env.ts](../../../src/lib/env.ts).

---

## Convenções P8

- **Imports**: alias `@/*` → `src/*`
- **Tipos**: explícitos, sem `any`, sem `Dict` sem parâmetros
- **Server Components default** — `'use client'` SÓ quando precisa hooks/eventos
- **Mobile-first**: `viewportFit: "cover"`, safe-area-bottom, bottom nav, touch targets ≥44px
- **Gerar Prisma após schema mudar**: `npx prisma generate` (geralmente automático em `npm run build`)
- **Albuns customizados**: slug com prefixo `custom_`
- **Cockpit comercial**: padrão `?new=1` em searchParam para formulários de criação em Server Components

---

## Gaps conhecidos (não-fechados em 2026-05-10)

1. **Plan limits desabilitados** — `plan-limits.ts` retorna `true` pra tudo. Precisa restaurar.
2. **Rate limiting ausente** — sem proteção em rotas públicas (login, webhook, /loja/[slug]).
3. **Sentry inativo** — `instrumentation.ts` existe mas DSN opcional, não testado.
4. **Stripe webhook sem teste E2E em prod** — endpoints existem mas não validados.
5. **Email transacional ausente** — Resend planejado, não implementado.
6. **`better-sqlite3` legado em package.json** — produção usa PrismaNeon, dep dev pode ficar.

---

## Deploy

- **Vercel project**: `album-digital`
- **URL**: https://album-digital-ashen.vercel.app
- **Deploy**: manual via `npx vercel deploy --prod` após `git push`
- **Auto-deploy desativado** — sempre manual
- **Regra Akita-style do P8-MASTER**: deploy prod exige aprovação humana (gate). Sobrescreve regra "deploy automático" do CLAUDE.md de P8.
