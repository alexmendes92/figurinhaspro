# Product Snapshot: FigurinhasPro (album-digital)

**Gerado em:** 2026-04-28
**Path:** C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
**Método:** varredura automática do codebase

---

## Modelo de Negócio

SaaS freemium com checkout Stripe ativo. Vende plano de assinatura mensal a vendedores (revendedores) de figurinhas que querem montar uma vitrine digital com estoque, preços e pedidos. Limites por plano são guardados no código mas atualmente liberados (gates retornam `allowed:true` em quase todos os caminhos — ver `plan-limits.ts:74`). Há também um cockpit comercial admin-only (`/painel/comercial`) para gerir leads, ofertas, experimentos e KPIs do próprio FigurinhasPro como produto.

**Planos detectados:**

| Plano | Preço | Limites/Features |
|-------|-------|------------------|
| FREE (Starter) | R$ 0 | 100 stickers, 10 pedidos/mês, 1 álbum, `basic_store` |
| PRO | R$ 29,00/mês | 1000 stickers, 100 pedidos/mês, 13 álbuns, +`whatsapp` +`custom_prices` |
| UNLIMITED (Ilimitado) | R$ 59,00/mês | ilimitado, 13 álbuns, +`reports` +`priority_support` |

**Sinais técnicos:**
- Páginas relacionadas: `/painel/planos`, `/onboarding`, `/painel/comercial/*`
- Integração de pagamento: Stripe SDK 22 — `api/stripe/checkout`, `api/stripe/portal`, `api/stripe/webhook`
- Constantes: `PLANS` em `src/lib/stripe.ts:19`, `PLAN_LIMITS` em `src/lib/plan-limits.ts:3`
- `Seller` carrega `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd` (`prisma/schema.prisma:27`)
- Onboarding tracking: `Seller.onboardingStep` (Int) — checklist visual em `components/painel/onboarding-checklist.tsx`

---

## Entidades

Prisma 7.7 com generator novo `prisma-client` (gera em `src/generated/prisma/`). 18 modelos divididos em 2 domínios: **núcleo do produto** (Seller + estoque/preços/pedidos + álbuns customizados) e **cockpit comercial** (família `Biz*`). IDs em CUID. Tudo cascateia a partir de `Seller` ou de uma raiz `Biz*`.

| Entidade | Descrição | Campos chave | Relações |
|----------|-----------|--------------|----------|
| `Seller` | Vendedor — conta, plano, billing Stripe, onboarding | `email` unique, `shopSlug` unique, `plan` default FREE, `onboardingStep` | tem inventory, orders, priceRules, sectionPriceRules, quantityTiers, customAlbums, subscriptionEvents |
| `Inventory` | Estoque por figurinha do vendedor | unique `(sellerId, albumSlug, stickerCode)`, `quantity`, `customPrice` | → Seller |
| `PriceRule` | Preço base por tipo de figurinha (global ou por álbum) | unique `(sellerId, albumSlug, stickerType)`; `albumSlug` nullable = global | → Seller |
| `SectionPriceRule` | Ajuste de preço por seção/país (FLAT ou OFFSET) dentro de um álbum | unique `(sellerId, albumSlug, sectionName)`, `adjustType`, `value` | → Seller |
| `QuantityTier` | Desconto progressivo por volume no carrinho por álbum | unique `(sellerId, albumSlug, minQuantity)`, `discount` (%) | → Seller |
| `CustomAlbum` | Álbuns customizados criados pelo vendedor (stickers em JSON) | unique `(sellerId, slug)`, `stickers` String JSON | → Seller |
| `Order` + `OrderItem` | Pedidos com workflow QUOTE→CONFIRMED→PAID→SHIPPED→DELIVERED | `status` (string), `channel` default SYSTEM, `totalPrice` | Order tem OrderItem[] |
| `SubscriptionEvent` | Log Stripe (idempotência via `stripeEventId` unique) | `type`, `data` String JSON | → Seller |
| `BizLead` | Lead comercial — pipeline PROSPECT→WON/LOST | `stage`, `source`, `priority`, `potentialValue`, `convertedSellerId` | tem activities, tasks |
| `BizActivity` | Log de toque (CALL/WHATSAPP/EMAIL/MEETING/DEMO/NOTE) | `type`, `channel`, `summary`, `result` | → BizLead |
| `BizOffer` | Oferta comercial — preço, tipo, status | `priceType` (ONE_TIME/MONTHLY/ANNUAL/PACKAGE), `status` ACTIVE/PAUSED, `salesCount`, `revenue` | — |
| `BizExperiment` | Experimento de growth — hipótese, status, resultado | `status` PLANNED→RUNNING→COMPLETED/KILLED, `learning`, `decision` | tem tasks |
| `BizInitiative` | Iniciativa estratégica — kanban 4 colunas | `phase` BACKLOG→PLANNED→IN_PROGRESS→DONE, `category`, `impact`, `effort` | tem milestones, tasks |
| `BizMilestone` | Marco de uma iniciativa | `targetDate`, `completedAt`, `status` | → BizInitiative |
| `BizTask` | Tarefa operacional — vincula opcional a lead/iniciativa/experimento | `priority`, `status` TODO, `deadline` | → BizLead?, BizInitiative?, BizExperiment? |
| `BizKpi` | Definição de KPI — name unique, unit, baseline, target | `category`, `unit` | tem snapshots |
| `BizKpiSnapshot` | Valor histórico de KPI | `value`, `recordedAt` | → BizKpi |

**Enums:** schema usa `String` em vez de enum nativo Postgres em todos os campos de status (plano, stage, phase, priority, status, type, channel, source, priceType). Valores dos status estão documentados em `CLAUDE.md` e `AGENTS.md`, não no schema.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Linguagem | TypeScript 5 |
| Framework | Next.js 16.2.4 (App Router, Turbopack, React Compiler) |
| Database | PostgreSQL — Neon (prod) via WebSocket Pool / SQLite (dev) via better-sqlite3 |
| ORM | Prisma 7.7 com adapters `@prisma/adapter-neon` + `@prisma/adapter-better-sqlite3`; generator novo `prisma-client` |
| Auth | iron-session 8 (cookies criptografados) + bcryptjs 3 (hash) — `src/lib/auth.ts` |
| UI | React 19.2.5 + Tailwind CSS 4 (CSS-first via `@theme inline`) + Geist fonts |
| Validação | Zod 4.3.6 |
| Background jobs | Não detectado (sem Inngest/Trigger/BullMQ) |
| IA/ML | Não detectado |
| Analytics | Vercel Analytics + Vercel Speed Insights — sem PostHog/Umami/etc. |
| Monitoring | Sentry (`@sentry/nextjs` 10.49) — client/server/edge |
| Hospedagem | Vercel — projeto `album-digital`, URL `album-digital-ashen.vercel.app`, deploy manual via `vercel deploy --prod` |

**Outras deps notáveis:**
- `stripe` 22.0.2 — checkout, customer portal, webhook (`api/stripe/*`)
- `sharp` 0.34 — processamento de imagem (`images.unoptimized: true`)
- `react-qr-code` — QR de loja/pedido
- `country-flag-emoji-polyfill` — flags de seções/países
- `dotenv` — carregamento explícito (Prisma 7 não auto-carrega)
- `babel-plugin-react-compiler` 1.0.0 — React Compiler em build
- `biome` 2.4 — lint/format (substitui ESLint/Prettier)
- `vitest` 4.1 — testes (env `node`, mocks Prisma + Stripe em `src/__tests__/setup.ts`)

---

## Custom Events

Sem instrumentação detectada. Nenhum match para `trackEvent(`, `analytics.track(`, `posthog.capture(`, `umami.track(`, `gtag(` no código-fonte. O projeto usa apenas `@vercel/analytics` (page views automáticos) e `@vercel/speed-insights` (web vitals automáticos) — ambos sem eventos custom. Cockpit comercial tem KPIs (`BizKpi` + `BizKpiSnapshot`) populados manualmente via UI, não via tracking.

| Event | Properties | Origem |
|-------|------------|--------|
| — | — | Sem eventos custom |

---

## Páginas e API

Next.js 16 App Router — 33 páginas (auth + painel admin + cockpit comercial + loja pública + páginas legais/onboarding) e 24 endpoints API agrupados em 8 namespaces (auth, albums, inventory, orders, prices, comercial, stripe, bot).

### Páginas (UI)

| Rota | Tipo | Arquivo |
|------|------|---------|
| `/` | público | `src/app/page.tsx` |
| `/login` | auth | `src/app/(auth)/login/page.tsx` |
| `/registro` | auth | `src/app/(auth)/registro/page.tsx` |
| `/esqueci-senha` | auth | `src/app/(auth)/esqueci-senha/page.tsx` |
| `/reset-senha` | auth | `src/app/(auth)/reset-senha/page.tsx` |
| `/verificar-email` | auth | `src/app/(auth)/verificar-email/page.tsx` |
| `/onboarding` | logado | `src/app/onboarding/page.tsx` |
| `/albuns` | público | `src/app/albuns/page.tsx` |
| `/albuns/:year` | público | `src/app/albuns/[year]/page.tsx` |
| `/loja/:slug` | público | `src/app/loja/[slug]/page.tsx` |
| `/loja/:slug/:albumSlug` | público | `src/app/loja/[slug]/[albumSlug]/page.tsx` |
| `/painel` | logado | `src/app/painel/page.tsx` |
| `/painel/loja` | logado | `src/app/painel/loja/page.tsx` |
| `/painel/estoque` | logado | `src/app/painel/estoque/page.tsx` |
| `/painel/estoque/novo` | logado | `src/app/painel/estoque/novo/page.tsx` |
| `/painel/estoque/:albumSlug` | logado | `src/app/painel/estoque/[albumSlug]/page.tsx` |
| `/painel/precos` | logado | `src/app/painel/precos/page.tsx` |
| `/painel/precos/:albumSlug` | logado | `src/app/painel/precos/[albumSlug]/page.tsx` |
| `/painel/pedidos` | logado | `src/app/painel/pedidos/page.tsx` |
| `/painel/planos` | logado | `src/app/painel/planos/page.tsx` |
| `/painel/comercial` | admin | `src/app/painel/comercial/page.tsx` |
| `/painel/comercial/leads` | admin | `src/app/painel/comercial/leads/page.tsx` |
| `/painel/comercial/leads/:id` | admin | `src/app/painel/comercial/leads/[id]/page.tsx` |
| `/painel/comercial/ofertas` | admin | `src/app/painel/comercial/ofertas/page.tsx` |
| `/painel/comercial/experimentos` | admin | `src/app/painel/comercial/experimentos/page.tsx` |
| `/painel/comercial/iniciativas` | admin | `src/app/painel/comercial/iniciativas/page.tsx` |
| `/painel/comercial/tarefas` | admin | `src/app/painel/comercial/tarefas/page.tsx` |
| `/painel/comercial/kpis` | admin | `src/app/painel/comercial/kpis/page.tsx` |
| `/painel/admin/revendedores` | admin | `src/app/painel/admin/revendedores/page.tsx` |
| `/painel/admin/revendedores/:id` | admin | `src/app/painel/admin/revendedores/[id]/page.tsx` |
| `/privacidade` | público | `src/app/privacidade/page.tsx` |
| `/termos` | público | `src/app/termos/page.tsx` |
| `/teste` | público | `src/app/teste/page.tsx` |

### API endpoints

| Rota | Método (inferido) | Arquivo |
|------|--------|---------|
| `/api/auth/register` | POST | `src/app/api/auth/register/route.ts` |
| `/api/auth/login` | POST | `src/app/api/auth/login/route.ts` |
| `/api/auth/logout` | POST | `src/app/api/auth/logout/route.ts` |
| `/api/auth/forgot-password` | POST | `src/app/api/auth/forgot-password/route.ts` |
| `/api/auth/reset-password` | POST | `src/app/api/auth/reset-password/route.ts` |
| `/api/seller` | GET/PATCH | `src/app/api/seller/route.ts` |
| `/api/albums` | GET/POST | `src/app/api/albums/route.ts` |
| `/api/albums/:id` | GET/PATCH/DELETE | `src/app/api/albums/[id]/route.ts` |
| `/api/inventory` | GET/POST | `src/app/api/inventory/route.ts` |
| `/api/inventory/bulk` | POST | `src/app/api/inventory/bulk/route.ts` |
| `/api/inventory/setup` | POST | `src/app/api/inventory/setup/route.ts` |
| `/api/prices` | GET/POST | `src/app/api/prices/route.ts` |
| `/api/prices/:albumSlug` | GET/POST | `src/app/api/prices/[albumSlug]/route.ts` |
| `/api/prices/sections` | GET/POST | `src/app/api/prices/sections/route.ts` |
| `/api/prices/tiers` | GET/POST | `src/app/api/prices/tiers/route.ts` |
| `/api/orders` | GET/POST | `src/app/api/orders/route.ts` |
| `/api/orders/:id` | GET/PATCH | `src/app/api/orders/[id]/route.ts` |
| `/api/stripe/checkout` | POST | `src/app/api/stripe/checkout/route.ts` |
| `/api/stripe/portal` | POST | `src/app/api/stripe/portal/route.ts` |
| `/api/stripe/webhook` | POST | `src/app/api/stripe/webhook/route.ts` |
| `/api/comercial/seed` | POST | `src/app/api/comercial/seed/route.ts` |
| `/api/bot/stickers` | GET | `src/app/api/bot/stickers/route.ts` |
| `/api/bot/quote` | POST | `src/app/api/bot/quote/route.ts` |
| `/api/bot/quote/:ref` | GET | `src/app/api/bot/quote/[ref]/route.ts` |

---

## Design

Tailwind 4 CSS-first sem `tailwind.config.ts` — tokens declarados via `@theme inline` em `src/app/globals.css`. Tema escuro fixo (background `#0b0e14`, foreground `#e8eaed`). Animações custom (slide-up, fade-in, sticker-glow, slide-in-right) declaradas direto no globals. Não usa shadcn/ui (sem `components.json`); estrutura de UI é semi-ad-hoc com 3 primitives em `components/ui/` e o resto organizado por domínio (auth, painel, loja, painel/comercial).

**Tokens (CSS vars / theme):**

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-background` | `#0b0e14` | bg principal |
| `--color-foreground` | `#e8eaed` | texto principal |
| `--font-sans` | `var(--font-geist-sans)` | tipografia padrão |
| `--font-mono` | `var(--font-geist-mono)` | código/números |

**Classes utilitárias custom:** `.slide-up`, `.fade-in`, `.sticker-added`, scrollbar webkit (definido em `globals.css`).

**Componentes UI primitives (`src/components/ui/`):** `phone-input`, `empty-state`, `confirm-dialog`.

**Componentes de domínio (top-level `src/components/`):** `app-shell`, `album-shelf`, `album-viewer`, `cart-drawer`, `flag-emoji-polyfill`, `sticker-panel`, `toast` + subpastas `auth/` (8), `painel/` (16, incluindo `comercial/`), `loja/` (5).

---

_Snapshot autogerado. Regenere quando o projeto evoluir._
