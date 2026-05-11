# FigurinhasPro — Snapshot do Produto (v0.1.0)

**Gerado em:** 2026-05-11 19:51:44  
**Branch:** prototype/modal-roi (estado dirty)  
**Método:** extração via `scripts/inventory.py` + leitura de arquivos críticos  
**URL produção:** https://album-digital-ashen.vercel.app

---

## 1. Modelo de Negócio

**FigurinhasPro** é um SaaS B2B para **revendedoras de figurinhas Panini**:
- Criar lojas online pessoais (vitrine pública por `seller.shopSlug`)
- Gerenciar estoque de figurinhas (até 13 edições Copa do Mundo, ~7.122 figurinhas total)
- Configurar preços (por tipo, por seção/país, desconto por quantidade)
- Processar pedidos com workflow completo (QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED)
- Acompanhar métricas comerciais (figurinhas vendidas, faturamento, pedidos)

**Planos (temporariamente liberados — gates desabilitados):**

| Plano | Preço | Status |
|-------|-------|--------|
| FREE | Grátis | Ativo |
| PRO | R$ 29/mês | Planejado |
| UNLIMITED | R$ 99/mês | Planejado |

Gates de limite (`src/lib/plan-limits.ts`) estão **desabilitados** — todos os usuários têm acesso PRO/UNLIMITED. TODO: restaurar.

**Cockpit comercial:** Módulo admin-only (`/painel/comercial`) para gerir leads, ofertas, experimentos, KPIs e tarefas do próprio FigurinhasPro como produto.

**Catálogo:** `src/lib/albums.ts` contém 44.781 linhas com dados de 7.122 figurinhas de 13 edições Copa do Mundo (fonte canônica Panini).

**Oportunidade de mercado:** Copa 2026 começa junho/2026 (~2 meses). Janela crítica: produto deve estar monetizado ANTES do lançamento do álbum Panini 2026.

**Integração Stripe:**
- Endpoints: `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`
- Seller fields: `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeCurrentPeriodEnd`
- Webhook: logs em `SubscriptionEvent` (idempotência via `stripeEventId`)

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

## 3. Stack Técnico

| Camada | Tecnologia | Versão | Detalhes |
|--------|------------|--------|----------|
| Linguagem | TypeScript | 5+ | strict mode |
| Framework | Next.js | 16.2.4 | App Router, Turbopack, React Compiler ativado |
| React | React | 19.2.5 | Compiler (`babel-plugin-react-compiler`), `use` + `useActionState` nativos |
| Database | PostgreSQL (prod) | — | Neon via `@prisma/adapter-neon` (WebSocket Pool) |
| Database (dev) | SQLite | — | `better-sqlite3` adapter |
| ORM | Prisma | 7.7.0 | Generator novo `prisma-client` em `src/generated/prisma/` |
| Auth | iron-session | 8.0.4 | Cookies criptografados (sem BD) |
| Auth | bcryptjs | 3.0.3 | Hash de senhas |
| UI | Tailwind CSS | 4 | CSS-first via `@theme inline` em `globals.css` |
| UI | React | 19.2.5 | Compiler otimiza automaticamente (sem `useMemo`/`useCallback` necessários) |
| Tipografia | Geist Sans/Mono | — | Imports automáticos via next/font |
| Validação | Zod | 4.3.6 | Reescrita completa vs v3 |
| Pagamentos | Stripe SDK | 22.0.2 | Checkout, customer portal, webhook |
| Imagens | Sharp | 0.34.5 | Processamento de imagens |
| QR Codes | react-qr-code | 2.0.18 | QR de loja/pedido |
| Flags | country-flag-emoji | 0.1.8 | Flags de seções/países |
| Analytics | Vercel Analytics | 2.0.1 | Web Analytics automáticas |
| Web Vitals | Vercel Speed Insights | 2.0.0 | Core Web Vitals |
| Monitoring | Sentry | 10.49.0 | Error tracking (client/server/edge), DSN opcional dev |
| Lint/Format | Biome | 2.4.12 | Substitui ESLint/Prettier (workspace-wide) |
| Testes | Vitest | 4.1.4 | Environment `node`, mocks em `src/__tests__/setup.ts` |
| Testing Library | @testing-library/react | 16.3.2 | Component testing |
| Hospedagem | Vercel | — | Projeto `album-digital`, deploy manual `vercel deploy --prod` |

**Breaking Changes Críticos (Next.js 16, Prisma 7, Tailwind 4, React 19):**
- **Next.js 16:** APIs de request assíncronas (`await params`, `await cookies()`, `await headers()`)
- **Next.js 16:** `proxy.ts` substitui `middleware.ts`; runtime Node.js (não Edge)
- **Prisma 7:** Driver adapter obrigatório (`@prisma/adapter-neon` ou outro)
- **Prisma 7:** Config centralizada em `prisma.config.ts` (não em CLI flags)
- **Tailwind 4:** Sem `tailwind.config.js`; config em CSS via `@theme inline`
- **React 19:** Compiler ativado — `useMemo`/`useCallback` desnecessários

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

## Extratos da Varredura Automática (2026-05-11)

**Inventário do codebase:**

| Métrica | Valor |
|---------|-------|
| Arquivos totais | 11.171 |
| Código TypeScript | 1.135 arquivos |
| Documentação Markdown | 361 arquivos |
| Arquivo maior | `src/lib/albums.ts` (44.781 linhas) |
| Estrutura `src/app/` | 79 arquivos |
| Estrutura `src/components/` | 55 arquivos |
| Estrutura `src/lib/` | 32 arquivos |
| Testes | 2 arquivos em `src/__tests__/` |
| Schema Prisma | 3 arquivos em `prisma/` |

**Ferramentas detectadas:**
vitest, biome, sentry, prisma, stripe, next, react, tailwind, iron-session, zod

**Regras críticas (enforced via hooks):**
1. Pre-commit gate: `npm run test` → `npx tsc --noEmit` → `npm run build` (bloqueia commit se falha)
2. Deploy obrigatório: toda tarefa conclui com `npx vercel deploy --prod`
3. TDD: Red → Green → Refactor → Update Spec → Commit
4. Sem arquivos .env, dev.db, credentials em git

---

## Sumário Executivo

**FigurinhasPro** é um SaaS B2B production-ready para revendedoras de figurinhas Panini. Stack moderno (Next.js 16, Prisma 7, Tailwind 4, Stripe), 27 rotas públicas + privadas, schema de 18 entidades cobrindo estoque, preços (3 eixos), pedidos e cockpit comercial. Planos de receita (mensalidade SaaS + futuro comissão), monetização alinhada à Copa 2026 (~2 meses). UI dark-mode mobile-first, auth segura (iron-session + bcryptjs), deploy contínuo Vercel. Gates de plano temporariamente liberados; Sentry, rate limiting e email transacional ainda não implementados. Pronto para fase beta com revendedoras reais.

**Próximos passos:**
1. Restaurar plan limits em `src/lib/plan-limits.ts`
2. Implementar rate limiting em endpoints críticos
3. Adicionar email transacional (Resend)
4. Ativar Sentry DSN em produção
5. Testes end-to-end de Stripe webhook em produção

---

_Snapshot gerado em 2026-05-11 19:51:44 via `/p8-master:p8-snapshot`.  
Anterior: 2026-04-28. Backup: `product-snapshot.bak.2026-04-28.md`.  
Regenere quando o projeto evoluir significativamente._
