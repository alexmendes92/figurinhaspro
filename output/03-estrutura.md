---
fase: estrategia-estrutura
gerado-em: 2026-04-28T23:25:00-03:00
versao: 1
projeto-alvo: C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
agents-usados: [analista-gerador, arquiteto-estrategico]
status: completo
sumario: "Reorganização em 7 boundaries (catalog/pricing/billing/bot/services/observability/auth) com 4 fases de migração em ~17 dias úteis. Cockpit comercial frozen como DEPRECATED Q3/26. Coverage projetada 40-50%, blindando o caminho do dinheiro."
gaps-identificados: 8
gaps-criticos: 5
prox-fase: designer
fases-migracao: 4
duracao-estimada-dias-uteis: 17
---

# Estratégia de Estrutura — P8-FigurinhasPro

> Nova organização técnica derivada de Geral (`output/01-estrategia-geral.md`) + Marketing (`output/02-marketing.md`). Restrições herdadas: validação inicial / zero budget / fundador solo / janela Copa 2026 (~6 semanas).

## Sumário Executivo

A re-análise do código sob lente dos 2 relatórios identificou **7 boundaries lógicos** (catálogo, inventário&pedidos, pricing, vendedor&auth, billing, bot&integração, observability) e **1 boundary congelado** (cockpit comercial). 8 gaps são estruturais (alimentam esta fase); 10 são operacionais (executados pontualmente).

A estrutura proposta cria **6 novas pastas em `lib/`** (`catalog/`, `pricing/`, `billing/`, `bot/`, `services/`, `observability/`) movendo 10 arquivos existentes para boundaries explícitos, cria 2 arquivos novos (`quote-service.ts`, `error-report.ts`+`telemetry.ts`), adiciona 2 colunas no schema `Seller` (`acquisitionSource`, `trialEndsAt`), cria 2 crons (snapshot MRR + trial-downgrade), substitui o `mock-data.ts` de revendedores por dashboard real em `/painel/admin/operacao`, deleta `/teste`, e congela `app/painel/comercial/*` com banner "DEPRECATED Q3/26".

A migração é faseada em **4 etapas (~17 dias úteis)** que se encaixam nas Etapas 1-5 do roteiro §19 da Geral. **5 itens cortados deliberadamente:** G9 (`albums.ts` → DB), G1 (`proxy.ts`), refactor de componentes gigantes (`inventory-manager.tsx`, `precos-album-editor.tsx`, `store-album-view.tsx`, `onboarding`), movimentação física do schema `Biz*`, suite de testes ≥80% — todos pós-Copa.

**Trade-off central declarado:** Fase 1 fecha G2 (`/api/bot/quote` falsificável) **antes** da suite completa de testes (G6) — viola TDD em troca de fechar bug de receita ativo antes da Copa, com mitigação de 1 teste de regressão mínimo.

## 1. Síntese dos relatórios

### a. Funcionalidades core

O produto tem três camadas. A seleção abaixo filtra o que importa para decidir estrutura de módulos — não reproduz a lista completa de §2 da Geral.

**Núcleo de receita** (toca dinheiro diretamente):

- **Gates de plano** (`src/lib/plan-limits.ts`) — `checkStickerLimit`, `checkAlbumLimit`, `checkOrderLimit`, `hasFeature`. Ativos no código apesar de `CLAUDE.md` afirmar o contrário (Divergência 7 da Geral). Refactor sem cobertura é roleta.
- **Stripe checkout + Customer Portal** (`src/app/api/stripe/checkout/`, `src/app/api/stripe/portal/`) — único caminho FREE→PRO. Price IDs lidos diretamente de `process.env` sem Zod: env ausente = 500 silencioso (G4, Crítico).
- **Webhook Stripe** (`src/app/api/stripe/webhook/route.ts`) — processa 4 eventos. Eventos sem `metadata.sellerId` são silenciosos (Divergência 4).
- **Sistema de preços 3 eixos** (`src/lib/price-resolver.ts`, 119 linhas, função pura) — hierarquia `customPrice > sectionRule > albumTypeRule > globalTypeRule > default`. Sem teste.

**Núcleo de valor para Rodrigo** (entrega "venda perdida evitada"):

- **Vitrine pública** (`src/app/loja/[slug]/[albumSlug]/`, `src/components/loja/store-album-view.tsx`, 1.052 linhas) — todo cold start parseia `albums.ts` (44.781 linhas, G9).
- **Lista de faltantes** (embutida em `store-album-view.tsx`) — diferencial sem concorrente direto no Brasil (§5.d Geral). Paulo (P14): "nunca ouvi falar". Sem CTA (G11).
- **API bot WhatsApp** (`src/app/api/bot/quote/route.ts`) — HMAC funciona, mas handler aceita `unitPrice` do payload externo sem validar e não decrementa inventário (G2, Crítico).
- **Decremento de inventário** — não existe no caminho do bot.

**Suporte / transversal:**

- **Auth** (`src/lib/auth.ts`, iron-session + bcryptjs) — fallback com senha plaintext (G1, Crítico, LGPD).
- **DB** (`src/lib/db.ts`, 26 linhas, Lazy Proxy) — acerto arquitetural. Connection limit Neon não configurado.
- **Instrumentação parcial** — Sentry captura apenas uncaught; 24 handlers engolem erro com `console.error` (G5).
- **Env validation** (`src/lib/env.ts`) — Zod schema, mas `STRIPE_PRICE_PRO/UNLIMITED` ficam de fora (G4).

### b. Público-alvo prioritário e canais

**Persona dos próximos 90 dias: Rodrigo, único alvo.** Revendedor profissional, 400-800 figurinhas/mês, perde 10-15 vendas/semana. PRO R$ 29 se paga em <1 semana de Copa.

**3 canais orgânicos (zero budget, fundador solo):**

1. **Cross-sell P1 (Arena Cards)** — banner pós-checkout com UTM. ~2 dias de implementação.
2. **Outreach em grupos WhatsApp** — 8-10 grupos Copa 2026, 30 dias PRO grátis para 2-3 vendedores. 2-4h + 30-60 min/sem.
3. **Conteúdo orgânico Instagram/TikTok** — 1 vídeo/semana. 2-3h/sem.

**Implicações estruturais:**

- `Seller.acquisitionSource` não existe no schema (GM1) — sem ele, `utm_source=p1` não é persistido.
- `Seller.trialEndsAt` não existe (GM2) — trial PRO automático exige cron de downgrade + gate que lê esse campo.
- Eventos `seller_signup` / `plan_limit_hit` não existem em Vercel Analytics — parte de G7.
- Upgrade contextual no modal de limite ainda genérico — precisa CTA com copy de ROI (GM3).

**Pré-condição absoluta antes de ativar canais:** fechar G2 e G4 antes do banner P1 ir ao ar.

### c. Gaps: estruturais vs operacionais

**Critério:** estrutural = exige criar/mover módulo, schema, camada de abstração, ou reorganizar responsabilidades; operacional = config, remoção de arquivo, copy, deploy, script único.

#### Gaps da Estratégia Geral (G1–G14)

| Gap | Descrição | Severidade | Classificação | Módulo/arquivo afetado |
|-----|-----------|-----------|---------------|------------------------|
| **G1** | Senha plaintext potencial; fallback `senha === sellerHash` em `login/route.ts:25-37` | Crítica | **Operacional** | Script único `scripts/audit-passwords.ts` + remoção do branch |
| **G2** | `/api/bot/quote` aceita `unitPrice` externo; não chama `resolveUnitPrice`; não decrementa | Crítica | **Estrutural** | `src/lib/services/quote-service.ts` (NEW) encapsula tx Prisma |
| **G3** | `/teste` em produção cria sellers reais sem auth | Alta | **Operacional** | DELETE `src/app/teste/` + Playwright em CI |
| **G4** | `STRIPE_PRICE_PRO/UNLIMITED` fora do Zod; 500 silencioso | Crítica | **Operacional** | 2 linhas em `src/lib/env.ts` |
| **G5** | Sentry só captura uncaught; 24 handlers engolem erro | Alta | **Estrutural** | `src/lib/observability/error-report.ts` (NEW) wrappa 24 handlers |
| **G6** | Suite de testes vazia | Alta | **Estrutural** | Camada `src/__tests__/` organizada por layer |
| **G7** | Sem telemetria custom | Alta | **Estrutural** | `src/lib/observability/telemetry.ts` (NEW) |
| **G8** | Zero canal de aquisição | Crítica | **Operacional** | Execução de marketing (banner P1, outreach, vídeos) |
| **G9** | `albums.ts` 44.781 linhas re-parseado em cold start | Média | **Estrutural** (adiado Q3/26) | Migração para tabela `Album`/`Sticker` no Neon — bloqueado por G6 |
| **G10** | Onboarding 772 linhas faz Camila desistir | Alta | **Operacional** (componente menor) | Reescrever `src/app/onboarding/page.tsx` para ~200 linhas |
| **G11** | "Lista de faltantes" oculta sem CTA | Alta | **Operacional** | CTA + tutorial + URL `?paste-list` |
| **G12** | CI roda apenas `npm ci && npm run build` | Média | **Operacional** | Atualizar `.github/workflows/quality-gate.yml` |
| **G13** | Cockpit sem dados reais; sem cron de MRR/churn | Média | **Estrutural** | `src/app/api/cron/snapshot/route.ts` (NEW) |
| **G14** | Foco diluído em 7+ projetos paralelos | Crítica | **Operacional** | Atualização do `CLAUDE.md` raiz |

#### Gaps da Estratégia de Marketing (GM1–GM4)

| Gap | Descrição | Classificação | Módulo/arquivo afetado |
|-----|-----------|---------------|------------------------|
| **GM1** | `Seller.acquisitionSource` não existe | **Estrutural** | `prisma/schema.prisma` + leitura UTM em `register` |
| **GM2** | Trial PRO automático inexiste | **Estrutural** | `Seller.trialEndsAt` + `api/cron/trial-downgrade` (NEW) + gate em `plan-limits.ts` |
| **GM3** | Upgrade contextual não disparado em `plan_limit_hit` | **Estrutural** (integração) | Depende de G7 — integra `telemetry.ts` com gates |
| **GM4** | Sem script de mapeamento de grupos WhatsApp | **Operacional** | Planilha + processo |

**Consolidado:** 8 gaps **estruturais** (G2, G5, G6, G7, G9 adiado, G13, GM1, GM2) alimentam Step 4. 10 **operacionais** (G1, G3, G4, G8, G10, G11, G12, G14, GM3 parcial, GM4) executados pontualmente.

## 2. Re-análise do código

### a. Módulos que sustentam as funcionalidades core

#### Vitrine pública

**`src/lib/`:** `albums.ts` (44.781 LOC, importado por 19 arquivos), `price-resolver.ts` (119 LOC, função pura), `custom-albums.ts`, `seller-catalog.ts`, `sticker-types.ts` (84 LOC).

**Rotas:** `loja/[slug]/page.tsx`, `loja/[slug]/[albumSlug]/page.tsx` (5 queries paralelas em `Promise.all`).

**Componentes:** `store-album-view.tsx` (1.052 linhas, Client Component com filtro + carrinho + lista de faltantes + busca + CTA — concentra demais).

**Modelos Prisma:** `Inventory`, `PriceRule`, `SectionPriceRule`, `QuantityTier`, `Seller`, `CustomAlbum`.

**Ponto forte:** `loja/[slug]/[albumSlug]/page.tsx` executa 5 queries em paralelo e constrói todos os mapas server-side. `buildStickerSectionMap()` calculado server para não vazar `albums.ts` ao browser.

**Ponto fraco:** `store-album-view.tsx` 1.052 LOC sem teste — qualquer mudança no carrinho/filtro exige navegar mil linhas sem rede.

#### Sistema de preços 3 eixos

**`price-resolver.ts`** — 119 LOC, função pura (`resolveUnitPrice`, `resolveQuantityDiscount`, `applyDiscount`, `buildStickerSectionMap`). Sem estado global, testável trivial.

**Ponto forte:** isolado como função pura. Hierarquia documentada no cabeçalho. Mesmo código resolve preço no bot (via `bot-search.ts:121`) e na loja.

**Ponto fraco:** cobertura zero apesar de ser a função mais crítica do produto. Setup de mocks (175 LOC) preparado mas nenhum `price-resolver.test.ts`.

#### Bot WhatsApp

**`bot-hmac.ts`** — 104 LOC. HMAC-SHA256 + `timingSafeEqual` + janela anti-replay 300s + `dev-skip` em dev. **Implementação mais bem acabada do projeto.**

**Ponto fraco crítico:** `/api/bot/quote/route.ts:24` aceita `unitPrice: z.number().positive()` do payload. Linha 73 calcula `totalPrice = sum(item.unitPrice * item.quantity)` sem `resolveUnitPrice`. Linha 78-96 cria `Order` com preço externo. Sem decremento de `Inventory.quantity`. **Paradoxo:** o GET `/api/bot/stickers` chama `resolveUnitPrice` corretamente — POST esqueceu.

#### Stripe checkout + webhook

**`stripe.ts`** — 37 LOC. Lazy init. **Price IDs lidos com `process.env.STRIPE_PRICE_PRO || null` sem passar por `env.ts` (linhas 28-34).**

**Webhook** — processa 4 eventos. Log em `SubscriptionEvent` só ocorre se `metadata.sellerId` presente.

**Ponto fraco:** env ausente = `stripePriceId: null` = checkout cria session com price inválido = 500 silencioso (não chega ao Sentry).

#### Plan limits

**`plan-limits.ts`** — 101 LOC. `checkStickerLimit`, `checkOrderLimit`, `checkAlbumLimit`, `hasFeature`. Sem cache, query DB em cada request.

**Pontos de uso:** `api/inventory/route.ts:43,55`, `api/orders/route.ts:62`, `api/bot/quote/route.ts:65`, `api/prices/route.ts:37`.

**Ponto forte:** gates ativos e corretos.

**Ponto fraco:** retornos `{ allowed: false }` não disparam evento analytics nem upsell contextual. Bloqueio silencioso.

### b. Módulos que sobram

#### Cockpit comercial — `/painel/comercial/*` → **Deprecar**

7 sub-rotas + `actions.ts` (241 LOC, 15 Server Actions) + 9 modelos `Biz*` + `seed/route.ts` que popula tudo com dados fictícios. **Nenhum cron** popula `BizKpiSnapshot` automaticamente; **nenhum `BizLead`** real (todos do seed: "Banca do Joao - Campinas", etc).

Os 9 modelos `Biz*` não têm relação com os 9 modelos de produto. Único ponto de junção: `BizLead.convertedSellerId`. Acerto arquitetural: cockpit pode ser removido sem tocar no produto. Mas funciona com dados de seed em produção.

**Decisão:** **Deprecar** — não deletar agora, congelar. Não evoluir. Para os próximos 90 dias, o único dashboard que importa é `SELECT plan, COUNT(*) FROM "Seller" GROUP BY plan` — query direta. Reavaliar agosto/2026 após Copa.

#### `mock-data.ts` revendedores → **Mover/substituir**

`src/app/painel/admin/revendedores/mock-data.ts` — 374 linhas de 12 vendedores fictícios. Página importa `mockSellers` direto, sem Prisma. Comentário no arquivo: "Quando for hora de plugar o banco, basta trocar...". A hora chegou.

Substituição trivial: `db.seller.findMany({ orderBy: { createdAt: 'desc' } })`. Custo: 1 dia. Prioridade: baixa, mas dado mockado com MRR sobre preços errados (R$39 PRO, R$79 UNLIMITED quando o produto cobra R$29 e R$59) é embaraçoso.

#### Galeria pública `/albuns/[year]/` → **Manter sem atenção**

Conteúdo estático de colecionador, não revendedor. Não conectado aos 3 canais. Captura tráfego orgânico de busca por "álbum Copa 1982" mas não converte Rodrigo. Custo zero de manter.

#### `/teste/page.tsx` → **Deletar**

Já listado em G3. Sem dependência externa. Custo: `git rm` + deploy.

#### `__tests__/setup.ts` → **Manter (usar)**

175 linhas de mocks Prisma + Stripe configurados. Não é código de produção, não ocupa bundle, representa trabalho já feito. Falta cobertura, não setup. Ação: escrever os testes.

#### `albums.ts` (44.781 LOC) vs `albums-data.ts` → **Manter ambos**

São arquivos distintos: `albums.ts` (dados completos de figurinhas, usado pela loja/bot/estoque) e `albums-data.ts` (metadados de páginas escaneadas, usado pela galeria).

**`albums.ts`:** **Manter mas com cirurgia adiada** — roteiro §19 da Geral adia migração DB para setembro/26. Para Copa, prioridade é produto funcionar, não pureza.

### c. Acoplamento que trava evolução

**Bloqueio 1 — `albums.ts` em 19 arquivos.** Trava migração DB e performance Copa. Cada cold start parseia 44.781 LOC. Vitrine pública (página mais acessada por Paulo) com TTFB inflado.

**Bloqueio 2 — `getSession()` em 26 arquivos sem layer intermediária.** Trava auth centralizada, rate limit, audit log. Adicionar rate limit hoje = propagar `ratelimit(ip)` em 26 lugares.

**Bloqueio 3 — `try/catch + console.error + return 500` em handlers engole erros antes do Sentry.** `instrumentation.ts` exporta `onRequestError = Sentry.captureRequestError` mas só pega erros não-tratados. Em produção, `STRIPE_PRICE_PRO` mal configurado → handler captura → `console.error` → silêncio. Operador opera no escuro durante Copa.

**Bloqueio 4 — `/api/bot/quote` usa preço do payload externo.** Trava integridade de receita do Rodrigo. `bot/quote/route.ts:73-74` calcula sem `resolveUnitPrice`. Bug paradoxal: `bot-search.ts:121` (GET do bot) usa `resolveUnitPrice` corretamente; POST esqueceu.

**Bloqueio 5 — Stripe price IDs fora do Zod de `env.ts`.** Trava upgrade de plano. Env ausente = `null` → 500 silencioso. **Primeira conversão FREE→PRO falha sem fundador saber.**

**Bloqueio 6 — `Seller.acquisitionSource` não existe no schema.** Trava tracking de UTM. Plano de marketing inteiro depende de `COUNT(Seller WHERE acquisitionSource = 'p1')`.

**Bloqueio 7 — `BizKpiSnapshot` sem cron.** Trava cockpit com dados reais e decisão de pivô em 31/07/2026.

## 3. Análise combinada

> A estrutura ideal de boundaries é a que **isola pricing/billing/bot como núcleos puros e testáveis**, **encapsula handlers de API atrás de um service layer fino**, e **trata catálogo + cockpit comercial como ilhas adiadas**, em vez de tentar reorganizar tudo de uma vez.

### a. Boundaries de domínio

7 boundaries lógicos identificados — separados por intenção de mudança, não proximidade de arquivo.

| Boundary | Modelos / arquivos atuais | Estado atual | Estado ideal | Custo refactor |
|---|---|---|---|---|
| **Catálogo** | `albums.ts` (44k LOC), `albums-data.ts`, `custom-albums.ts`, `seller-catalog.ts`; `CustomAlbum` | Disperso — `albums.ts` importado em 19 lugares; `CustomAlbum` no DB convive com array hardcoded | Unificado sob `lib/catalog/`. Migração DB (G9) adiada — boundary nasce, implementação parcial | Baixo (move) / Alto (DB) |
| **Inventário & Pedidos** | `Inventory`, `Order`, `OrderItem`; lógica espalhada em `/api/inventory/*`, `/api/orders/*`, `/api/bot/*` | Modelos coesos; decremento ausente em `/api/bot/quote` (G2) | Service layer (`quote-service.ts`) encapsula `resolveUnitPrice + tx + decrement`. Handlers viram orquestradores finos | Médio |
| **Pricing** | `price-resolver.ts` (119 LOC, pura), `sticker-types.ts` (84 LOC), `PriceRule`, `SectionPriceRule`, `QuantityTier` | Funcional, **bypassado por** `/api/bot/quote` (G2) | `lib/pricing/` com 100% coverage. Único ponto de verdade | Baixo |
| **Vendedor & Auth** | `Seller`, `auth.ts` (44 LOC), `getSession()` em 26 arquivos | Disperso | Centralizado via `proxy.ts` ou layout `(painel)/layout.tsx` — **adiado pós-Copa** | Alto (agora) / Natural pós-Copa |
| **Billing** | `stripe.ts` (37 LOC), webhook, `plan-limits.ts`, `SubscriptionEvent`, futuro `Seller.trialEndsAt` | `plan-limits.ts` solto; price IDs fora de `env.ts` (G4) | `lib/billing/` — gates aplicados via `assertPlanFeature(seller, 'X')` no início de Server Actions | Baixo-médio |
| **Bot & Integração** | `bot-hmac.ts` (104 LOC), `bot-search.ts` (141 LOC), `/api/bot/*` | HMAC e busca coesos, **mas quote bypassa pricing** (G2) | `lib/bot/`. Endpoints chamam `quote-service`. Bot é cliente, não dono de regra de preço | Médio |
| **Observability** | Sentry config, Vercel Analytics. **Não há** wrapper nem eventos custom (G5, G7, GM3) | Disperso — 24 handlers fazem `try/catch + console.error` | `lib/observability/` com `withErrorReport()` (decorator) e `track()` (eventos). Cron `BizKpiSnapshot` consome | Baixo (~150 LOC totais) |
| **Cockpit Comercial** *(deprecar)* | 9 modelos `Biz*`, 7 sub-rotas, ~700 LOC actions | Isolado tecnicamente, **órfão estrategicamente** | **Frozen** — banner "DEPRECATED Q3/26", schema mantido, dashboard real `/painel/admin/operacao` substitui valor cotidiano | Baixíssimo |

**"Onboarding" não é boundary** — é rota UI consumindo Auth+Billing, sem lógica própria.

### b. O que vira módulo dedicado vs utility vs sai

**Critério:** módulo dedicado quando boundary tem ≥2 arquivos relacionados ou política de teste própria; utility quando 1 arquivo de função pura ou config; sai quando código vivo mas estrategicamente parado.

**Módulos dedicados (`lib/<dominio>/`):**

- **`lib/catalog/`** — 4 arquivos. Boundary de mais alta carga (19 imports), mesmo congelado pra DB.
- **`lib/pricing/`** — 2 arquivos. Função pura testável, 100% coverage alvo, coração de receita.
- **`lib/billing/`** — 2 arquivos. Política de gate independente de Stripe SDK; cron `trial-downgrade` consome ambos.
- **`lib/bot/`** — 2 arquivos. Contrato HMAC merece teste isolado e revisão dedicada.
- **`lib/services/`** — 1-3 arquivos (`quote-service.ts`, futuros `checkout-service.ts`, `order-service.ts`). **Camada nova** que resolve G2. Boundary nasce com 1 arquivo, expande sob demanda.
- **`lib/observability/`** — 2 arquivos. G5 + G7 + GM3 resolvem com 2 funções unificadas.

**Utilities (arquivos soltos em `lib/`):** `db.ts`, `auth.ts` (vira boundary se ganhar 2º arquivo), `env.ts`, `admin.ts`, `images.ts`, `page-sticker-map.ts`, `toast-context.tsx`, `cart-context.tsx`.

**Sai (frozen):** `app/painel/comercial/*` + 9 modelos `Biz*` + `lib/biz/` (placeholder). Banner "DEPRECATED Q3/26". Não deletar (preserva dados); não evoluir.

**Decisão deliberada:** **NÃO** mover lógica do cockpit para `lib/biz/` agora. Pasta nasce vazia com README. Mover congelado é trabalho sem ROI.

### c. Trade-offs explícitos

A estrutura ideal **conflita** com pragmatismo de janela Copa em 4 pontos. Declarados pra crítico-adversarial atacar:

1. **Refactor de `/api/bot/quote` (G2) na Fase 1, antes da suite completa de testes (G6).** Estrutura ideal pediria testes-primeiro (TDD canônico). Aceito o risco porque G2 é bug de receita ativo (preço pode ser zero) e Copa começa em ~7 semanas. **Mitigação:** Fase 1 escreve teste mínimo de regressão antes de mexer; suite completa de pricing vem na Fase 3.

2. **`proxy.ts` para auth centralizada (G1) fica fora.** Estrutura ideal teria `proxy.ts` interceptando `/painel/*`. Custo: refactor toca 26 arquivos. Pós-Copa. **Risco aceito:** continuamos com `getSession()` repetido por 4-6 meses. **Mitigação:** lint rule custom em pós-Copa; até lá, code review.

3. **Migração de `albums.ts` pra DB (G9) fica fora.** Estrutura ideal teria `Album` + `Section` + `Sticker` no schema. Custo: ~5-7d + risco alto durante Copa. **Risco aceito:** time gasta tempo editando array de 44k LOC durante Copa. **Mitigação:** Fase 3 só **move** o arquivo pra `lib/catalog/`, deixando interface estável para DB plug-in posterior.

4. **Suite completa de testes não é estrutura ideal — é mínima viável.** Roteiro §19 prevê 4 suites. Estrutura ideal pediria também: `quote-service.test.ts`, `error-report.test.ts`, `cron-snapshot.test.ts`, integração `/api/inventory/*`. Pós-Copa. **Risco aceito:** cobertura ~40-50% no fim da Fase 3, não 80%. **Mitigação:** as 4 suites cobrem o caminho do dinheiro.

## 4. Definição de nova estrutura

### a. Árvore proposta de pastas/módulos

```
src/
├── app/
│   ├── (auth)/                                  # mantido
│   ├── loja/
│   │   ├── [slug]/
│   │   └── [slug]/[albumSlug]/                  # mantido (extrair sub-componentes pós-Copa)
│   ├── painel/
│   │   ├── comercial/                           # DEPRECATED — banner "frozen Q3/26"
│   │   ├── estoque/                             # mantido
│   │   ├── precos/                              # mantido
│   │   ├── pedidos/                             # mantido
│   │   ├── planos/                              # mantido
│   │   ├── loja/                                # mantido
│   │   └── admin/
│   │       └── operacao/                        # NEW — dashboard real (replace mock-data.ts)
│   ├── api/
│   │   ├── auth/                                # mantido
│   │   ├── albums/                              # mantido
│   │   ├── inventory/                           # mantido
│   │   ├── orders/                              # mantido
│   │   ├── prices/                              # mantido
│   │   ├── seller/                              # mantido
│   │   ├── stripe/
│   │   │   ├── checkout/                        # mantido
│   │   │   ├── webhook/                         # ATUALIZADO — usa withErrorReport({ swallow: true })
│   │   │   └── portal/                          # mantido
│   │   ├── bot/
│   │   │   ├── quote/                           # REFACTOR — chama services/quote-service.ts (G2)
│   │   │   ├── checkout/                        # mantido
│   │   │   └── order/[id]/status/               # mantido
│   │   ├── cron/                                # NEW
│   │   │   ├── snapshot/                        # NEW (G13)
│   │   │   └── trial-downgrade/                 # NEW (GM2)
│   │   └── comercial/
│   │       └── seed/                            # mantido (sem expansão)
│   ├── albuns/[year]/                           # mantido sem atenção (galeria pública)
│   ├── onboarding/                              # mantido (refactor 772→~200 LOC pós-Copa)
│   └── teste/                                   # DELETED (G3)
│
├── components/
│   ├── auth/                                    # mantido
│   ├── loja/                                    # mantido
│   ├── painel/
│   │   ├── comercial/                           # DEPRECATED
│   │   └── operacao/                            # NEW
│   └── ui/                                      # mantido
│
├── lib/
│   ├── catalog/                                 # NEW
│   │   ├── albums.ts                            # MOVED de src/lib/albums.ts (44k LOC, intacto)
│   │   ├── albums-data.ts                       # MOVED
│   │   ├── custom-albums.ts                     # MOVED
│   │   └── seller-catalog.ts                    # MOVED
│   │
│   ├── pricing/                                 # NEW (100% cov alvo)
│   │   ├── price-resolver.ts                    # MOVED (119 LOC)
│   │   └── sticker-types.ts                     # MOVED (84 LOC)
│   │
│   ├── billing/                                 # NEW
│   │   ├── stripe.ts                            # MOVED (37 LOC)
│   │   └── plan-limits.ts                       # MOVED (101 LOC)
│   │
│   ├── bot/                                     # NEW
│   │   ├── bot-hmac.ts                          # MOVED (104 LOC)
│   │   └── bot-search.ts                        # MOVED (141 LOC)
│   │
│   ├── services/                                # NEW
│   │   └── quote-service.ts                     # NEW (G2)
│   │
│   ├── observability/                           # NEW
│   │   ├── error-report.ts                      # NEW (G5)
│   │   └── telemetry.ts                         # NEW (G7, GM3)
│   │
│   ├── biz/                                     # NEW (placeholder vazio — frozen)
│   │   └── README.md                            # NEW (explica "DEPRECATED Q3/26")
│   │
│   ├── auth.ts                                  # mantido
│   ├── db.ts                                    # mantido
│   ├── env.ts                                   # ATUALIZADO (Zod inclui STRIPE_PRICE_PRO/UNLIMITED — G4)
│   ├── admin.ts                                 # mantido
│   ├── images.ts                                # mantido
│   ├── toast-context.tsx                        # mantido
│   ├── cart-context.tsx                         # mantido
│   └── page-sticker-map.ts                      # mantido
│
├── __tests__/
│   ├── setup.ts                                 # mantido
│   ├── lib/
│   │   ├── pricing/
│   │   │   └── price-resolver.test.ts           # NEW (G6 — coverage 100% alvo)
│   │   ├── billing/
│   │   │   └── plan-limits.test.ts              # NEW (G6)
│   │   └── services/
│   │       └── quote-service.test.ts            # NEW (Fase 1 — regressão mínima G2)
│   └── api/
│       ├── stripe/
│       │   └── webhook.test.ts                  # NEW (G6)
│       └── bot/
│           └── quote.test.ts                    # NEW (G6)
│
├── generated/prisma/                            # mantido (gitignored)
└── proxy.ts                                     # NÃO criar agora (G1 pós-Copa)

prisma/
└── schema.prisma                                # ATUALIZADO — Seller.acquisitionSource (GM1) + trialEndsAt (GM2)

(removido)
└── src/app/painel/comercial/lib/mock-data.ts    # DELETED (substituído por dashboard real)
```

### b. Mapeamento estrutura atual → estrutura nova

| De | Para | Tipo | Gap | Justificativa |
|----|------|------|-----|---------------|
| `src/lib/albums.ts` | `src/lib/catalog/albums.ts` | MOVE | — | Boundary catálogo isolado; 19 imports atualizados |
| `src/lib/albums-data.ts` | `src/lib/catalog/albums-data.ts` | MOVE | — | Mesmo boundary |
| `src/lib/custom-albums.ts` | `src/lib/catalog/custom-albums.ts` | MOVE | — | Mesmo boundary |
| `src/lib/seller-catalog.ts` | `src/lib/catalog/seller-catalog.ts` | MOVE | — | Mesmo boundary |
| `src/lib/price-resolver.ts` | `src/lib/pricing/price-resolver.ts` | MOVE | — | Boundary pricing |
| `src/lib/sticker-types.ts` | `src/lib/pricing/sticker-types.ts` | MOVE | — | Config pricing-adjacente |
| `src/lib/plan-limits.ts` | `src/lib/billing/plan-limits.ts` | MOVE | — | Plan gates são parte de billing |
| `src/lib/stripe.ts` | `src/lib/billing/stripe.ts` | MOVE | — | Boundary billing |
| `src/lib/bot-hmac.ts` | `src/lib/bot/bot-hmac.ts` | MOVE | — | Boundary bot |
| `src/lib/bot-search.ts` | `src/lib/bot/bot-search.ts` | MOVE | — | Boundary bot |
| (não existe) | `src/lib/services/quote-service.ts` | CREATE | **G2** | Encapsula `resolveUnitPrice + tx Prisma + Inventory.decrement` |
| `src/app/api/bot/quote/route.ts` | mantido | REFACTOR | **G2** | Chama `quote-service.ts` (URL e contrato HMAC inalterados) |
| (não existe) | `src/lib/observability/error-report.ts` | CREATE | **G5** | `withErrorReport(handler)` — captura, loga, reporta Sentry |
| (não existe) | `src/lib/observability/telemetry.ts` | CREATE | **G7, GM3** | `track(event, props)` — eventos custom |
| `src/app/api/bot/*/route.ts` (3 arquivos) | mantidos + `withErrorReport()` | REFACTOR | G5 | Padronizar tratamento de erro |
| `src/app/api/stripe/webhook/route.ts` | mantido + `withErrorReport({ swallow: true })` | REFACTOR | G5 | **Cuidado:** webhook deve retornar 200 mesmo em erro |
| `src/app/api/stripe/checkout/route.ts` | mantido + `withErrorReport()` | REFACTOR | G5 | — |
| `src/app/api/inventory/*/route.ts` | mantidos + `withErrorReport()` | REFACTOR | G5 | ~6 arquivos |
| `src/app/api/orders/*/route.ts` | mantidos + `withErrorReport()` | REFACTOR | G5 | — |
| `src/lib/env.ts` | atualizado: `STRIPE_PRICE_PRO`, `STRIPE_PRICE_UNLIMITED` no Zod | EDIT | **G4** | Build falha sem essas envs |
| `prisma/schema.prisma` `Seller` | adicionar `acquisitionSource String?` | SCHEMA | **GM1** | Captura origem (organic/whatsapp/anuncio) |
| `prisma/schema.prisma` `Seller` | adicionar `trialEndsAt DateTime?` | SCHEMA | **GM2** | Permite trial PRO 14 dias com expiração |
| `src/app/(auth)/cadastro/page.tsx` | atualizado pra capturar `acquisitionSource` (UTM + form) | EDIT | GM1 | Persiste no signup |
| (não existe) | `src/app/api/cron/snapshot/route.ts` | CREATE | **G13** | Popula `BizKpiSnapshot` noturno com MRR + Seller.count + churn |
| (não existe) | `src/app/api/cron/trial-downgrade/route.ts` | CREATE | **GM2** | `WHERE trialEndsAt < NOW() AND plan='PRO'` → FREE |
| `vercel.json` | adicionar 2 entradas em `crons[]` | EDIT | G13, GM2 | Habilita execução agendada |
| (não existe) | `src/app/painel/admin/operacao/page.tsx` | CREATE | G13 (parcial) | Dashboard real consumindo Prisma + `BizKpiSnapshot` |
| (não existe) | `src/components/painel/operacao/*` | CREATE | G13 (parcial) | Cards de KPI, mini-gráficos |
| `src/app/painel/admin/revendedores/mock-data.ts` | DELETE | DELETE | — | Substituído por queries reais |
| `src/app/teste/page.tsx` (e diretório) | DELETED | DELETE | **G3** | Página de teste vazada em prod |
| `src/app/painel/comercial/*` | mantido + banner "DEPRECATED" no header | FREEZE | — | Não evoluir; preservar dados |
| `prisma/schema.prisma` modelos `Biz*` | mantidos + comment `// DEPRECATED Q3/26` | DOC | — | — |
| (não existe) | `src/lib/biz/README.md` | CREATE | — | Placeholder explicando deprecação |
| (não existe) | `src/__tests__/lib/services/quote-service.test.ts` | CREATE | G2, G6 | Regressão mínima Fase 1 |
| (não existe) | `src/__tests__/lib/pricing/price-resolver.test.ts` | CREATE | **G6** | Coverage 100% alvo |
| (não existe) | `src/__tests__/lib/billing/plan-limits.test.ts` | CREATE | **G6** | `checkStickerLimit`, `hasFeature` por plano |
| (não existe) | `src/__tests__/api/stripe/webhook.test.ts` | CREATE | **G6** | Idempotência via `event.id`, downgrade |
| (não existe) | `src/__tests__/api/bot/quote.test.ts` | CREATE | **G6** | HMAC, preço bypass, idempotência |

**Total: ~37 mudanças ativas + 2 freeze + 5 delete/doc.**

### c. Migração faseada (não big-bang)

#### Fase 1 — Sangria estrutural mínima (5 dias úteis — encaixe Etapa 1 do §19)

**Mudanças:**
- DELETE `src/app/teste/` (G3)
- EDIT `src/lib/env.ts` — Zod inclui `STRIPE_PRICE_PRO`, `STRIPE_PRICE_UNLIMITED` (G4)
- SCHEMA `Seller.acquisitionSource` + `Seller.trialEndsAt` (GM1, GM2) + `prisma db push`
- EDIT signup flow pra capturar `acquisitionSource` (UTM + form)
- CREATE `src/lib/services/quote-service.ts` + REFACTOR `/api/bot/quote/route.ts` (G2)
- CREATE `src/__tests__/lib/services/quote-service.test.ts` — regressão mínima

**Pré-condições:** nenhuma.

**Critérios de "pronto":**
- `curl https://album-digital-ashen.vercel.app/teste` → 404
- `npm run build` falha localmente sem `STRIPE_PRICE_PRO` no `.env.local`
- `curl POST /api/bot/quote` com `unitPrice: 0.01` retorna 422
- `prisma studio` mostra `acquisitionSource` e `trialEndsAt` em `Seller`
- Signup novo grava `acquisitionSource` (testar com `?utm_source=whatsapp`)
- `npm run test` passa o teste de regressão de quote
- Deploy Vercel verde

**Risco principal:** refactor de `/api/bot/quote` sem suite completa de testes (TDD violado deliberadamente — ver §3.c.1). **Mitigação:** teste de regressão mínimo cobre o caso conhecido; revisão manual do diff antes do deploy; rollback = revert do commit do route.ts.

#### Fase 2 — Observability mínima (3 dias úteis — encaixe Etapa 2)

**Mudanças:**
- CREATE `src/lib/observability/error-report.ts` — `withErrorReport(handler, opts?)` com modo `swallow` pro webhook Stripe
- CREATE `src/lib/observability/telemetry.ts` — `track(event, props)` via Vercel Analytics
- REFACTOR ~24 handlers de API com `withErrorReport()`
- INSTRUMENT 2-3 eventos críticos: `plan_limit_hit`, `signup_completed`, `first_inventory_added`

**Pré-condições:** Fase 1 completa.

**Critérios de "pronto":**
- Forçar `throw new Error('teste')` em handler aleatório → erro aparece no Sentry com contexto (sellerId, route, method)
- Webhook Stripe retorna 200 mesmo em erro (verificar via `stripe trigger`)
- FREE adiciona 101ª figurinha → evento `plan_limit_hit` no Vercel Analytics
- Signup novo dispara `signup_completed` com `acquisitionSource` no payload
- Grep `console.error` em `/api/` retorna ≤3 ocorrências
- Deploy Vercel verde

**Risco principal:** envolver webhook Stripe sem flag `swallow` derruba retries do Stripe. **Mitigação:** `withErrorReport` aceita `{ swallow: true }`; revisão obrigatória do handler de webhook; rodar `stripe trigger checkout.session.completed` localmente antes do deploy.

#### Fase 3 — Reorganização de módulos `lib/` + suites de teste (5 dias úteis — paralelo às Etapas 3-4)

**Mudanças:**
- MOVE `lib/albums.ts` + `albums-data.ts` + `custom-albums.ts` + `seller-catalog.ts` → `lib/catalog/`
- MOVE `lib/price-resolver.ts` + `sticker-types.ts` → `lib/pricing/`
- MOVE `lib/plan-limits.ts` + `stripe.ts` → `lib/billing/`
- MOVE `lib/bot-hmac.ts` + `bot-search.ts` → `lib/bot/`
- ATUALIZAR ~50 imports via `find/replace` controlado
- CREATE `lib/biz/README.md` (placeholder)
- CREATE 4 suites: `pricing/price-resolver.test.ts`, `billing/plan-limits.test.ts`, `api/stripe/webhook.test.ts`, `api/bot/quote.test.ts`

**Pré-condições:** Fase 2 completa, **escrever `pricing/price-resolver.test.ts` ANTES de mover** (gate: testes passam pré-MOVE; depois do MOVE, continuam passando — confirma que `find/replace` não quebrou nada).

**Critérios de "pronto":**
- Grep `from "@/lib/albums"` retorna 0 ocorrências
- Grep `from "@/lib/catalog"` retorna 19+ ocorrências
- Grep `from "@/lib/price-resolver"` retorna 0; `from "@/lib/pricing"` retorna ≥4
- `npm run build` verde
- `npm run test` verde, 4 suites com ≥30 testes totais
- Coverage: pricing 100%, plan-limits ≥80%, webhook ≥80%, bot/quote ≥80%
- Deploy Vercel verde

**Risco principal:** refactor amplo (~50 imports) durante janela Copa pode introduzir bug latente. **Mitigação:** (a) escrever suites antes do MOVE — testes pegam regressão de import quebrado em CI; (b) deploy em horário baixo (3h UTC) com rollback automático Vercel; (c) `npx tsc --noEmit` é gate antes do commit.

#### Fase 4 — Cron + dashboards reais (4 dias úteis — encaixe Etapa 5)

**Mudanças:**
- CREATE `src/app/api/cron/snapshot/route.ts` (G13) — popula `BizKpiSnapshot` com MRR, sellers ativos, churn
- CREATE `src/app/api/cron/trial-downgrade/route.ts` (GM2) — `prisma.seller.updateMany` onde `trialEndsAt < NOW() AND plan='PRO'`
- EDIT `vercel.json` — adicionar 2 entradas em `crons[]` (snapshot 03:00 UTC, trial-downgrade 02:00 UTC)
- CREATE `src/app/painel/admin/operacao/page.tsx` — dashboard real
- CREATE `src/components/painel/operacao/*` — cards de KPI
- DELETE `src/app/painel/admin/revendedores/mock-data.ts`
- BANNER "DEPRECATED Q3/26" em `app/painel/comercial/layout.tsx`

**Pré-condições:** Fases 1-3 completas. Stripe CLI instalado.

**Critérios de "pronto":**
- Trigger manual `curl /api/cron/snapshot` cria registro em `BizKpiSnapshot`
- Trigger manual de `trial-downgrade` com seller de teste (`trialEndsAt = ontem`) faz downgrade pra FREE
- `/painel/admin/operacao` mostra MRR, sellers ativos, signups por origem em valores reais
- `mock-data.ts` removido; Grep `revendedores` em mock retorna 0
- Cron Vercel agendado em `vercel.json` e visível no dashboard
- Banner "DEPRECATED Q3/26" visível em `/painel/comercial`
- Deploy Vercel verde

**Risco principal:** lógica de cron em Vercel exige verificação manual nas primeiras execuções. **Mitigação:** primeira semana, abrir Vercel logs todo dia 03:30 UTC; se falhar, alerta Sentry pega.

**Resumo temporal:** 5 + 3 + 5 + 4 = **17 dias úteis** ≈ 3.5 semanas. Encaixa dentro de 4-5 semanas das Etapas 1-5 do roteiro §19. Sobra folga de ~3-5 dias úteis pra contingência.

### d. O que NÃO está nessa migração (cortado deliberadamente)

1. **G9 — Migração de `albums.ts` (44k LOC) pra DB.** Adiada pra setembro/26. Em Fase 3, **só MOVE de pasta**, interface intacta.
2. **G1 — `proxy.ts` para auth centralizada.** Pós-Copa. Continuamos com `getSession()` repetido por 4-6 meses.
3. **Refactor de componentes gigantes.** `inventory-manager.tsx` (1.049 LOC), `precos-album-editor.tsx` (823 LOC), `store-album-view.tsx` (1.052 LOC), `onboarding/page.tsx` (772 LOC). Pós-Copa, depois que `lib/` estiver coberto.
4. **Movimentação de schema `Biz*` pra `lib/biz/`.** Cockpit fica `frozen`. `lib/biz/` nasce vazia.
5. **Suite completa (>80% coverage do projeto).** Esta migração entrega 4 suites — coverage projetada **40-50%** total. Pós-Copa: `quote-service.test.ts` completo, `error-report.test.ts`, `cron-snapshot.test.ts`, integração `/api/inventory/*`, suite de componentes via React Testing Library.

## 5. Relatório executivo

**Output desta fase.** Estrutura proposta com 7 boundaries lógicos (catálogo, inventário&pedidos, pricing, vendedor&auth, billing, bot&integração, observability) + 1 frozen (cockpit comercial). Migração em 4 fases (~17 dias úteis) que se encaixam no roteiro §19 da Geral. 5 itens cortados deliberadamente (G9, G1/proxy.ts, refactor de componentes gigantes, movimentação de Biz*, coverage ≥80%) — todos pós-Copa.

**8 gaps estruturais** alimentaram esta fase: G2, G5, G6, G7, G9 (adiado), G13, GM1, GM2. **5 gaps críticos** para a janela Copa: G1 (operacional, plaintext), G2 (estrutural, bot/quote), G4 (operacional, Stripe Zod), G8 (operacional, aquisição), G14 (operacional, foco).

**Decisão central.** Trade-off declarado: Fase 1 fecha G2 antes da suite completa de testes (G6). Viola TDD em troca de fechar bug de receita ativo antes da Copa. Mitigação: 1 teste de regressão mínimo + revisão manual + rollback plan. Aceito pelo operador em DECISION POINT do Step 4.

**Próxima fase.** `/oracle:estrategia-designer` — UX/UI baseado em Geral + Marketing + Estrutura. Pré-requisito: 01, 02, 03 (✅).

**Itens fora desta fase mas que precisam atenção em paralelo:**

- G1 (senha plaintext) — script único `scripts/audit-passwords.ts` + force-reset por email. Operacional, ~1 dia. Bloqueia Etapa 1 do roteiro mas não exige mudança estrutural.
- G8 (canais de aquisição) — execução de marketing detalhada em `output/02-marketing.md`. Operacional, ~2 semanas distribuídas.
- G10 (onboarding 772→200 linhas) — refactor de componente, ~4-5 dias. Não cabe na migração estrutural mas é crítico pra Camila e ajuda Rodrigo.
- G11 (lista de faltantes oculta) — copy + tutorial + URL `?paste-list`. Operacional, ~2-3 dias.
- G14 (foco diluído) — disciplina de gestão. Operacional, atualização do `CLAUDE.md` raiz.

**Risco da síntese (autocrítica do arquiteto):**

- Premissa "17 dias úteis cabem na Copa" assume **1 dev em foco total** sem urgência externa. Bug urgente de prod = Fase 3 (mais arriscada) é a primeira a estourar.
- Fase 1 viola TDD em troca de fechar G2 antes da Copa — declarado, mas é aposta. Se refactor de `/api/bot/quote` introduzir bug sutil (ex: timeout de tx Prisma sob carga), só descobre em produção.
- `lib/services/` nasce com 1 arquivo. Risco de virar pasta-atalho. Se em pós-Copa não nascer `checkout-service.ts`/`order-service.ts`, voltar e mover `quote-service.ts` pra `lib/bot/` ou `lib/billing/`.
- Não validei se `vercel.json` já tem `crons[]`. Hobby plan tem limit 2 — pode exigir consolidação ou upgrade Pro.
