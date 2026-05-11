---
data: 2026-05-11
tipo: snapshot
projeto: P8-FigurinhasPro
versao: 0.1.0
gerado-por: /p8-master:p8-snapshot
secoes: 6
---

# FigurinhasPro — Snapshot do Produto

**Gerado:** 2026-05-11 20:02 (regen via fan-out paralelo — 2 streams Sonnet)
**Branch:** `prototype/modal-roi` (estado dirty)
**URL produção:** https://album-digital-ashen.vercel.app
**Backup anterior:** [`product-snapshot.bak.2026-05-11.md`](product-snapshot.bak.2026-05-11.md)

---

## 1. Modelo de Negócio

### Tipo de produto

FigurinhasPro é um SaaS B2B vertical direcionado a revendedores de figurinhas avulsas (colecionadores e lojistas que comercializam figurinhas Panini por unidade). O produto substitui o fluxo improvisado de planilha + WhatsApp + memória por uma infraestrutura de vendas profissional: estoque visual, vitrine pública, carrinho de orçamento, precificação flexível e painel de pedidos.

### Planos e preços

Valores lidos diretamente de `src/lib/stripe.ts` (constante `PLANS`):

| Chave | Nome comercial | Preço mensal | Stripe Price ID |
|-------|---------------|-------------|-----------------|
| `FREE` | Starter | R$ 0,00 | — (sem cobrança) |
| `PRO` | Pro | R$ 29,00 | `STRIPE_PRICE_PRO` (env var) |
| `UNLIMITED` | Ilimitado | R$ 59,00 | `STRIPE_PRICE_UNLIMITED` (env var) |

Limites por plano conforme `src/lib/plan-limits.ts`:

| Recurso | FREE (Starter) | PRO | UNLIMITED |
|---------|---------------|-----|-----------|
| Figurinhas no estoque | 100 | 1.000 | Ilimitado |
| Pedidos por mês | 10 | 100 | Ilimitado |
| Álbuns ativos | 1 | 13 | 13 |
| Features extras | `basic_store` | + `whatsapp`, `custom_prices` | + `reports`, `priority_support` |

### Status dos gates de plano

**Desabilitados em produção.** As funções `checkStickerLimit`, `checkOrderLimit`, `checkAlbumLimit` e `hasFeature` estão implementadas e corretas em `src/lib/plan-limits.ts`, mas os pontos de chamada no código têm os gates temporariamente liberados (todos retornam `true`). O TODO de restaurar está documentado no `PLANO_SAAS_V2.md` como pendência crítica. Enquanto isso, todos os vendedores operam como UNLIMITED independente do plano contratado.

### Catálogo Panini

O arquivo `src/lib/albums.ts` é o monolito de 44.781 linhas que serve como fonte canônica de nomes e códigos Panini. Segundo o `PLANO_SAAS_V2.md`, o catálogo cobre 13 edições de Copa do Mundo com 7.122 figurinhas cadastradas — figurinhas dos tipos Regular (`regular`), Especial (`foil`) e Brilhante (`shiny`), conforme `src/lib/sticker-types.ts`.

### Janela Copa 2026

Em 2026-05-11 (hoje), o álbum oficial da Copa do Mundo 2026 estava em pré-venda com envio previsto para a segunda quinzena de maio de 2026 e Copa iniciando em junho/2026 — aproximadamente 3 a 4 semanas de janela. O `DOCUMENTACAO_NEGOCIO_MONETIZACAO.md` (datado de 2026-04-05) já antecipava que "o melhor momento para vender esse SaaS é agora, antes do pico operacional da Copa 2026". O produto precisa estar com Stripe ativo, gates de plano habilitados e email transacional operacional antes do pico de demanda.

### Modelos de receita

- **Mensalidade recorrente** (modelo primário): R$ 29/mês (Pro) e R$ 59/mês (Ilimitado) via Stripe Checkout + portal de assinaturas.
- **Comissão sobre transações** (mencionada no plano como possibilidade futura, não implementada): participação percentual no faturamento dos pedidos do vendedor. Não há código ou modelo de dados para isso hoje.
- **Plano gratuito com limitações** como funil de conversão (FREE → PRO → UNLIMITED).

### Cockpit comercial

Módulo admin-only em `/painel/comercial`, acessível apenas pelo email definido em `ADMIN_EMAIL` (env var em produção). Contém CRM de leads, gestão de ofertas, experimentos de growth, kanban de iniciativas, KPIs com histórico e checklist de tarefas. É uma ferramenta interna de operação comercial do próprio FigurinhasPro — não visível a vendedores.

---

## 2. Entidades (Schema Prisma)

O schema (`prisma/schema.prisma`) contém 18 modelos agrupados em três camadas funcionais.

### Núcleo operacional

| Modelo | Função | Campos-chave | Relações |
|--------|--------|-------------|----------|
| `Seller` | Vendedor cadastrado na plataforma — é o tenant central do sistema | `email`, `shopSlug` (único), `plan`, `stripeCustomerId`, `onboardingStep` | 1:N com Inventory, Order, PriceRule, SectionPriceRule, QuantityTier, SubscriptionEvent, CustomAlbum |
| `CustomAlbum` | Álbum personalizado criado pelo vendedor (além do catálogo estático) | `slug`, `title`, `year`, `stickers` (JSON `[{code, name, type}]`) | N:1 Seller; slug usa prefixo `custom_` para não colidir com álbuns estáticos |
| `Inventory` | Estoque por figurinha de um vendedor em um álbum | `albumSlug`, `stickerCode`, `quantity`, `customPrice` | N:1 Seller; unique em `(sellerId, albumSlug, stickerCode)` |
| `Order` | Pedido de compra — ciclo completo QUOTE→CONFIRMED→PAID→SHIPPED→DELIVERED→CANCELLED | `customerName`, `customerPhone`, `status`, `totalPrice`, `channel` | N:1 Seller; 1:N OrderItem |
| `OrderItem` | Linha de um pedido — figurinha com quantidade e preço unitário capturado | `albumSlug`, `stickerCode`, `stickerName`, `quantity`, `unitPrice` | N:1 Order |
| `SubscriptionEvent` | Log imutável de eventos Stripe (webhook) | `type`, `stripeEventId` (único), `data` (JSON raw) | N:1 Seller |

### Preços — 3 eixos

A hierarquia de resolução é `customPrice individual > SectionPriceRule > PriceRule por album > PriceRule global > preço padrão`. Implementada em `src/lib/price-resolver.ts`.

| Modelo | Eixo | Função | Campos-chave | Unique |
|--------|------|--------|-------------|--------|
| `PriceRule` | Por tipo | Preço base por tipo de figurinha (global ou por álbum específico) | `stickerType`, `price`, `albumSlug?` (null = global) | `(sellerId, albumSlug, stickerType)` |
| `SectionPriceRule` | Por seção | Ajuste de preço por seção/país dentro de um álbum — `FLAT` (absoluto) ou `OFFSET` (+/- sobre base) | `albumSlug`, `sectionName`, `adjustType`, `value` | `(sellerId, albumSlug, sectionName)` |
| `QuantityTier` | Por volume | Desconto percentual progressivo conforme quantidade total no carrinho | `albumSlug`, `minQuantity`, `discount` (percentual, ex: 10 = 10% off) | `(sellerId, albumSlug, minQuantity)` |

### Cockpit Comercial

| Modelo | Função | Campos-chave | Relações |
|--------|--------|-------------|----------|
| `BizLead` | Lead comercial no pipeline de vendas do SaaS | `name`, `stage` (PROSPECT→WON/LOST), `source`, `potentialValue`, `priority`, `convertedSellerId` | 1:N BizActivity, BizTask |
| `BizActivity` | Log de atividades de contato por lead (CALL, WHATSAPP, EMAIL, MEETING, DEMO, NOTE) | `type`, `channel`, `summary`, `result` | N:1 BizLead (opcional) |
| `BizOffer` | Oferta comercial do SaaS — planos, pacotes, promoções | `name`, `price`, `priceType` (ONE_TIME/MONTHLY/ANNUAL/PACKAGE), `status`, `salesCount`, `revenue` | — |
| `BizExperiment` | Experimento de growth — hipótese, canal, resultado, aprendizado | `hypothesis`, `status` (PLANNED→RUNNING→COMPLETED/KILLED), `expectedResult`, `actualResult`, `learning` | 1:N BizTask |
| `BizInitiative` | Iniciativa estratégica — kanban com 4 fases | `title`, `category`, `phase` (BACKLOG→PLANNED→IN_PROGRESS→DONE), `impact`, `effort`, `sortOrder` | 1:N BizMilestone, BizTask |
| `BizMilestone` | Marco de uma iniciativa — data alvo e status | `title`, `targetDate`, `completedAt`, `status` (PENDING/DONE) | N:1 BizInitiative |
| `BizTask` | Tarefa operacional vinculável a lead, iniciativa ou experimento | `title`, `priority`, `status` (TODO→DONE), `deadline` | N:1 BizLead?, BizInitiative?, BizExperiment? |
| `BizKpi` | Definição de KPI — nome único, categoria, unidade, meta | `name` (único), `category`, `unit`, `baseline`, `target` | 1:N BizKpiSnapshot |
| `BizKpiSnapshot` | Snapshot histórico do valor de um KPI | `value`, `note`, `recordedAt` | N:1 BizKpi; indexado em `(kpiId, recordedAt)` |

---

## 3. Stack Técnico

### Versões Exatas (package.json — 2026-05-11)

| Lib | Versão declarada |
|-----|-----------------|
| Next.js | ^16.2.4 |
| React | ^19.2.5 |
| react-dom | ^19.2.5 |
| Prisma (CLI + Client) | ^7.7.0 |
| @prisma/adapter-neon | ^7.6.0 |
| @prisma/adapter-better-sqlite3 | ^7.5.0 |
| Tailwind CSS | ^4 |
| @tailwindcss/postcss | ^4 |
| Zod | ^4.3.6 |
| iron-session | ^8.0.4 |
| bcryptjs | ^3.0.3 |
| Stripe | ^22.0.2 |
| Sharp | ^0.34.5 |
| @sentry/nextjs | ^10.49.0 |
| Vitest | ^4.1.4 |
| @biomejs/biome | ^2.4.12 |
| TypeScript | ^5 |
| @vercel/analytics | ^2.0.1 |
| @vercel/speed-insights | ^2.0.0 |
| lucide-react | ^1.8.0 |
| @radix-ui/react-slot | ^1.2.4 |

### Breaking Changes Críticos

**Next.js 16**
- APIs de request são assíncronas: `await params`, `await cookies()`, `await headers()`, `await searchParams`, `await draftMode()`. Acesso síncrono foi removido.
- `proxy.ts` substitui `middleware.ts` (runtime Node.js, não Edge). Este projeto não usa proxy atualmente.
- Config do Turbopack é top-level (`turbopack: {}`) — não mais dentro de `experimental`.
- Cache components via diretiva `'use cache'` substitui PPR.

**Prisma 7**
- Driver adapter explícito obrigatório. Este projeto usa `PrismaNeon` (WebSocket Pool) em produção e `@prisma/adapter-better-sqlite3` em dev.
- `prisma.config.ts` centraliza toda configuração; `.env` não carrega automaticamente — requer `import "dotenv/config"`.
- Flags `--schema` e `--url` foram removidos dos comandos CLI.
- Generator provider novo: `"prisma-client"` com output em `src/generated/prisma/`.

**Tailwind CSS 4**
- Não existe `tailwind.config.js` nem `tailwind.config.ts`. Configuração é CSS-first via `@theme` em `globals.css`.
- Plugin PostCSS é `@tailwindcss/postcss`, não `tailwindcss`.

**React 19**
- React Compiler ativo via `babel-plugin-react-compiler` + `reactCompiler: true` no `next.config.ts`.
- `useMemo`, `useCallback` e `React.memo` são desnecessários — o compiler otimiza automaticamente.

**Zod 4**
- Reescrita completa do zero. Performance 2-7x superior ao Zod 3.
- `z.interface()` disponível além de `z.object()`.
- Mensagens de erro reestruturadas; APIs do Zod 3 podem não existir ou ter assinatura diferente.

---

## 4. Custom Events

### Webhooks Stripe — `POST /api/stripe/webhook`

Eventos tratados:
- `checkout.session.completed` — confirma assinatura, atualiza plano do `Seller`, registra em `SubscriptionEvent`
- `checkout.session.expired` — descarta sessão pendente
- `customer.subscription.updated` / `customer.subscription.deleted` — sincroniza status de plano
- Validação de assinatura via `stripe.webhooks.constructEvent()` com `STRIPE_WEBHOOK_SECRET`
- Todos os eventos são persistidos como log no modelo `SubscriptionEvent`

### Server Actions do Cockpit — `src/app/painel/comercial/actions.ts`

Todas as actions têm guard `requireCockpitAdmin()` no início. Total: 17 actions exportadas.

| Action | Domínio | Descrição resumida |
|--------|---------|--------------------|
| `createLead` | Leads | Cria novo lead no pipeline |
| `updateLeadStage` | Leads | Muda estágio do lead (PROSPECT→WON/LOST); atualiza `lastContactAt` em CONTACT e NEGOTIATION |
| `updateLead` | Leads | Edita `nextStep`, `objections`, `notes`, `lostReason` |
| `addActivity` | Leads | Registra atividade (CALL/WHATSAPP/EMAIL/MEETING/DEMO/NOTE) e atualiza `lastContactAt` do lead |
| `createTask` | Tarefas | Cria tarefa com prazo, prioridade e vínculo opcional a lead/iniciativa/experimento |
| `toggleTask` | Tarefas | Alterna status TODO↔DONE com timestamp `completedAt` |
| `updateTaskStatus` | Tarefas | Define status arbitrário com gestão de `completedAt` |
| `createOffer` | Ofertas | Cria oferta com preço, tipo (ONE_TIME/MONTHLY/ANNUAL/PACKAGE) e validade |
| `toggleOfferStatus` | Ofertas | Alterna ACTIVE↔PAUSED |
| `createExperiment` | Experimentos | Cria experimento com hipótese, canal, esforço, custo esperado |
| `updateExperimentStatus` | Experimentos | Avança status (PLANNED→RUNNING→COMPLETED/KILLED) com timestamps automáticos |
| `saveExperimentResult` | Experimentos | Persiste `actualResult`, `learning`, `decision` |
| `createInitiative` | Iniciativas | Cria iniciativa com categoria, impacto, esforço, owner |
| `updateInitiativePhase` | Iniciativas | Move iniciativa entre fases (BACKLOG→PLANNED→IN_PROGRESS→DONE) |
| `addKpiSnapshot` | KPIs | Registra snapshot de valor de KPI com nota |

### Seed Idempotente — `POST /api/comercial/seed`

- Popula dados iniciais do cockpit (leads, ofertas, KPIs de exemplo)
- Idempotente: reexecutar não duplica registros
- Disponível apenas para admin autenticado

### Dev Auto-Login — `POST /api/dev/auto-login`

- Permite bootstrap de sessão iron-session em ambientes preview/dev sem digitar senha
- Triple-guard de segurança:
  1. `VERCEL_ENV !== "production"` — retorna 404 em produção
  2. `DEV_AUTO_LOGIN_TOKEN` com 32+ caracteres deve estar configurado
  3. Query param `?token=` deve bater com o token configurado
- Usado pela skill `p8-master:p8-auth` para automação de testes de UI

---

## 5. Páginas e Rotas

### Páginas Públicas (sem autenticação)

| Rota | Arquivo |
|------|---------|
| `/` | `src/app/page.tsx` |
| `/loja/[slug]` | `src/app/loja/[slug]/page.tsx` |
| `/loja/[slug]/[albumSlug]` | `src/app/loja/[slug]/[albumSlug]/page.tsx` |
| `/albuns` | `src/app/albuns/page.tsx` |
| `/albuns/[year]` | `src/app/albuns/[year]/page.tsx` |
| `/(auth)/login` | `src/app/(auth)/login/page.tsx` |
| `/(auth)/registro` | `src/app/(auth)/registro/page.tsx` |
| `/(auth)/esqueci-senha` | `src/app/(auth)/esqueci-senha/page.tsx` |
| `/(auth)/reset-senha` | `src/app/(auth)/reset-senha/page.tsx` |
| `/(auth)/verificar-email` | `src/app/(auth)/verificar-email/page.tsx` |
| `/termos` | `src/app/termos/page.tsx` |
| `/privacidade` | `src/app/privacidade/page.tsx` |

### Páginas Autenticadas — Vendedor

| Rota | Arquivo |
|------|---------|
| `/onboarding` | `src/app/onboarding/page.tsx` |
| `/painel` | `src/app/painel/page.tsx` |
| `/painel/loja` | `src/app/painel/loja/page.tsx` |
| `/painel/estoque` | `src/app/painel/estoque/page.tsx` |
| `/painel/estoque/novo` | `src/app/painel/estoque/novo/page.tsx` |
| `/painel/estoque/[albumSlug]` | `src/app/painel/estoque/[albumSlug]/page.tsx` |
| `/painel/precos` | `src/app/painel/precos/page.tsx` |
| `/painel/precos/[albumSlug]` | `src/app/painel/precos/[albumSlug]/page.tsx` |
| `/painel/pedidos` | `src/app/painel/pedidos/page.tsx` |
| `/painel/planos` | `src/app/painel/planos/page.tsx` |

### Páginas Admin-Only (gate `ADMIN_EMAIL`)

| Rota | Arquivo |
|------|---------|
| `/painel/admin/revendedores` | `src/app/painel/admin/revendedores/page.tsx` |
| `/painel/admin/revendedores/[id]` | `src/app/painel/admin/revendedores/[id]/page.tsx` |
| `/painel/comercial` | `src/app/painel/comercial/page.tsx` |
| `/painel/comercial/leads` | `src/app/painel/comercial/leads/page.tsx` |
| `/painel/comercial/leads/[id]` | `src/app/painel/comercial/leads/[id]/page.tsx` |
| `/painel/comercial/ofertas` | `src/app/painel/comercial/ofertas/page.tsx` |
| `/painel/comercial/experimentos` | `src/app/painel/comercial/experimentos/page.tsx` |
| `/painel/comercial/iniciativas` | `src/app/painel/comercial/iniciativas/page.tsx` |
| `/painel/comercial/tarefas` | `src/app/painel/comercial/tarefas/page.tsx` |
| `/painel/comercial/kpis` | `src/app/painel/comercial/kpis/page.tsx` |

### Protótipos (branch prototype/modal-roi)

| Rota | Arquivo |
|------|---------|
| `/proto/modal-roi` | `src/app/proto/modal-roi/page.tsx` |
| `/proto/modal-roi/[variant]` | `src/app/proto/modal-roi/[variant]/page.tsx` |
| `/proto/modal-roi/galeria` | `src/app/proto/modal-roi/galeria/page.tsx` |
| `/teste` | `src/app/teste/page.tsx` |

### APIs REST por Namespace

| Namespace | Rotas | Métodos |
|-----------|-------|---------|
| `/api/auth/*` | `/login`, `/logout`, `/register`, `/forgot-password`, `/reset-password` | POST |
| `/api/seller` | `/api/seller` | GET, PUT |
| `/api/albums/*` | `/api/albums`, `/api/albums/[id]`, `/api/albums/covers` | GET, POST, PUT, DELETE |
| `/api/inventory/*` | `/api/inventory`, `/api/inventory/bulk`, `/api/inventory/setup` | GET, POST, PUT, DELETE |
| `/api/prices/*` | `/api/prices`, `/api/prices/[albumSlug]`, `/api/prices/sections`, `/api/prices/tiers` | GET, POST, PUT, DELETE |
| `/api/orders/*` | `/api/orders`, `/api/orders/[id]` | GET, POST, PUT |
| `/api/stripe/*` | `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/portal` | POST |
| `/api/bot/*` | `/api/bot/stickers`, `/api/bot/quote`, `/api/bot/quote/[ref]` | GET, POST |
| `/api/comercial/seed` | `/api/comercial/seed` | POST |
| `/api/dev/auto-login` | `/api/dev/auto-login` | POST |

---

## 6. Design

### Tokens de Design — Tailwind 4 CSS-First (`globals.css`)

**Paleta de cores**

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-accent-500` | `#f59e0b` | Laranja Panini — CTA primário |
| `--color-accent-400` | `#fbbf24` | Hover de CTA, `--color-accent` semântico |
| `--color-surface-0` | `#0b0e14` | Background root |
| `--color-surface-1` | `#111318` | Cards |
| `--color-surface-2` | `#161921` | Card hover |
| `--color-surface-3` | `#1f2937` | Divisores fortes, scrollbar |
| `--color-foreground` | `#e8eaed` | Texto principal |
| `--color-muted` | `#9ca3af` | Texto secundário |
| `--color-muted-foreground` | `#6b7280` | Texto terciário / placeholders |
| `--color-success-400` | `#34d399` | Estados de sucesso |
| `--color-danger-400` | `#f87171` | Estados de erro |
| `--color-info-400` | `#60a5fa` | Estados informativos |
| `--color-border` | `rgba(255,255,255,0.06)` | Bordas padrão |
| `--color-border-hover` | `rgba(255,255,255,0.12)` | Bordas em hover |

**Escala tipográfica**

| Token | Tamanho | Line-height | Weight | Uso |
|-------|---------|-------------|--------|-----|
| `display` | 3rem (48px) | 1.1 | 700 | Heros, landing |
| `h1` | 2.25rem (36px) | 1.2 | 700 | Títulos de página |
| `h2` | 1.5rem (24px) | 1.3 | 600 | Títulos de seção |
| `h3` | 1.125rem (18px) | 1.4 | 600 | Títulos de card, sub-seção |
| `body` | 0.875rem (14px) | 1.5 | 400 | Corpo padrão |
| `small` | 0.75rem (12px) | 1.4 | 400 | Labels, metadados |
| `tiny` | 0.6875rem (11px) | 1.3 | 500 | Badges, contadores |

**Spacing**
- Base: `--spacing: 0.25rem` (4px). Toda a escala Tailwind deriva daqui. `p-1 = 4px`, `p-4 = 16px`, `gap-8 = 32px`.

### Mobile-First

- `viewportFit: "cover"` + `safe-area-inset-bottom` via utility `.safe-area-bottom`
- Bottom nav no painel (`/painel/*`) para navegação mobile
- Touch targets mínimos de 44px em elementos interativos
- Cursor pointer restaurado via CSS global para botões (Tailwind 4 removeu o default)
- `prefers-reduced-motion` respeita preferência do SO: anima com `0.01ms`

### Tipografia

- `Geist Sans` e `Geist Mono` via `next/font` — injetados como variáveis CSS `--font-geist-sans` e `--font-geist-mono`
- Referenciados nos tokens `--font-sans` e `--font-mono`

### Dark Mode

- Dark mode é o único modo implementado. Não há light mode em produção.
- Background root `#0b0e14`, sem toggle de tema.

### Componentes

**Primitivos em `src/components/ui/`**

| Componente | Descrição |
|------------|-----------|
| `phone-input` | Input de telefone com seletor de DDI |
| `empty-state` | Estado vazio reutilizável com ícone, título e CTA opcional |
| `confirm-dialog` | Dialog de confirmação destrutiva |
| `button` (shadcn/ui) | Button base via `@radix-ui/react-slot` + `class-variance-authority` |

**Componentes de domínio (por pasta)**

| Pasta | Conteúdo |
|-------|----------|
| `src/components/auth/` | Formulários de login, registro, recuperação de senha |
| `src/components/loja/` | Carrinho, card de figurinha, filtros, importação de lista faltante |
| `src/components/painel/` | Dashboard, gestão de estoque, preços, pedidos, configuração de loja |
| `src/components/painel/comercial/` | CRM pipeline, tabs de navegação, cards de leads/ofertas/KPIs |
| `src/components/painel/inventory/` | `sticker-card` (novo, não commitado ainda) |
| `src/components/album-cover-upload.tsx` | Upload de capa de álbum (usa R2/S3) |

**Classes CSS legadas em `globals.css`**
- `.btn-primary` — gradiente laranja Panini (#f59e0b → #d97706), texto preto, border-radius 12px
- `.btn-ghost` — transparente com borda sutil, texto `#9ca3af`
- `.badge`, `.badge-{zinc,blue,green,amber,red}` — badges com background translúcido e borda colorida
- `.focus-ring` — utility de acessibilidade com `ring-2 ring-accent ring-offset-2`
- Anotação inline no arquivo: botões legados serão substituídos por shadcn Button em Fase 2.7

---

## Sumário Executivo

FigurinhasPro é um SaaS B2B vertical para revendedores de figurinhas Panini avulsas — substitui planilha e WhatsApp improvisado por vitrine pública, controle de estoque visual, precificação em 3 eixos e gestão de pedidos, rodando sobre Next.js 16 + Prisma 7 + Neon Postgres + Stripe, hospedado na Vercel. O produto tem catálogo canônico de 7.122 figurinhas em 13 edições Copa do Mundo (44.781 linhas em `albums.ts`) e planos mensais de R$ 29 (Pro) e R$ 59 (Ilimitado), com billing via Stripe integrado porém ainda não testado end-to-end em produção. A janela crítica é agora: em 2026-05-11 o álbum oficial da Copa 2026 está em pré-venda com envio previsto para a segunda quinzena de maio, e o pico de demanda dos revendedores se abre em semanas — o produto precisa estar monetizando antes desse pico. Três gaps travam a operação comercial plena: (1) gates de plano desabilitados — todos os vendedores operam como UNLIMITED sem cobrar; (2) Sentry sem DSN configurado em produção, deixando erros silenciosos; (3) email transacional ausente (nenhum Resend/SendGrid integrado), impedindo notificações de pedido e recuperação de senha por email. Rate limiting contra brute-force e spam de pedidos também está ausente. O produto está em produção em `album-digital-ashen.vercel.app` com infraestrutura funcional, mas sem uma venda Stripe confirmada end-to-end — a prioridade imediata é fechar esse ciclo antes da Copa.

---

## Próximos Passos (priorização Copa 2026 ≤ 4 semanas)

1. **Restaurar gates em `src/lib/plan-limits.ts`** — cobrar os planos que estão sendo entregues como UNLIMITED.
2. **Confirmar Stripe Checkout end-to-end em produção** — fazer 1 venda real (`checkout.session.completed` → `Seller.plan` atualizado).
3. **Configurar `SENTRY_DSN`** em prod (Vercel env) — destravar error tracking que já está instrumentado.
4. **Integrar email transacional (Resend)** — confirmação de pedido, reset de senha, recibo Stripe.
5. **Rate limiting** em `/api/auth/login`, `/api/auth/register` e endpoints públicos de pedido.
6. **Remover dependências legado** — `@prisma/adapter-better-sqlite3` e `better-sqlite3` ainda no `package.json`.

---

## Inventário automático (extrator)

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
| Schema Prisma | 18 modelos em `prisma/schema.prisma` |

Pré-commit gate enforced via hooks: `npm run test` → `npx tsc --noEmit` → `npm run build`.

---

_Snapshot gerado em 2026-05-11 20:02 via `/p8-master:p8-snapshot` v1.2.3 (fan-out paralelo 2 streams Sonnet)._
_Backup da versão anterior: [`product-snapshot.bak.2026-05-11.md`](product-snapshot.bak.2026-05-11.md)._
_Regenere quando schema Prisma, package.json ou globals.css mudarem significativamente._
