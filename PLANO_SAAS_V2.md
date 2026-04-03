# FigurinhasPro — Plano de Melhoria SaaS v2 (Corrigido)

> Data: 03/04/2026 | Status: Planejamento | Versao: 2.0
> Baseado na analise critica da v1. Correcoes tecnicas, estimativas realistas, validacao primeiro.

---

## Principio Central

**Validar antes de construir. Construir o minimo. Iterar com dados reais.**

A Copa do Mundo 2026 comeca em junho/2026 (~2 meses). Essa e a maior janela de oportunidade — o plano e otimizado para estar no ar com monetizacao ANTES do lancamento do album Panini 2026.

---

## 1. Diagnostico Atual (verificado no codigo)

### O que funciona

| Feature | Status | Evidencia |
|---------|--------|-----------|
| Landing page com pricing | OK | `app/page.tsx` — 3 planos, hero, features |
| Registro + Login | OK (inseguro) | `api/auth/register` + `api/auth/login` |
| Catalogo 13 Copas | OK | `lib/albums.ts` — 7.122 figurinhas |
| Estoque visual por album | OK | `components/painel/inventory-manager.tsx` |
| Precos (global + custom) | OK | `api/prices/route.ts` + `painel/precos/page.tsx` |
| Vitrine publica | OK | `/loja/[slug]` + `/loja/[slug]/[albumSlug]` |
| Carrinho + Checkout | OK | `lib/cart-context.tsx` + `components/cart-drawer.tsx` |
| Pedidos com workflow | OK | 6 status: QUOTE→CONFIRMED→PAID→SHIPPED→DELIVERED→CANCELLED |
| WhatsApp (link formatado) | OK | wa.me na vitrine |
| Dashboard metricas | OK | Figurinhas, pedidos, faturamento |

### O que impede producao

| Problema | Arquivo | Detalhe |
|----------|---------|---------|
| **SQLite em serverless** | `lib/db.ts` | `PrismaBetterSqlite3` — dados somem a cada deploy |
| **Senhas texto puro** | `api/auth/register/route.ts:39` | Comentario literal: "senha em texto por enquanto" |
| **Cookie session inseguro** | `lib/auth.ts:6` | Cookie armazena seller ID em plain text — qualquer CUID forjado sequestra sessao |
| **Sem CSRF** | Todas as APIs | Nenhum token CSRF — sites externos podem fazer requests autenticadas |
| **Build ignora erros** | `next.config.ts:9-12` | `ignoreBuildErrors: true` + `ignoreDuringBuilds: true` — bugs silenciosos |
| **Sem rate limiting** | Todas as APIs | Login brute force, spam de pedidos, DDoS nas APIs |
| **Sem LGPD** | — | Coleta nome, email, telefone sem termos de uso ou politica de privacidade |
| **Sem monitoramento** | — | Nenhum error tracking — bugs em prod sao invisiveis |

---

## 2. Arquitetura-Alvo

```
                        ┌─────────────────────────────────────┐
                        │      FRONTEND (Next.js 16.2)        │
                        │  Landing → Auth → Onboard → Painel  │
                        │  Vitrine Publica → Carrinho          │
                        └──────────────┬──────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────┐
          ▼                            ▼                        ▼
   ┌─────────────┐           ┌──────────────┐          ┌──────────────┐
   │  Neon PG    │           │   Stripe     │          │   Resend     │
   │  Prisma 7   │           │  Checkout    │          │   Email      │
   │  Producao   │           │  Webhook     │          │  Transacional│
   │             │           │  Portal      │          │              │
   └─────────────┘           └──────────────┘          └──────────────┘
          │
          ▼
   ┌─────────────┐
   │ Vercel Blob │
   │ Logos/Assets│
   └─────────────┘
```

### Stack de servicos (todos com free tier)

| Servico | Uso | Free tier | Pago |
|---------|-----|-----------|------|
| Vercel Hobby | Hosting | Sim | $20/mes (Pro) |
| Neon Free | Postgres | 0.5 GB, 1 projeto | $19/mes (Launch) |
| Stripe | Pagamentos | Sem mensalidade | 3.49% + R$0.39/tx |
| Resend | Email | 3.000/mes | $20/mes |
| Vercel Blob | Uploads | 1 GB | Incluido no Pro |
| Sentry | Error tracking | 5K eventos/mes | $26/mes |
| Dominio .com.br | figurinhaspro.com.br | — | ~R$40/ano |

**Custo inicial: R$0/mes** (tudo no free tier ate ter tracao)

---

## 3. Fases de Implementacao

---

### SPRINT 0 — Validacao com Usuarios Reais
**Duracao: 3-5 dias | Prioridade: CRITICA**
**Objetivo: Confirmar que revendedores querem e pagariam por isso**

> Nao existe nada pior do que construir algo perfeito que ninguem quer.

#### 0.1 Pesquisa com revendedores
- Encontrar 8-10 revendedores de figurinhas em grupos de WhatsApp/Facebook/Instagram
- Perguntar:
  - Como voce gerencia seu estoque hoje? (planilha, caderno, app?)
  - Quanto tempo gasta por dia nisso?
  - Pagaria R$29/mes por uma ferramenta que faz tudo automatico?
  - Qual o preco maximo que pagaria?
  - O que mais te daria valor? (vitrine, WhatsApp, controle de estoque?)

#### 0.2 Validar pricing
- Se a maioria achar R$29 caro → considerar:
  - **Modelo comissao**: X% por pedido fechado via plataforma
  - **Freemium mais generoso**: 500 figurinhas gratis, Pro a R$19/mes
  - **Pricing por volume**: R$0.05/figurinha no estoque/mes

#### 0.3 Preparar album Copa 2026
- Buscar dados do album Panini FIFA World Cup 2026 (sera lancado antes de junho)
- Formato igual aos 13 albums existentes em `lib/albums.ts`
- **TIMING CRITICO**: estar pronto ANTES do lancamento do album = first-mover advantage

#### 0.4 Decisao Go/No-Go
- Se >=6/10 revendedores demonstraram interesse real → prosseguir
- Se <4/10 → pivotar ou desistir antes de investir semanas de dev
- Documentar insights em `memory/feedback_validacao.md`

**Entregavel:** Decisao informada sobre prosseguir, pricing validado, contatos de early adopters.

---

### SPRINT 1 — Fundacao de Producao (infraestrutura critica)
**Duracao: 8-10 dias | Prioridade: BLOQUEANTE**
**Objetivo: Tornar o app seguro e deployavel em producao**

#### 1.1 Migrar SQLite → Neon Postgres

Referencia: P6 (`ml-dashboard`) ja usa Prisma 7 + `@prisma/adapter-pg` com Neon.

**Tarefas:**
- Criar projeto/banco Neon (free tier)
- Instalar `@prisma/adapter-pg` (remover `@prisma/adapter-better-sqlite3` e `better-sqlite3`)
- Atualizar `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```
- Atualizar `prisma.config.ts`:
  ```ts
  import dotenv from "dotenv"
  dotenv.config({ path: ".env.local" })
  dotenv.config()
  import { defineConfig } from "prisma/config"

  export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
      url: process.env["POSTGRES_URL_NON_POOLING"] || process.env["DATABASE_URL"],
    },
  })
  ```
- Atualizar `lib/db.ts`:
  ```ts
  import { PrismaClient } from "@prisma/client"
  import { PrismaPg } from "@prisma/adapter-pg"

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

  function createPrismaClient() {
    const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    if (!connectionString) throw new Error("DATABASE_URL nao configurada")
    const adapter = new PrismaPg({ connectionString })
    return new PrismaClient({ adapter })
  }

  export const db = globalForPrisma.prisma || createPrismaClient()
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
  ```
- Rodar `npx prisma db push` contra Neon
- Criar script de seed para dados de demonstracao
- Configurar env vars na Vercel: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
- Testar TODAS as APIs contra Postgres (register, login, inventory, orders, prices)

**Criterio de pronto:** Todas as APIs funcionam identicamente com Neon.

#### 1.2 Seguranca de Auth (completa)

O problema nao e so senhas — e a sessao inteira.

**1.2a — Hash de senhas:**
- Instalar `bcryptjs` + `@types/bcryptjs`
- Atualizar `POST /api/auth/register`: hashear com `bcrypt.hash(password, 12)`
- Atualizar `POST /api/auth/login`: comparar com `bcrypt.compare(password, seller.password)`
- Script de migracao para rehashear senhas existentes (ou forcar reset no primeiro login)

**1.2b — Cookie session seguro:**
- Instalar `iron-session` (criptografia de cookies)
- Substituir cookie plain-text por session criptografada:
  ```ts
  // lib/auth.ts — usando iron-session
  import { getIronSession } from "iron-session"
  import { cookies } from "next/headers"

  interface SessionData {
    sellerId?: string
  }

  export async function getSession() {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, {
      password: process.env.SESSION_SECRET!, // 32+ chars
      cookieName: "fp_session",
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      },
    })
    if (!session.sellerId) return null
    return db.seller.findUnique({ where: { id: session.sellerId } })
  }
  ```
- Adicionar `SESSION_SECRET` as env vars (gerar com `openssl rand -hex 32`)

**1.2c — Rate limiting:**
- Instalar `@upstash/ratelimit` + `@upstash/redis` (ou implementacao simples in-memory para MVP)
- Rate limit nas rotas criticas:
  - `POST /api/auth/login` → 5 tentativas/minuto por IP
  - `POST /api/auth/register` → 3/hora por IP
  - `POST /api/orders` → 20/minuto por seller

**Criterio de pronto:** Senhas hasheadas, cookies criptografados, rate limiting ativo.

#### 1.3 Remover `ignoreBuildErrors`

**Tarefas:**
- Remover de `next.config.ts`:
  ```ts
  // REMOVER:
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  ```
- Rodar `npm run build` e corrigir TODOS os erros de TypeScript
- Rodar `npm run lint` e corrigir warnings criticos
- Build limpo = build confiavel

**Criterio de pronto:** `npm run build` passa sem flags de ignore.

#### 1.4 Monitoramento (Sentry)

- Instalar `@sentry/nextjs`
- Configurar com DSN em env var
- Error boundaries em `app/error.tsx` e `app/global-error.tsx`
- Testar com erro intencional em staging

#### 1.5 Legal (LGPD minima)

- Criar `/termos` — termos de uso basicos
- Criar `/privacidade` — politica de privacidade (dados coletados, uso, direitos)
- Checkbox obrigatorio no registro: "Li e aceito os termos"
- Link no footer da landing e da vitrine

#### 1.6 Paginas de erro e loading

- `app/not-found.tsx` — 404 personalizado
- `app/error.tsx` — erro generico com "tentar novamente"
- `app/loading.tsx` — skeleton loader global
- Loading states nos componentes client (painel/precos, painel/pedidos)

**Entregavel Sprint 1:** App seguro, deployavel em producao com Neon, monitorado.

---

### SPRINT 2 — Primeiros Usuarios + Copa 2026
**Duracao: 5-7 dias | Prioridade: ALTA**
**Objetivo: 10 sellers reais usando o produto + album 2026 pronto**

#### 2.1 Deploy em producao

- Deploy Vercel com dominio customizado (figurinhaspro.com.br ou similar)
- SSL automatico
- Env vars configuradas (Neon, Session Secret, Sentry)
- Verificar que tudo funciona em producao real

#### 2.2 Seller demo

- Criar conta `demo@figurinhaspro.com` com estoque preenchido
- 2-3 albums com ~50 figurinhas cada (variedade de regular/foil/shiny)
- Link publico `/loja/demo` para visitantes verem a vitrine funcionando
- Mencionar na landing page: "Veja uma loja de exemplo"

#### 2.3 Album Copa 2026

- Adicionar dados do album Panini 2026 ao catalogo
- Prioridade maxima — sellers vao querer vender figurinhas da Copa ATUAL
- Se os dados ainda nao estao disponiveis (album nao lancado), preparar estrutura e adicionar assim que sair

#### 2.4 SEO e Meta Tags

- `generateMetadata()` nas paginas dinamicas:
  - `/loja/[slug]` → "Figurinhas avulsas - {shopName} | FigurinhasPro"
  - `/loja/[slug]/[albumSlug]` → "Copa {year} - {shopName} | FigurinhasPro"
  - `/albuns/[year]` → "Album Panini Copa {year} | FigurinhasPro"
- OG image dinamica para compartilhamento (usando `@vercel/og` ou imagem estatica)
- Sitemap basico para Google indexar as vitrines

#### 2.5 Onboarding minimo

- Apos registro, redirecionar para `/painel` com banner de boas-vindas:
  - "Passo 1: Adicione suas figurinhas ao estoque"
  - "Passo 2: Defina seus precos"
  - "Passo 3: Compartilhe sua vitrine"
- Checklist dismissable (salvar progresso em campo `onboardingDone` no Seller)
- NAO precisa de wizard multi-step elaborado — banner simples e suficiente

#### 2.6 Convidar early adopters

- Contatar os revendedores do Sprint 0 que demonstraram interesse
- Oferecer acesso gratuito ilimitado por 3 meses como early adopters
- Coletar feedback ativamente (WhatsApp, formulario simples)
- Documentar feedback em `memory/feedback_early_adopters.md`

#### 2.7 Melhorias de UX baseadas em uso real

- Reservar 2-3 dias para iterar baseado no que os primeiros usuarios reportarem
- Bugs, confusoes de UI, fluxos quebrados
- **NAO adicionar features novas** — polir o que existe

**Entregavel Sprint 2:** Produto no ar com 10+ sellers reais, Copa 2026 pronta, feedback coletado.

---

### SPRINT 3 — Monetizacao (Stripe)
**Duracao: 10-14 dias | Prioridade: ALTA**
**Pre-requisito: Sprint 2 validou que sellers usam e gostam do produto**

> Se ninguem usa o Free, adicionar pagamento nao vai resolver.

#### 3.1 Schema Prisma — campos de billing

```prisma
model Seller {
  // ... campos existentes ...
  plan                    String    @default("FREE")
  stripeCustomerId        String?   @unique
  stripeSubscriptionId    String?
  stripePriceId           String?
  stripeCurrentPeriodEnd  DateTime?
  trialEndsAt             DateTime?
  onboardingDone          Boolean   @default(false)
}
```

NAO criar tabela separada `SubscriptionEvent` no MVP. Logs do Stripe sao suficientes para auditoria. Adicionar depois se necessario.

#### 3.2 Produtos no Stripe

Precos ajustados baseado na validacao do Sprint 0:

| Plano | Preco | ID Stripe |
|-------|-------|-----------|
| Starter | R$0 | — (sem subscription) |
| Pro | R$19-29/mes (validar) | `price_pro_monthly` |
| Ilimitado | R$49-59/mes (validar) | `price_unlimited_monthly` |

Opcional: precos anuais com 2 meses gratis.

#### 3.3 Endpoints Stripe

| Rota | Metodo | Funcao |
|------|--------|--------|
| `POST /api/stripe/checkout` | POST | Cria Checkout Session |
| `POST /api/stripe/webhook` | POST | Recebe eventos (raw body + signature) |
| `POST /api/stripe/portal` | POST | Cria Customer Portal session |

**Webhook events a tratar:**

| Evento | Acao |
|--------|------|
| `checkout.session.completed` | Ativar plano, salvar IDs Stripe |
| `invoice.payment_succeeded` | Renovar `stripeCurrentPeriodEnd` |
| `invoice.payment_failed` | Marcar como PAST_DUE, notificar seller |
| `customer.subscription.deleted` | Downgrade para FREE |
| `customer.subscription.updated` | Atualizar plano (up/downgrade) |

**Cuidados tecnicos:**
- Verificar assinatura do webhook com `stripe.webhooks.constructEvent()`
- Idempotencia: checar `stripeEventId` antes de processar
- Raw body: Route Handler precisa de `export const runtime = 'nodejs'` e `request.text()` (nao `.json()`)
- Retry: Stripe reenvia webhooks que falham — o handler deve ser idempotente

#### 3.4 Fluxo de Checkout

```
Seller clica "Assinar Pro" (landing OU painel)
  → POST /api/stripe/checkout { plan: "PRO" }
  → Cria Stripe Checkout Session com:
    - customer_email: seller.email
    - metadata: { sellerId: seller.id }
    - success_url: /painel?upgraded=true
    - cancel_url: /painel/assinatura
  → Redirect para checkout.stripe.com
  → Pagamento aprovado
  → Webhook checkout.session.completed
    → Atualiza seller.plan, salva IDs Stripe
  → Seller redirecionado para /painel com toast "Plano ativado!"
```

#### 3.5 UI de Billing

- `/painel/assinatura` — pagina de assinatura:
  - Plano atual + badges de uso (X/100 figurinhas)
  - Cards de upgrade com comparacao de features
  - Botao "Gerenciar assinatura" → Stripe Customer Portal
  - Historico de faturas (via Stripe Portal)

#### 3.6 Trial do Plano Pro

- Ao registrar, setar `trialEndsAt = now() + 14 dias`
- Durante trial, seller tem acesso Pro completo
- 3 dias antes do fim: banner no painel + email (Sprint 4)
- Apos expirar: downgrade automatico para FREE
  - Verificacao: checar `trialEndsAt` em `getSession()` ou middleware
  - NAO usar cron job — verificar on-demand quando seller acessa

#### 3.7 Testes do fluxo Stripe

- Testar em Stripe Test Mode:
  - Checkout completo (cartao 4242...)
  - Webhook processado corretamente
  - Upgrade Pro → Ilimitado
  - Cancelamento → downgrade
  - Pagamento falhou → status correto
- **NAO ir para producao sem testar todos os cenarios**

**Entregavel Sprint 3:** Sellers podem pagar, planos funcionam, trial ativo.

---

### SPRINT 4 — Enforcement + Comunicacao
**Duracao: 7-10 dias | Prioridade: ALTA**
**Objetivo: Limites funcionando + emails transacionais**

#### 4.1 Limites por plano

```ts
// lib/plan-limits.ts
export const PLAN_LIMITS = {
  FREE: {
    maxStickers: 100,
    maxOrdersPerMonth: 10,
    maxAlbums: 1,
    features: ["basic_store"],
  },
  PRO: {
    maxStickers: 1000,
    maxOrdersPerMonth: 100,
    maxAlbums: 13,
    features: ["basic_store", "whatsapp_integration", "custom_prices", "bulk_import"],
  },
  UNLIMITED: {
    maxStickers: Infinity,
    maxOrdersPerMonth: Infinity,
    maxAlbums: 13,
    features: ["basic_store", "whatsapp_integration", "custom_prices", "bulk_import", "reports", "priority_support"],
  },
} as const
```

#### 4.2 Guard de verificacao

```ts
// lib/plan-guard.ts
export async function checkPlanLimit(sellerId: string, resource: "stickers" | "orders" | "albums") {
  const seller = await db.seller.findUnique({ where: { id: sellerId } })
  const effectivePlan = getEffectivePlan(seller) // considera trial
  const limits = PLAN_LIMITS[effectivePlan]

  // Contar uso atual
  // Retornar { allowed: boolean, current: number, limit: number, upgradeUrl: string }
}
```

Pontos de verificacao:
- `POST /api/inventory` e `POST /api/inventory/bulk` → checar maxStickers
- `POST /api/orders` → checar maxOrdersPerMonth
- `GET /painel/estoque/[albumSlug]` → checar maxAlbums (so mostra albums permitidos)
- `POST /api/prices` custom price → feature gate

#### 4.3 UI de limites

- Badge no sidebar: "87/100 figurinhas" com barra de progresso
- Quando atinge 80%: banner amarelo "Voce esta perto do limite"
- Quando atinge 100%: modal de upgrade com CTA para Stripe Checkout
- Toast explicativo quando acao e bloqueada

#### 4.4 Email transacional (Resend)

Instalar `resend` e criar templates minimos:

| Email | Trigger | Prioridade |
|-------|---------|-----------|
| Boas-vindas | Registro | P0 |
| Novo pedido recebido | POST /api/orders | P0 |
| Trial expirando | 3 dias antes de `trialEndsAt` | P1 |
| Pagamento falhou | Webhook `invoice.payment_failed` | P1 |

Templates HTML simples com branding FigurinhasPro. NAO overengineer — email de texto com 1-2 links e suficiente para o MVP.

**Entregavel Sprint 4:** Planos enforced, emails transacionais funcionando, upgrade flow completo.

---

### SPRINT 5 — Polimento e Growth (iterativo)
**Duracao: continuo | Prioridade: MEDIA**
**Objetivo: Melhorar retencao e aquisicao com base em dados reais**

Estas tasks devem ser priorizadas com base no feedback real dos usuarios do Sprint 2-4. A ordem abaixo e sugestao — o feedback dos sellers deve guiar a priorizacao.

#### 5.1 Performance

| Task | Impacto | Esforco |
|------|---------|---------|
| Ativar otimizacao de imagens (remover `unoptimized: true`) | Alto — figurinhas sao o core | Baixo |
| `'use cache'` nas paginas de catalogo/vitrine | Medio — menos carga no DB | Baixo |
| Paginar pedidos e inventario nas APIs | Medio — evita timeout com muito dado | Baixo |
| Quebrar `albums-data.ts` em chunks por Copa | Medio — bundle menor | Medio |

#### 5.2 UX do vendedor

| Task | Impacto | Esforco |
|------|---------|---------|
| Import CSV de estoque | Alto — vendedores usam Excel | Medio |
| Busca/filtro nos pedidos (status, data, nome) | Medio | Baixo |
| Edicao de perfil (nome, WhatsApp, logo) | Medio | Baixo |
| Upload de logo (Vercel Blob) | Baixo — cosmetico | Baixo |

#### 5.3 UX do comprador

| Task | Impacto | Esforco |
|------|---------|---------|
| Busca por codigo/nome na vitrine | Alto — figurinha especifica | Baixo |
| "Lista de procura" (cola codigos, ve disponiveis) | Alto — killer feature | Medio |
| Lembrar dados do comprador (localStorage) | Baixo — conveniencia | Baixo |
| QR Code da vitrine para imprimir | Medio — marketing offline | Baixo |
| Compartilhar vitrine (WhatsApp, copiar link) | Medio — viralidade | Baixo |

#### 5.4 Analytics do vendedor (feature Pro/Ilimitado)

| Task | Impacto | Esforco |
|------|---------|---------|
| Grafico de vendas (7/30/90 dias) com Recharts | Medio | Medio |
| Top figurinhas mais vendidas | Baixo | Baixo |
| Receita por album | Baixo | Baixo |

#### 5.5 Landing page melhorada

| Task | Impacto | Esforco |
|------|---------|---------|
| Secao "Como funciona" (3 passos) | Medio — conversao | Baixo |
| Depoimentos de early adopters reais | Alto — social proof | Baixo |
| Video/GIF do painel em acao | Alto — demonstra valor | Medio |
| FAQ accordion | Baixo | Baixo |
| Link para `/loja/demo` | Medio — prova de conceito | Baixo |

---

### SPRINT 6 — Diferencial (futuro)
**Quando: apos Product-Market Fit confirmado (>50 sellers pagantes)**

Estas features so fazem sentido se o negocio estiver funcionando.

| Feature | Descricao | Complexidade |
|---------|-----------|-------------|
| Marketplace de trocas | Vendedores trocam entre si | Alta |
| IA: deteccao por foto | Foto da pagina → identifica figurinhas faltantes | Alta |
| Notificacao push | "Figurinha X voltou ao estoque!" | Media |
| Multi-idioma | Espanhol para LATAM | Media |
| API publica | Integracao com ERPs, ML, outros sistemas | Media |
| App mobile nativo | React Native ou PWA avancado | Alta |
| Painel admin interno | Metricas do SaaS: MRR, churn, sellers ativos | Media |

---

## 4. Cronograma Realista

```
Abril 2026
┌─────────┬─────────┬─────────┬─────────┐
│ Sem 1   │ Sem 2   │ Sem 3   │ Sem 4   │
│Sprint 0 │Sprint 1 │Sprint 1 │Sprint 2 │
│Validacao │Neon+Auth│Build ok │Deploy+  │
│Pesquisa │Sentry   │Legal    │Users    │
└─────────┴─────────┴─────────┴─────────┘

Maio 2026
┌─────────┬─────────┬─────────┬─────────┐
│ Sem 1   │ Sem 2   │ Sem 3   │ Sem 4   │
│Sprint 2 │Sprint 3 │Sprint 3 │Sprint 4 │
│Copa2026 │Stripe   │Stripe   │Enforce  │
│Feedback │Checkout │Webhook  │Email    │
└─────────┴─────────┴─────────┴─────────┘

Junho 2026 — COPA DO MUNDO COMECA
┌─────────┬─────────┬─────────┬─────────┐
│ Sem 1   │ Sem 2   │ Sem 3   │ Sem 4   │
│Sprint 4 │Sprint 5 │Sprint 5 │Sprint 5 │
│Limites  │Perf+UX  │Growth   │Iterate  │
│Trial    │CSV imp  │Landing  │Data-led │
└─────────┴─────────┴─────────┴─────────┘
```

**Meta: produto monetizavel no ar antes de junho 2026 (Copa)**

---

## 5. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Ninguem quer pagar | Media | Fatal | Sprint 0 valida ANTES de construir |
| Copa 2026 album atrasa | Baixa | Alto | Preparar estrutura, adicionar dados quando disponiveis |
| Stripe webhook falha | Media | Alto | Idempotencia + retry + Sentry alertas |
| SQLite → Postgres quebra queries | Baixa | Medio | Testar TODAS as APIs no Sprint 1 |
| Early adopters nao dao feedback | Media | Medio | Contato direto via WhatsApp, nao email |
| Concorrente lanca similar | Baixa | Medio | Speed-to-market + nicho especifico |
| Seller demo abusado | Baixa | Baixo | Reset automatico ou rate limit |

---

## 6. Metricas de Sucesso (realistas)

| Metrica | Meta 30 dias | Meta 90 dias | Meta Copa |
|---------|-------------|-------------|-----------|
| Sellers registrados | 15-25 | 50-100 | 200+ |
| Sellers ativos (login/7d) | 8-15 | 25-50 | 100+ |
| Conversao Free → Pago | 5-8% | 10-15% | 15-20% |
| MRR | R$100-200 | R$500-1.500 | R$3.000+ |
| Churn mensal | < 15% | < 10% | < 8% |
| NPS | > 30 | > 40 | > 50 |

> Numeros baseados em benchmarks de SaaS nicho B2B com zero budget de marketing.
> Durante a Copa, esperar spike de 3-5x em registros organicos.

---

## 7. Decisoes Arquiteturais Tomadas

| Decisao | Alternativa descartada | Motivo |
|---------|----------------------|--------|
| `iron-session` para auth | NextAuth / Clerk | Simplicidade — auth custom ja existe, so precisa de criptografia. Migrar para Clerk seria rewrite completo |
| `@prisma/adapter-pg` | `@prisma/adapter-neon` | FigurinhasPro usa Prisma 7 (como P6). `adapter-pg` e o padrao para Prisma 7, nao precisa de `@neondatabase/serverless` |
| Sentry para monitoramento | Vercel Analytics | Sentry captura erros server-side (APIs, webhooks). Vercel Analytics e mais para performance frontend |
| Resend para email | SendGrid / Nodemailer | Free tier generoso, API simples, integracao Vercel nativa |
| Stripe para pagamentos | MercadoPago | Stripe tem melhor DX, Customer Portal pronto, documentacao superior. MercadoPago pode ser adicionado depois como alternativa |
| Trial sem cartao | Trial com cartao | Reduz friccao — mais sellers experimentam. Risco de churn compensado pelo volume |

---

## 8. Checklist de Go-Live (Sprint 2)

**Infraestrutura:**
- [ ] Banco Neon criado e conectado
- [ ] Todas as APIs testadas contra Postgres
- [ ] `ignoreBuildErrors` removido, build passa limpo
- [ ] Sentry configurado e testando
- [ ] Env vars na Vercel (Neon, Session Secret, Sentry DSN)

**Seguranca:**
- [ ] Senhas hasheadas com bcrypt
- [ ] Cookies criptografados com iron-session
- [ ] Rate limiting nas rotas criticas
- [ ] SESSION_SECRET gerado e configurado

**Legal:**
- [ ] Pagina de termos de uso
- [ ] Pagina de politica de privacidade
- [ ] Checkbox no registro

**Conteudo:**
- [ ] Seller demo criado com estoque preenchido
- [ ] Meta tags SEO nas paginas dinamicas
- [ ] Paginas de erro (404, error) personalizadas

**Deploy:**
- [ ] Deploy Vercel com dominio customizado
- [ ] SSL ativo
- [ ] Teste end-to-end: registro → login → estoque → vitrine → pedido

---

## 9. Checklist de Monetizacao (Sprint 3-4)

- [ ] Stripe configurado (test mode primeiro)
- [ ] Produtos e precos criados no Stripe
- [ ] Checkout Session funcional
- [ ] Webhook recebendo e processando eventos
- [ ] Customer Portal acessivel
- [ ] Trial de 14 dias ativo no registro
- [ ] Limites de plano verificados nas APIs
- [ ] UI de upgrade quando atinge limite
- [ ] Badge de uso no sidebar
- [ ] Email de boas-vindas enviando
- [ ] Email de novo pedido enviando
- [ ] Stripe em modo producao
- [ ] Teste completo: registro → trial → upgrade → uso → downgrade

---

*Documento vivo. Atualizar conforme Sprints avancem.*
*Executar cada Sprint com `/plan` → `/develop` → `/review` conforme regras XP.*
