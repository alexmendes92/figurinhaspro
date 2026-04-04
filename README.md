# FigurinhasPro

> Plataforma SaaS para revendedores de figurinhas avulsas. Estoque visual, precos customizados, vitrine online, orcamentos via WhatsApp e 13 Copas do Mundo catalogadas (7.122 figurinhas).

**Producao:** https://album-digital-ashen.vercel.app

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| Frontend | React 19.2 + TypeScript 5 |
| Estilizacao | Tailwind CSS 4 (CSS-first, dark mode) |
| Banco de dados | Neon Postgres via `@prisma/adapter-neon` (WebSocket Pool) |
| ORM | Prisma 7.5 com `prisma.config.ts` centralizado |
| Autenticacao | iron-session 8 (cookies criptografados) + bcryptjs 3 (hash) |
| Pagamentos | Stripe SDK 22 (checkout, webhooks, customer portal) |
| Validacao | Zod 4.3 |
| Imagens | Sharp 0.34 |
| Compilador | React Compiler (babel-plugin-react-compiler) |
| Fonts | Geist Sans + Geist Mono |

## Estrutura

```
FigurinhasPro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx         → Tela de login
│   │   └── registro/page.tsx      → Tela de registro
│   ├── albuns/
│   │   ├── page.tsx               → Lista de albums
│   │   └── [year]/
│   │       ├── page.tsx           → Album por ano
│   │       └── album-viewer.tsx   → Viewer interativo
│   ├── loja/
│   │   └── [slug]/
│   │       ├── page.tsx           → Vitrine do vendedor
│   │       └── [albumSlug]/page.tsx → Album na vitrine
│   ├── painel/
│   │   ├── layout.tsx             → Layout com sidebar + bottom nav
│   │   ├── loading.tsx            → Skeleton loader do painel
│   │   ├── page.tsx               → Dashboard (metricas)
│   │   ├── estoque/
│   │   │   ├── page.tsx           → Selecao de album
│   │   │   └── [albumSlug]/page.tsx → Gestao de estoque por album
│   │   ├── precos/page.tsx        → Gestao de precos (server/client split)
│   │   ├── pedidos/page.tsx       → Gestao de pedidos
│   │   ├── loja/page.tsx          → Configuracao da loja
│   │   └── planos/page.tsx        → Planos e assinatura
│   ├── onboarding/page.tsx        → Wizard pos-registro
│   ├── termos/page.tsx            → Termos de uso
│   ├── privacidade/page.tsx       → Politica de privacidade
│   ├── teste/page.tsx             → Pagina de testes (dev)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts     → POST login (bcrypt compare)
│   │   │   ├── logout/route.ts    → POST logout (destroy session)
│   │   │   └── register/route.ts  → POST registro (bcrypt hash)
│   │   ├── inventory/
│   │   │   ├── route.ts           → GET/POST estoque
│   │   │   └── bulk/route.ts      → POST bulk update
│   │   ├── orders/
│   │   │   ├── route.ts           → GET/POST pedidos
│   │   │   └── [id]/route.ts      → PATCH status do pedido
│   │   ├── prices/route.ts        → GET/POST regras de preco
│   │   ├── seller/route.ts        → GET/PATCH dados do vendedor
│   │   └── stripe/
│   │       ├── checkout/route.ts  → POST criar checkout session
│   │       ├── webhook/route.ts   → POST webhook events
│   │       └── portal/route.ts    → POST customer portal
│   ├── error.tsx                  → Erro generico
│   ├── not-found.tsx              → 404 personalizado
│   ├── loading.tsx                → Loading global
│   ├── layout.tsx                 → Layout raiz (providers, viewport, SEO)
│   └── page.tsx                   → Landing page (hero, pricing, features)
│
├── components/
│   ├── album-shelf.tsx            → Prateleira de albums
│   ├── album-viewer.tsx           → Viewer de album (paginas)
│   ├── app-shell.tsx              → Shell da aplicacao
│   ├── cart-drawer.tsx            → Carrinho lateral (responsive)
│   ├── sticker-panel.tsx          → Painel de figurinhas (filtros por tipo)
│   ├── toast.tsx                  → Sistema de notificacoes
│   ├── loja/
│   │   └── store-album-view.tsx   → Vitrine de album (comprador)
│   └── painel/
│       ├── painel-shell.tsx       → Shell do painel (sidebar + bottom nav)
│       ├── inventory-manager.tsx  → Gestor de estoque
│       ├── precos-editor.tsx      → Editor de precos
│       ├── loja-editor.tsx        → Editor da loja
│       └── copy-link-button.tsx   → Botao copiar link
│
├── lib/
│   ├── db.ts                      → Conexao Prisma/Neon (Lazy Proxy)
│   ├── auth.ts                    → iron-session + getSession/createSession/destroySession
│   ├── plan-limits.ts             → Limites por plano + guards
│   ├── sticker-types.ts           → Config centralizada tipos figurinha
│   ├── stripe.ts                  → Cliente Stripe
│   ├── albums.ts                  → Catalogo de albums (~1.4MB server-only)
│   ├── albums-data.ts             → Dados raw dos albums
│   ├── album-covers.ts            → URLs das capas
│   ├── page-sticker-map.ts        → Mapeamento figurinha-pagina
│   ├── cart-context.tsx           → Context do carrinho (client)
│   └── toast-context.tsx          → Context de notificacoes (client)
│
├── prisma/
│   └── schema.prisma              → Seller, Inventory, Order, PriceRule, SubscriptionEvent
├── prisma.config.ts               → Config Prisma 7 centralizada
├── next.config.ts                 → Config Next.js 16
├── CLAUDE.md                      → Instrucoes para agentes IA
├── AGENTS.md                      → Breaking changes e guia tecnico
├── PLANO_MELHORIA_SAAS.md         → Plano SaaS v1 (referencia)
├── PLANO_SAAS_V2.md               → Plano SaaS v2 (ativo)
└── public/                        → Assets estaticos
```

## Setup Local

```bash
npm install

# Configurar .env.local:
# DATABASE_URL=postgresql://...  (Neon connection string)
# SESSION_SECRET=...             (32+ chars, gerar com: openssl rand -hex 32)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

npm run dev   # http://localhost:3009
```

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Dev server Turbopack (porta 3009) |
| `npm run build` | Build producao (`prisma generate && next build`) |
| `npm run start` | Inicia producao |
| `npm run lint` | ESLint |
| `vercel deploy --prod` | Deploy producao (obrigatorio apos push) |

## Deploy

```bash
# Workflow obrigatorio apos cada alteracao:
git add <arquivos>
git commit -m "tipo(escopo): descricao"
git push
vercel deploy --prod
```

## Funcionalidades

### Vendedor (Painel)
- **Dashboard**: Metricas de figurinhas, pedidos, faturamento
- **Estoque**: Grid visual com edicao por figurinha, filtros, bulk update
- **Precos**: Preco global por tipo (Normal/Especial/Brilhante) + regras por album
- **Pedidos**: Workflow completo (QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED → CANCELLED)
- **Loja**: Configuracao da vitrine publica
- **Planos**: Visualizacao do plano atual (FREE/PRO/UNLIMITED)

### Comprador (Vitrine)
- **Vitrine publica**: `/loja/[slug]` — catalogo do vendedor
- **Carrinho**: Drawer lateral responsive com precos por tipo
- **Album viewer**: Navegacao interativa pelas paginas do album
- **WhatsApp**: Link formatado para orcamento

### Catalogo
- 13 Copas do Mundo (1970-2022) com 7.122 figurinhas mapeadas
- 3 tipos: Normal (R$2,50), Especial/Foil (R$5,00), Brilhante/Shiny (R$4,00)
- Preco customizavel por vendedor (global e por album)

### Infraestrutura
- Auth com cookies criptografados (iron-session) + senhas hasheadas (bcrypt)
- Stripe para checkout, webhooks e customer portal
- SEO: meta tags, OpenGraph, Twitter cards
- Mobile-first: viewport cover, safe-area, bottom nav, touch targets 44px+
- Error pages: 404, error generico, loading states
- Legal: termos de uso e politica de privacidade

## Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string Neon Postgres |
| `SESSION_SECRET` | Sim (prod) | Chave 32+ chars para iron-session |
| `STRIPE_SECRET_KEY` | Para pagamentos | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Para pagamentos | Secret do webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Para pagamentos | Chave publica Stripe |

## Hospedagem

- **Plataforma**: Vercel
- **Banco**: Neon Postgres (free tier)
- **URL**: https://album-digital-ashen.vercel.app
- **Build**: `prisma generate && next build`
- **Env vars**: Configuradas no painel Vercel

## Notas Tecnicas

- **Next.js 16**: APIs assincronas (`await params`, `await cookies()`), `proxy.ts` substitui `middleware.ts`, Turbopack default
- **Prisma 7**: Config em `prisma.config.ts`, driver adapter `PrismaNeon` (WebSocket Pool), `.env` NAO carrega automaticamente
- **Tailwind CSS 4**: Config via CSS (`@theme inline` em `globals.css`), sem `tailwind.config.js`
- **Zod 4**: Reescrita completa — APIs podem diferir do Zod 3
- **React Compiler**: Ativado — `useMemo`/`useCallback`/`React.memo` desnecessarios
- **Sticker Types**: Centralizados em `lib/sticker-types.ts` — valores internos (`regular`/`foil`/`shiny`) nunca mudam, apenas labels visiveis
- **`albums.ts`**: ~1.4MB, server-only — NUNCA importar em client components (causa bundle bloat)
