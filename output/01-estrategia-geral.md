---
fase: estrategia-geral
status: completo
projeto-alvo: P8-FigurinhasPro
caminho: C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
data-inicio: 2026-04-28
data-conclusao: 2026-04-28
gaps-identificados: 14
gaps-criticos: 5
prox-fase: marketing
profundidade: padrao
---

# Estratégia Geral — P8-FigurinhasPro

> Análise estratégica em 20 passos. Status: **completo**.

## Sumário Executivo

P8-FigurinhasPro é um SaaS Next.js 16 + React 19 + Prisma 7 + Neon Postgres + Stripe para **revendedores brasileiros de figurinhas avulsas Panini**, monetizado em FREE / PRO (R$ 29) / UNLIMITED (R$ 59) com gates de plano **ativos** (apesar do `CLAUDE.md` afirmar o contrário), além de cockpit comercial admin-only com 7 sub-módulos (CRM, ofertas, experimentos, iniciativas, tarefas, KPIs, dashboard).

Pesquisa de mercado (10+ queries) **não encontrou nenhum SaaS direto equivalente no Brasil**: concorrência real é Mercado Livre + WhatsApp + planilha Google Sheets (15.638+ grupos detectados). Mercado de figurinhas Panini Brasil em ciclo Copa 2026 é robusto — Rede Leitura espera R$ 140 milhões só com figurinhas, bancas crescem até 347%.

Crítica adversarial identificou **14 gaps numerados**, dos quais **5 com severidade Crítica** para a janela Copa 2026 (junho-julho/26):

1. **G1** — senha plaintext potencial no banco (LGPD)
2. **G2** — `/api/bot/quote` aceita preço falsificado e não decrementa inventário
3. **G4** — Stripe price IDs sem validação Zod (500 silencioso no checkout)
4. **G8** — zero canal de aquisição funcionando (cockpit comercial populado por seed, não leads reais)
5. **G14** — foco diluído em 7+ projetos paralelos no workspace Arena Cards

Persona-alvo dominante é **Rodrigo** (revendedor profissional, 400-800 figurinhas/mês, alvo PRO). Camila (hobby, FREE) e Paulo (colecionador comprador) são casos secundários. Diferencial-killer "lista de faltantes" existe em código mas é desconhecido pelo usuário (Paulo: "nunca ouvi falar").

**Roteiro proposto:** 6 etapas em ~30 dias úteis (~6 semanas, encaixe na janela Copa) começando pela declaração de foco P8 + P1v2 como única prioridade até 31/jul/2026, seguido por sangria técnica (5d), observability mínima (3d), núcleo da loja confiável (7d), aquisição mínima viável (7d), polimento + Modo Copa + trial PRO automático (5d) e iteração durante a Copa. Cirurgia em `albums.ts` (44.781 linhas) adiada deliberadamente para setembro/26.

**Risco principal de execução:** 30 dias úteis em 6 semanas assume 1 dev em foco total — sem corte de outros projetos, janela Copa será perdida com produto pronto e zero tráfego.

**Próxima fase:** `/oracle:estrategia-marketing` (passo 2 de 7 do `/oracle:analise`).

## 1. Análise do código

**Linguagens e frameworks**

TypeScript 5 (strict, `noImplicitAny: false`) em todo o projeto. Framework: Next.js 16.2.4 com App Router, React 19.2.5, React Compiler ativado via `babel-plugin-react-compiler@1.0.0`. ORM: Prisma 7.7 com generator `prisma-client` novo (saída em `src/generated/prisma/`). Banco em produção: Neon Postgres via `@prisma/adapter-neon` (WebSocket Pool). Banco de dev: Better SQLite3 via `@prisma/adapter-better-sqlite3`. Auth: iron-session 8 + bcryptjs 3. Validação: Zod 4.3.6. Pagamentos: Stripe SDK 22.0.2. Monitoramento declarado: Sentry `@sentry/nextjs` 10.49 + Vercel Analytics + Speed Insights. Lint/format: Biome 2.4.12. Testes: Vitest 4.1.4. Deploy: Vercel (auto-deploy desativado — manual via `vercel deploy --prod`).

**Arquitetura**

Estrutura canônica Next.js 16 em `src/`:

- `src/app/` — ~90 arquivos. Agrupa rotas de autenticação em `(auth)/` (5 páginas: login, registro, esqueci-senha, reset-senha, verificar-email), loja pública em `loja/[slug]/` e `loja/[slug]/[albumSlug]/`, painel do vendedor em `painel/` (estoque, pedidos, preços, planos, loja, onboarding), cockpit comercial admin-only em `painel/comercial/` (7 sub-módulos), galeria pública de álbuns em `albuns/[year]/`, e 24 rotas de API em `api/` (grupos: auth, albums, bot, comercial, inventory, orders, prices, seller, stripe).
- `src/lib/` — 20 arquivos de lógica de negócio. O maior é `albums.ts` com **44.781 linhas** — inteiramente dados estáticos JSON inline descrevendo 13 álbuns Panini FIFA World Cup (1970–2022), figurinha a figurinha. É o catálogo base hard-coded do produto.
- `src/components/` — 37 arquivos `.tsx`. Divididos em `auth/` (10 componentes), `loja/` (5 componentes), `painel/` (15 componentes), `ui/` (3 componentes genéricos).
- `src/generated/prisma/` — cliente Prisma gerado (gitignored), 18 modelos.
- `src/__tests__/setup.ts` — mocks globais Prisma e Stripe para Vitest.

Padrões observados: Server Components configurado como default, mas **`'use client'` aparece em 43 arquivos** dentro de `src/` (correção Phase 2 — afirmação inicial de "0 ocorrências" estava factualmente errada). Os Client Components dominam exatamente os pontos de UX críticos: `inventory-manager.tsx`, `cart-drawer.tsx`, `precos-album-editor.tsx`, `app-shell.tsx`, `cart-context.tsx`, todas as 5 páginas `(auth)/`, `painel/planos/page.tsx`, `teste/page.tsx`. Tese "RSC-first" cai — a regra do `AGENTS.md` ("`'use client'` só quando necessário") foi violada na prática. Sem `middleware.ts` nem `proxy.ts` — projeto não usa interceptação de request, e cada handler valida sessão individualmente. APIs async corretas: `await cookies()`, `await params` onde aplicável. Misto entre Server Actions (`src/app/painel/comercial/actions.ts`, 241 linhas) e rotas API REST (`api/*`) sem regra documentada de quando usar cada abordagem.

**Concentração de complexidade**

| Arquivo | Linhas | O que contém |
|---|---|---|
| `src/lib/albums.ts` | 44.781 | Catálogo estático de 13 álbuns (dados JSON) |
| `src/components/loja/store-album-view.tsx` | 1.052 | UI da loja pública + filtro de faltantes |
| `src/components/painel/inventory-manager.tsx` | 1.049 | Gerenciador de estoque do vendedor |
| `src/components/painel/precos-album-editor.tsx` | 823 | Editor de preços por álbum (3 abas) |
| `src/app/onboarding/page.tsx` | 772 | Wizard de onboarding multi-step |
| `src/app/painel/page.tsx` | 571 | Dashboard principal do vendedor |
| `src/components/painel/painel-shell.tsx` | 440 | Shell do painel (sidebar + bottom nav) |
| `src/app/painel/comercial/actions.ts` | 241 | 15 Server Actions do cockpit comercial |
| `src/lib/bot-search.ts` | 141 | Busca de figurinhas para API do bot WhatsApp |
| `src/lib/bot-hmac.ts` | 104 | Validação HMAC para endpoints do bot |

Os arquivos críticos de `lib/` têm tamanho razoável: `price-resolver.ts` (119), `plan-limits.ts` (101), `sticker-types.ts` (84), `auth.ts` (44), `db.ts` (26). A gordura está nos componentes de UI e no catálogo estático.

**Dívida técnica visível**

1. **Sentry instalado, nunca usado** (`BUGS_DESCOBERTOS.md:B1`): `@sentry/nextjs@10.49.0` declarado, `instrumentation.ts` existe, mas `Sentry.captureException` tem 0 chamadas em `src/`. Todos os 24 handlers de API usam `console.error` no fallback. Em produção com Stripe e dados de clientes, isso é observabilidade cega.
2. **Documentação contradiz código nos gates de plano**: `CLAUDE.md` afirma "guards estão temporariamente desabilitados", mas o código real chama `checkStickerLimit` em `src/app/api/inventory/route.ts:43`, `checkAlbumLimit` na linha 55, `checkOrderLimit` em `src/app/api/orders/route.ts:62` e `src/app/api/bot/quote/route.ts:65`, e `hasFeature("custom_prices")` em `src/app/api/prices/route.ts:37`. Os gates estão **ativos**. A dívida é documental — o `CLAUDE.md` está desatualizado.
3. **Suite de testes quase vazia**: 4 arquivos `*.test.ts` com 370 linhas total cobrindo funções puras auxiliares (`country-flags`, `format-breadcrumb`, `onboarding-progress`, `share-templates`). A lógica central (`resolveUnitPrice`, `checkStickerLimit`, handlers de API, webhook Stripe) tem cobertura zero. O `src/__tests__/setup.ts` tem 175 linhas de mocks preparados que nenhum teste usa.
4. **CI não roda lint nem typecheck** (`BUGS_DESCOBERTOS.md:B4`): `.github/workflows/quality-gate.yml` só executa `npm ci` + `npm run build`. O hook pré-commit local roda test+tsc+build, mas a CI servidor não — quem comita sem hook passa.
5. **Página `/teste` em produção** (`BUGS_DESCOBERTOS.md:B5`): `src/app/teste/page.tsx` é rota pública não-protegida.
6. **Senha em texto puro potencialmente no banco** (`BUGS_DESCOBERTOS.md:B2`): `src/app/api/auth/login/route.ts` contém fallback `senha === sellerHash` para sellers que nunca rehasharam. Vendedores que nunca logaram desde a migração podem ter senha em texto puro no campo `Seller.password`.
7. **`albums.ts` como dado estático hard-coded**: 44.781 linhas de JSON como arquivo TypeScript. Sem build step de geração. Cada cold start no Vercel parseia o arquivo. Mudança no catálogo exige edição manual.

**Convenções seguidas**

Async APIs do Next.js 16 corretas onde verificadas. Lazy Proxy no DB (`src/lib/db.ts`) para evitar conexão durante build. Zod em todos os endpoints POST verificados. Sem `any` solto nem `@ts-ignore` em `src/`. Biome configurado como formatador e linter.

## 2. Análise das funcionalidades

### Vendedor (painel — `src/app/painel/`)

- **Cadastro e autenticação** — Registro com nome/email/senha/slug da loja. Login via iron-session (30 dias). Recuperação de senha por email com token. Paths: `src/app/(auth)/`, `src/app/api/auth/*`.
- **Onboarding guiado** — Wizard multi-step (772 linhas) com barra de progresso e 3 campos rastreados (`shopDescription`, `businessHours`, `paymentMethods`). Path: `src/app/onboarding/page.tsx`, `src/lib/onboarding-progress.ts`.
- **Gerenciamento de estoque** — Adicionar/editar/remover figurinhas avulsas por álbum e código. Upsert individual e bulk. Quantidade, tipo (Normal/Especial/Brilhante), preço customizado. Gates de plano ativos. Path: `src/app/painel/estoque/`, `src/components/painel/inventory-manager.tsx`.
- **Álbuns customizados** — Vendedor cria álbuns próprios fora do catálogo Panini estático. Aceita range numérico (`1-670`), range com prefixo (`BRA1-BRA20`) ou lista mista. Slug com prefixo `custom_`. Path: `src/app/painel/estoque/novo/`, `src/lib/custom-albums.ts`.
- **Sistema de preços (3 eixos)** — Editor com 3 abas: tipo de figurinha (global/álbum), seção/país (FLAT ou OFFSET), desconto progressivo por volume (QuantityTier). Hierarquia: `customPrice > sectionRule > albumTypeRule > globalTypeRule > default`. Path: `src/components/painel/precos-*-editor.tsx`, `src/lib/price-resolver.ts`.
- **Gerenciamento de pedidos** — Lista com workflow QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED. Canal SYSTEM ou bot WhatsApp. Path: `src/app/painel/pedidos/`, `src/app/api/orders/route.ts`.
- **Configuração da loja** — Logo, descrição, horário, pagamento, link público copiável. Path: `src/app/painel/loja/`.
- **Planos e assinatura** — Visualização de uso real (figurinhas/pedidos/álbuns) + upgrade Stripe Checkout + Customer Portal. Path: `src/app/painel/planos/page.tsx`, `src/app/api/stripe/*`.

### Cliente (loja pública — `src/app/loja/`)

- **Vitrine do vendedor** — `/loja/[slug]` lista álbuns com estoque + dados da loja + CTA. Path: `src/app/loja/[slug]/page.tsx`, `src/components/loja/store-*.tsx`.
- **Visualização de álbum + compra avulsa** — `/loja/[slug]/[albumSlug]` mostra todas as figurinhas com indicador visual de disponibilidade, preço calculado pelos 3 eixos, carrinho lateral com desconto por quantidade em tempo real. Path: `src/components/loja/store-album-view.tsx` (1.052 linhas).
- **Importação de lista de faltantes** — Cliente cola códigos faltantes e o filtro mostra só o que o vendedor tem. Embutido em `store-album-view.tsx`.
- **Checkout via WhatsApp (bot)** — Pedido criado por bot externo (Dify/n8n) via `POST /api/bot/quote` com HMAC. Status QUOTE — vendedor fecha no chat. Path: `src/app/api/bot/quote/route.ts`, `src/lib/bot-hmac.ts`.

### Admin (cockpit comercial — `src/app/painel/comercial/`)

Acesso restrito por `ADMIN_EMAIL` env var. 7 sub-módulos:

- **Dashboard comercial** — métricas de pipeline, tarefas urgentes, resumo geral.
- **CRM de leads** — pipeline PROSPECT → WON/LOST com log de atividades (CALL, WHATSAPP, EMAIL, MEETING, DEMO, NOTE).
- **Ofertas** — grid de ofertas ativas/pausadas com receita e contagem de vendas.
- **Experimentos de growth** — hipóteses com status PLANNED → RUNNING → COMPLETED/KILLED + resultados.
- **Iniciativas** — kanban 4 colunas (BACKLOG → DONE) com marcos e tarefas vinculadas.
- **Tarefas** — checklist com filtro, vinculável a lead/iniciativa/experimento.
- **KPIs** — métricas com histórico de snapshots, delta e target.

### Infra/transversal

- **Galeria pública de álbuns** — `/albuns/[year]/` mostra catálogo estático Panini.
- **Webhook Stripe** — processa 4 eventos (`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `customer.subscription.updated`). Atualiza plano + datas + log em `SubscriptionEvent`. Path: `src/app/api/stripe/webhook/route.ts`.
- **Busca de figurinhas para bot** — `GET /api/bot/stickers` retorna catálogo filtrado por slug + disponibilidade. Path: `src/lib/bot-search.ts`.
- **Admin de revendedores** — listagem interna de todos os vendedores com plano. Path: `src/app/painel/admin/revendedores/`.

## 3. Análise das dores resolvidas

- **Vendedor não tem como expor estoque organizado para clientes** → resolvida pelo gerenciamento de estoque + vitrine pública. Antes era foto de planilha ou lista de texto no WhatsApp; agora `/loja/[slug]/[albumSlug]` mostra tudo com preço sem o vendedor responder cada pergunta.
- **Cliente não sabe quais das figurinhas faltantes o vendedor tem** → resolvida pela importação de lista de faltantes. Cliente cola códigos e filtro elimina tudo que o vendedor não tem. Sem isso, é "você tem a BRA7?" 50 vezes por venda.
- **Vendedor tem tabela de preços diferente por tipo (foil > regular) e por seção (países específicos)** → resolvida pelos 3 eixos de preço. Sem isso, o vendedor calculava na hora ou cobrava tudo igual e perdia margem nas especiais.
- **Desconto por volume é negociado manualmente em cada pedido** → resolvido pelos QuantityTiers. Aplicado automaticamente conforme quantidade.
- **Vendedor revende álbuns fora do catálogo padrão FIFA/Panini** → resolvida pelos álbuns customizados (range, prefixo, lista mista).
- **Pedidos chegam via WhatsApp e somem na conversa** → resolvido pelo workflow QUOTE → DELIVERED com nome, itens, valor, canal de origem.
- **Vendedor não sabe qual plano contratar nem quanto está usando** → resolvida pela página de planos com uso real (contadores antes dos limites).
- **Bot WhatsApp não consegue criar pedidos programaticamente com segurança** → resolvida pela API do bot com HMAC + janela anti-replay de 5 min.
- **Operador do produto não tem visão do funil B2B (novos revendedores)** → resolvida pelo cockpit comercial (CRM + experimentos + KPIs).
- **Operador não sabe quando assinatura Stripe cancela ou renova** → resolvida pelo webhook + log em `SubscriptionEvent`. Plano atualizado automaticamente nos 4 eventos.

## 4. Análise comercial

**Modelo de monetização**

Assinatura mensal em 3 tiers (preços hardcoded em `src/app/painel/planos/page.tsx:8-43` e em centavos em `src/lib/stripe.ts:19-35`):

| Plano | Preço | Limite figurinhas | Pedidos/mês | Álbuns | Features exclusivas |
|---|---|---|---|---|---|
| FREE (Starter) | R$ 0 | 100 | 10 | 1 | Vitrine básica |
| PRO | R$ 29/mês | 1.000 | 100 | 13 | WhatsApp, preços custom |
| UNLIMITED | R$ 59/mês | Ilimitado | Ilimitado | 13 | Relatórios, suporte prioritário |

Pagamento via Stripe Checkout (`mode: subscription`). Price IDs lidos de env vars `STRIPE_PRICE_PRO` e `STRIPE_PRICE_UNLIMITED` — se não configurados, checkout retorna 500 (`src/app/api/stripe/checkout/route.ts:20-25`). Downgrade e cancelamento via Customer Portal.

**Estado real dos gates de monetização**

Os gates estão **ativos no código** — não desabilitados como o `CLAUDE.md` afirma. Confirmado em `api/inventory/route.ts:43-55`, `api/orders/route.ts:62`, `api/prices/route.ts:37`. Um vendedor FREE que tente adicionar a 101ª figurinha ou o 11º pedido do mês recebe `plan_limit` com `upgrade_url: "/painel/planos"`. Monetização por limite operacional.

**Sinais de tração visíveis no código**

- `SubscriptionEvent.stripeEventId @unique` indica que pelo menos uma assinatura foi testada de verdade.
- Seed em `api/comercial/seed/route.ts` popula 15+ tarefas/leads/KPIs/experimentos com conteúdo específico ("Restaurar checkStickerLimit", "Escrever copy da landing page") — cockpit foi usado ativamente pelo operador.
- Vercel Analytics + Speed Insights instrumentados — operador monitora uso real.
- `Seller.onboardingStep Int @default(0)` com lógica de progresso implementada — preocupação com conversão de novos registros.

**Segmentação evidente**

- **Revendedor profissional** (alvo PRO/UNLIMITED): volume > 100, multi-álbum, integração WhatsApp bot, preços customizados por seção. Plataforma como ferramenta de trabalho.
- **Revendedor hobby** (alvo FREE): estoque pequeno, 1 álbum, sem necessidade de automação. Pode nunca converter — limite de 100 figurinhas é baixo o suficiente para sentir o teto rápido.

Sem evidência de B2B (lojistas físicos) no código — modelo é B2C onde o "cliente" do produto é o revendedor pessoa física.

**Custos e riscos técnicos**

- Neon Postgres com WebSocket Pool mantém conexões persistentes; sem evidência de configuração de connection limit — em escala, atinge limites Neon antes de perceber.
- Stripe fees (~3-4%) reduzem margem especialmente no PRO de R$ 29.
- `albums.ts` (44.781 linhas) importado em múltiplas rotas server-side — cada cold start parseia. Sem cache nem lazy loading.
- `STRIPE_PRICE_PRO`/`STRIPE_PRICE_UNLIMITED` lidos diretos de `process.env` (não passam pela validação Zod de `src/lib/env.ts`) — falha silenciosa com 500 se não configurados.

## 5. Pesquisa de mercado

### a. Concorrentes diretos

**Definição usada:** plataformas que resolvem o mesmo Job to Be Done central — permitir que um revendedor de figurinhas avulsas Panini/similares gerencie estoque e receba pedidos de clientes finais.

1. **Panini "Complete sua Coleção" (canal direto B2C)** — [panini.com.br/colecionaveis/complete-sua-colecao](https://panini.com.br/colecionaveis/complete-sua-colecao). Panini vende avulsas direto ao colecionador (R$ 0,80–1,98/unidade). Sem assinatura. Não habilita revendedor terceiro; sem álbuns customizados; sem CRM; sem foil/shiny de terceiros.
2. **Mercado Livre — figurinhas avulsas** — [lista.mercadolivre.com.br/figurinha-panini](https://lista.mercadolivre.com.br/figurinha-panini). Marketplace generalista, comissão 11–16% + frete. Snippet de busca menciona ~7.874 vendedores na categoria (não verificado). Sem gestão por código/tipo de figurinha; sem upload de lista de faltantes; sem álbuns customizados.
3. **Shopee — figurinhas avulsas** — [shopee.com.br/search?keyword=figurinhas](https://shopee.com.br/search?keyword=figurinhas). Mesmo padrão do ML; público mais jovem; mesmas lacunas.
4. **TrocaFigurinhas.com** — [trocafigurinhas.com](https://trocafigurinhas.com/). Comunidade de troca peer-to-peer gratuita há ~20 anos; monetização parcial via "figuretas". Foco em colecionador hobby — não suporta venda monetária nem revendedor profissional.
5. **Loja das Figurinhas / Mundo das Figurinhas** — [lojadasfigurinhas.com.br](https://www.lojadasfigurinhas.com.br/) e [mundodasfigurinhas.com.br](https://mundodasfigurinhas.com.br/). E-commerce de operador único; não é marketplace para múltiplos revendedores.
6. **Portal do Colecionador** — [portaldocolecionador.com.br](https://portaldocolecionador.com.br/). E-commerce de proprietário único (figurinhas + vinil + Pokémon). Não é plataforma para terceiros.
7. **StickerManager.com (global)** — [stickermanager.com/en](https://www.stickermanager.com/en). 4.200+ coleções, 291k usuários ativos, 3M trocas. Inglês/alemão apenas, sem PT-BR, sem venda monetária, sem revendedor.
8. **LastSticker.com (global)** — [laststicker.com](https://www.laststicker.com/). Plataforma de troca para Panini/Topps. Acesso retornou 403, mas perfil análogo ao StickerManager.
9. **Panini Collectors App (oficial)** — [Google Play](https://play.google.com/store/apps/details?id=com.panini.collectors). App gratuito de tracking + compra direta via PayPal. Canal exclusivo Panini, não habilita terceiros.

### b. Concorrentes indiretos

1. **Marketplaces generalistas (ML, Shopee) sem especialização** — canal mais usado hoje pelos revendedores informais; tratam figurinha como qualquer produto, sem código/tipo/lista de faltantes.
2. **Grupos de WhatsApp/Telegram + planilha Google Sheets** — modelo dominante no informal. Mais de 15.638 links de grupos dedicados a figurinhas em [gruposwhats.app](https://gruposwhats.app/category/figurinhas-e-stickers). Custo zero, sem checkout, sem rastreamento, sem loja pública.
3. **ERPs genéricos (Bling, Tiny)** — [bling.com.br](https://www.bling.com.br/), [tiny.com.br](https://tiny.com.br/). Usados por revendedores com volume; emitem NF, integram com ML. Não entendem o domínio (sem tipo regular/especial/shiny, sem lógica de álbum, sem filtro de faltante).
4. **Venda Panini B2B (varejistas)** — [venda.panini.com.br](https://venda.panini.com.br/). Canal upstream para varejistas (frete grátis só >R$ 2.500 e só Sudeste).
5. **Monefu — App Figurinhas (white label)** — [monefu.com/app-figurinhas](https://monefu.com/app-figurinhas). White label para criadores de conteúdo distribuírem figurinhas digitais de WhatsApp (R$ 149–799/mês). Não é venda física de Panini, mas ocupa o vocabulário "app de figurinhas" no Brasil.

### c. Tamanho de mercado

- **Panini Group global**: receita de €1,9 bi em 2024 ([Manga Brasil](https://mangasbrasil.com.br/noticias-grupo-panini-estuda-venda/)). Contrato exclusivo FIFA até 2030. Produção global > 5 bi figurinhas/ano.
- **Brasil é o maior mercado de figurinhas da Copa**: 53% dos colecionadores do álbum digital eram brasileiros em 2014 ([Relatório Reservado](https://relatorioreservado.com.br/noticias/brasil-e-figurinha-carimbada-nos-negocios-da-panini/)).
- **Copa 2014**: 8 milhões de colecionadores estimados no Brasil; potencial de R$ 1 bi ([Exame, 2014](https://exame.com/negocios/como-a-panini-pode-faturar-r-1-bi-com-as-figurinhas-da-copa/)).
- **Copa 2026**: 11 milhões de figurinhas/dia em produção ([CNN Brasil](https://www.cnnbrasil.com.br/esportes/futebol/copa-do-mundo/album-da-copa-2026-11-milhoes-de-figurinhas-sao-produzidas-ao-dia/)). Rede Leitura espera R$ 140 milhões só com figurinhas ([Exame](https://exame.com/negocios/album-da-copa-maior-livraria-do-brasil-quer-faturar-r-140-milhoes-com-figurinhas/)). Bancas crescem até 347% no faturamento em Copa ([Máquina do Esporte](https://maquinadoesporte.com.br/futebol/faturamento-de-bancas-cresce-ate-347-com-figurinhas-da-copa-do-mundo-diz-pesquisa/)).
- **Álbum Copa 2026 — 980 figurinhas (recorde), 68 especiais, 48 seleções**, lançamento 30/04/2026. Pacote R$ 7,00 (R$ 1,00/unidade). Custo real para completar com duplicatas: R$ 4.298–7.363, podendo passar de R$ 18 mil em cenário adverso ([CNN Brasil](https://www.cnnbrasil.com.br/economia/macroeconomia/copa-2026-completar-album-de-figurinhas-pode-custar-mais-de-r-7-mil/)). **Justifica enorme mercado secundário de avulsas**.
- **Sazonalidade**: Copa = pico (ciclo 4 anos). Brasileirão, Champions, álbuns de entretenimento (Disney, Marvel, Dragon Ball) sustentam demanda contínua menor.
- **Segmentação colecionador**: primário 8-11 anos; secundário homens 18+ com renda. Revendedor hobby (PF) × profissional (MEI/PJ). Número de revendedores profissionais ativos: **(fonte não encontrada)**.

### d. Lacunas de mercado

1. **Nenhuma plataforma SaaS especializada para revendedor de figurinhas avulsas existe no Brasil.** 10+ queries não retornaram nada equivalente — vendedor profissional brasileiro hoje usa ML/Shopee genéricos ou WhatsApp + planilha + Pix manual. Vácuo claro entre "planilha no grupo" e "anúncio no Mercado Livre".
2. **Nenhum canal suporta "cliente envia lista de faltantes"** — nem ML, nem Shopee, nem TrocaFigurinhas, nem StickerManager. P8 já tem (`store-album-view.tsx`).
3. **Figurinhas especiais (foil/shiny) tratadas como produto genérico em ML/Shopee** — sem estrutura de tipo, sem precificação diferenciada automatizada. Mercado de raras (Neymar gerou ~mil anúncios no ML) é grande mas sem plataforma especializada.
4. **Plataformas globais excluem o Brasil** — StickerManager (291k users) e LastSticker não têm PT-BR, álbuns brasileiros (Brasileirão, Copa América), nem pagamentos locais (Pix).
5. **Canal oficial Panini não habilita revendedor independente** — "Complete sua Coleção" compete direto com revendedor; `venda.panini.com.br` é B2B varejista (frete grátis só >R$ 2.500 + só Sudeste). Não há ponte estruturada entre revendedor independente (que comprou pacotes e quer monetizar repetidas) e colecionador final.

## 6. Síntese da Phase 1

Phase 1 mapeou: TypeScript em Next.js 16 + React 19 + Prisma 7 sobre Neon Postgres, com 164 arquivos TS/TSX em `src/`, 24 rotas API e 18 modelos Prisma; produto cobre 3 superfícies (vendedor → painel, cliente → loja pública, admin → cockpit comercial 7 sub-módulos); monetização Stripe em 3 tiers (R$ 0/29/59) com gates **ATIVOS** (apesar do `CLAUDE.md` afirmar o contrário). Pesquisa de mercado não encontrou nenhum SaaS direto equivalente no Brasil — concorrência é ML/Shopee genéricos, planilhas em grupos WhatsApp, e plataformas globais de troca (sem PT-BR e sem venda monetária); P8 é potencialmente o **único produto especializado para revendedor profissional brasileiro de figurinhas avulsas**. 3 personas distintas mapeadas: Rodrigo (profissional, 400-800/mês, alvo PRO), Camila (hobby, 80-180/mês, vive no FREE), Paulo (colecionador comprador, valor indireto). Dor central convergente nas 3: tempo de resposta a cliente sobre disponibilidade de estoque.

## 7. Persona do dono do projeto

**alexmendes92** — handle GitHub, email `contato@arenacards.com.br`, workspace Arena Cards com 13 projetos ativos.

O perfil técnico é de desenvolvedor sênior/fullstack que escolhe conscientemente estar na ponta do stack: Next.js 16.2.4 (dias após lançamento), Prisma 7.7, Zod 4.3, React 19 com React Compiler, Tailwind 4 CSS-first, Biome 2.4. Não são escolhas por modismo — exigem leitura de changelogs e tolerância a breaking changes. O `AGENTS.md` foi escrito para forçar o próprio agente IA a não assumir que Next.js funciona "como sempre" — sinal de quem já levou breaking change na cara e aprendeu a documentar.

O modelo mental do produto é inequivocamente "negócio escalável com distribuição digital". O cockpit comercial tem 7 sub-módulos operacionais (CRM com `hypothesis → result → decision`, iniciativas em kanban, KPIs com snapshots históricos) — não é hobby, é infraestrutura para operar SaaS. `DOCUMENTACAO_NEGOCIO_MONETIZACAO.md` menciona explicitamente o pico Copa 2026 como janela e define ICP/posicionamento. Urgência real: produto precisa estar monetizando antes de junho/2026.

**6 traços marcantes:**

- **Bleeding edge intencional, não acidental.** Atualiza deps ativamente (`chore(deps): bump next 16.2.1→16.2.4 ... prisma 7.5→7.7`) e documenta breaking changes em `AGENTS.md` próprio.
- **ADR + documentação de decisão como hábito.** `docs/workspace/adr/`, `PLANO_SAAS_V2.md` com "verificado no código" literal, `ANALISE_UX_IMPLEMENTACAO.md`, `UX_AUDIT_REPORT.md`. Documenta porquê e trade-off, não o quê.
- **Obsessão com qualidade operacional antes de feature.** Hook pré-commit roda test+tsc+build em sequência. Commit `chore(hooks): fortalece pre-commit com test e tsc antes do build` indica reforço por decisão ativa.
- **Produto construído para nicho que ele conhece.** Arena Cards é o negócio principal — figurinhas, Copa, WhatsApp como canal. Provavelmente é/foi vendedor ou atende vendedores de dentro do Arena Cards.
- **Visão de longo prazo disfarçada de urgência.** Plano v2 datado 03/04/2026, Copa 2026 como janela, mas `BizLead`/`BizExperiment`/`BizKpi` com snapshots históricos = estrutura para operar por anos.
- **Workspace multi-projeto como estratégia, não bagunça.** 13 projetos ativos com portas dedicadas, `AGENTS.md` por projeto, regras globais vs locais. Construiu infraestrutura de trabalho antes de construir features.

## 8. Personas de usuário

### Persona 1 — Rodrigo, 34 anos, São Paulo (Grande SP)

- **Ocupação real:** auxiliar administrativo em empresa de logística, 8h/dia. Figurinhas são renda complementar real.
- **Como descobriu:** colecionou Copa 2018, sobrou figurinha repetida, vendeu no grupo de WhatsApp da faculdade. Em 2022 montou estoque para Qatar, faturou suficiente para a viagem de férias. Em 2026, quer escalar.
- **Volume mensal:** 400-800 figurinhas em alta temporada, 50-150 em baixa. 3-4 álbuns paralelos em alta.
- **Stack atual:** Google Sheets (uma aba/álbum). Vende via grupo WhatsApp (120 membros) e Instagram Stories. Anotações em bloco de notas. PIX, sem sistema de pedidos.
- **Dor #1:** cliente manda "tem a BRA-5?" às 22h. Está no ônibus, planilha trava no celular, demora 4 min pra responder. Cliente comprou de outro. Acontece 10-15× por semana.
- **Bloqueio para escalar:** sem vitrine organizada, volume de atendimento manual não escala.
- **Valoriza:** resposta rápida ao cliente, aparência de loja profissional, controle de pedidos em aberto.
- **NÃO valoriza:** relatório bonito, gráfico de conversão, integração com marketplace, configuração que demora >10 min.
- **Pagaria:** R$ 25-35/mês. Compara mentalmente com 3-4 vendas perdidas por semana.

### Persona 2 — Camila, 27 anos, Curitiba (PR)

- **Ocupação real:** estudante de nutrição, estágio meio período. Vende figurinhas para pagar a coleção própria + dinheiro extra.
- **Como descobriu:** comprava envelope diariamente, acumulou repetidas, amiga sugeriu vender no grupo. Não pensa como empresa — é "renda de figurinha".
- **Volume mensal:** 80-180 figurinhas. 1 álbum ativo. Opera só com novidades.
- **Stack atual:** caderno físico (lista por álbum, risca quando vende). Foto do caderno postada no Stories. DM Instagram para combinar. Sem controle formal.
- **Dor #1:** vende a mesma figurinha para duas pessoas, pede desculpa e devolve dinheiro. Já aconteceu 3 vezes. Foto do caderno no Stories é feia.
- **Bloqueio para escalar:** **não quer escalar** — quer parar de errar e parecer mais sério. FREE 100/1 cobre o volume.
- **Valoriza:** zero configuração, link bonito para Stories, atualização rápida pelo celular.
- **NÃO valoriza:** preço por seção, desconto por quantidade, relatórios, painel com >3 opções visíveis.
- **Pagaria:** R$ 0-15. Usuária natural do FREE. Vira PRO só se sentir teto de 100 na Copa.

### Persona 3 — Paulo, 41 anos, Belo Horizonte (MG)

- **Ocupação real:** colecionador. Não é vendedor — é comprador recorrente.
- **Como usa o produto:** acessa `/loja/[slug]/[albumSlug]` de 3-4 vendedores diferentes. Está montando Copa 2026, precisa de figurinhas específicas que não acha em banca.
- **Comportamento de compra:** mobile, filtra códigos faltantes, monta cesta, fecha pelo WhatsApp. R$ 40-80 por compra a cada 10-15 dias.
- **Dor #1:** maioria dos vendedores não tem vitrine. Manda mensagem 14h, recebe 22h "vou verificar". Perdeu interesse. Quem tem vitrine atualizada vira fornecedor recorrente.
- **Bloqueio para comprar mais:** confiança. Vitrine "10 em estoque" + vendedor responde "acabou" = nunca mais usa aquela loja.
- **Valoriza:** filtro por lista faltante, preço claro, vitrine rápida no celular, ver estoque sem perguntar.
- **NÃO valoriza:** criar conta, cadastro, pagamento online (prefere Pix direto).
- **Pagaria:** nada. É usuário gratuito; valor é indireto — quanto mais Paulos satisfeitos, mais Rodrigos/Camilas pagam.

## 9. Checklist de perguntas

1. ⭐ Como você controla hoje quais figurinhas tem disponíveis para venda? Me mostra o processo passo a passo. *(Personas 1 e 2)*
2. Quando um cliente te pergunta se você tem uma figurinha específica, quanto tempo você demora para responder? O que você faz nesse intervalo? *(Personas 1 e 2)*
3. ⭐ Já perdeu venda porque demorou pra responder, ou porque informou estoque errado? Com que frequência? *(Personas 1 e 2)*
4. Como você divulga seu estoque hoje? Foto, lista de texto, link, grupo? Me mostra como fica. *(Personas 1 e 2)*
5. Quando você tem um pedido combinado, como você registra? O que acontece quando você esquece? *(Personas 1 e 2)*
6. Você já tentou usar alguma ferramenta diferente (planilha mais elaborada, Bling, Tiny, Shopify)? O que funcionou, o que não funcionou? *(Personas 1 e 2)*
7. ⭐ O que faria você parar de usar uma ferramenta nova depois de 2 semanas de uso? O que já aconteceu antes? *(Personas 1 e 2)*
8. Quanto tempo por dia você gasta respondendo mensagem de cliente sobre disponibilidade? *(Personas 1 e 2)*
9. Você tem noção de quanto faturou com figurinhas no último mês? De onde vem esse número? *(Personas 1 e 2)*
10. Se você tivesse uma vitrine online com seu estoque atualizado em tempo real, por qual canal você mandaria o link primeiro? *(Personas 1 e 2)*
11. Você compra de mais de um revendedor? Como você decide de quem comprar quando precisa de uma figurinha específica? *(Persona 3)*
12. Já ficou sem resposta antes de perder o interesse? Com que frequência? *(Persona 3)*
13. Quando você acessa a vitrine de um revendedor online, o que você olha primeiro? O que te faz fechar a compra ali? *(Persona 3)*
14. Você já usou a função de "colar lista de faltantes" numa vitrine? Se sim, como foi — se não, por quê? *(Persona 3)*
15. O que faria você recomendar um revendedor específico para outros colecionadores? *(Persona 3)*

## 10. Entrevista simulada

### Persona 1 — Rodrigo (vendedor profissional)

**P1.** "Tenho uma planilha no Google Sheets, uma aba para cada álbum. Cada linha é um código de figurinha, coluna B tem a quantidade. Funciona quando estou no notebook. No celular é um horror — fica carregando, a aba trava." **Confiança: Alto** (workflow documentado em `DOCUMENTACAO_NEGOCIO_MONETIZACAO.md`).

**P2.** "No notebook, 1-2 minutos. No celular, 4-5 min. À noite no ônibus às vezes só respondo quando chego em casa, 40 min depois. Já perdi venda assim." **Confiança: Alto**.

**P3.** "Sim, umas 10 vezes no último mês. 4 vezes porque esqueci de atualizar a planilha. As outras foram demora — o cara comprou de outro." **Confiança: Médio** (frequência estimada).

**P4.** "Posto foto de uma lista que montei no Word. Não fica bonito mas o pessoal do grupo entende. Vivo escravo de atualizar." **Confiança: Alto**.

**P5.** "Bloco de notas do celular, ou conversa do WhatsApp como referência. Já entreguei a mesma figurinha pra dois clientes." **Confiança: Médio**.

**P6.** "Tentei Shopify uma vez, ficou 2 dias e desisti — muito complexo. Mercado Livre a taxa come o lucro." **Confiança: Médio**.

**P7.** "Configuração inicial chata. Não funcionar bem no celular. Importar figurinha uma por uma. Demora pra ver resultado." **Confiança: Alto**.

**P8.** "1h30 a 2h distribuídas no dia. A maioria é pergunta de disponibilidade que podia ser evitada." **Confiança: Médio**.

**P9.** "Mais ou menos. Olho extrato do PIX e somo mentalmente. R$ 800-1.200 em mês bom." **Confiança: Médio**.

**P10.** "Grupo do WhatsApp, com certeza. 120 pessoas que já compram. Depois Stories Instagram." **Confiança: Alto**.

### Persona 2 — Camila (hobby)

**P1.** "Caderno físico. Uma lista por álbum. Risco quando vendo, adiciono quando sobra. Não fico abrindo caderno quando estou com pressa de responder." **Confiança: Alto**.

**P2.** "Vejo no Stories quando estou em casa, respondo na hora. Se estiver no estágio, só à noite. 6-8 horas de delay às vezes." **Confiança: Alto**.

**P3.** "Vendi a mesma figurinha pra duas pessoas 3 vezes. Devolvi dinheiro de uma. É o que mais me incomoda." **Confiança: Alto**.

**P4.** "Foto do caderno no Stories. Fica feio mas funciona." **Confiança: Alto**.

**P5.** "DM do Instagram como referência. Lembrete no iPhone se for muita gente." **Confiança: Médio**.

**P6.** "Nunca. Nunca me ocorreu que existe sistema pra isso." **Confiança: Baixo** (inferência).

**P7.** "Configurar muito. Celular não funcionar. Cadastrar 670 figurinhas uma por uma — não vou fazer." **Confiança: Alto** (P8 já tem bulk em `api/inventory/setup`).

**P8.** "30 min/dia em alta. Fora de temporada quase nada." **Confiança: Médio**.

**P9.** "R$ 200-300 em mês bom. É o que sobra depois dos envelopes." **Confiança: Médio**.

**P10.** "Stories do Instagram. Link na bio também." **Confiança: Alto**.

### Persona 3 — Paulo (colecionador comprador)

*(Perguntas 11-15 — perfil comprador.)*

**P11.** "Tenho 4-5 vendedores no WhatsApp. Mando pro que respondeu mais rápido da última vez. Se tiver vitrine online, começo por ela porque já sei se tem ou não." **Confiança: Alto**.

**P12.** "Todo dia quase. Mando, fico esperando, 5 horas depois responde. Já comprei de outro ou perdi interesse." **Confiança: Alto**.

**P13.** "Primeiro verifico se tem as figurinhas que preciso. Busca fácil = fico. Se tiver que rolar pra encontrar BRA-15, desisto. Fecho se preço claro + WhatsApp fácil." **Confiança: Alto**.

**P14.** "Nunca ouvi falar. Se funciona — colar lista e filtrar — é exatamente o que eu precisaria. Minha lista fica no app do álbum." **Confiança: Baixo** (descoberta da feature é incerta).

**P15.** "Ele ter respondido certo. Vitrine 'tem 5' e chegaram 5 = recomendado. Vitrine organizada que me deixou achar sozinho. Rapidez no envio." **Confiança: Alto**.

## 11. Comparação sistema vs realidade

### Divergência 1 — "0 ocorrências de `'use client'`" é factualmente falsa
**Afirmação do relatório (seção 1):** "0 ocorrências de `'use client'` em `src/`". Repete em `AUDIT.md`.
**Código real:** Grep retorna **43 arquivos** com `'use client'`, incluindo `inventory-manager.tsx`, `cart-drawer.tsx`, `precos-album-editor.tsx`, `app-shell.tsx`, `cart-context.tsx`, `painel/planos/page.tsx`, todas as 5 páginas `(auth)/` e `teste/page.tsx`.
**Tipo:** Contradição direta. **Severidade:** Alta — argumento "Server Components como padrão" cai. Projeto é majoritariamente Client Components nos pontos críticos de UX (estoque, carrinho, preços, autenticação). _(Seção 1 do relatório foi corrigida na consolidação Phase 2.)_

### Divergência 2 — `/api/bot/quote` confia em `unitPrice` enviado pelo cliente externo
**Afirmação:** seção 3 — "Bot WhatsApp não consegue criar pedidos programaticamente com segurança → resolvida pela API do bot com HMAC + janela anti-replay de 5 min".
**Código real (`src/app/api/bot/quote/route.ts:73-97`):** o handler recebe `items[].unitPrice` no payload, multiplica por quantidade, salva no `Order` e devolve. **Não chama `resolveUnitPrice`, não decrementa inventário, não valida que a figurinha existe no estoque do seller, nem que o preço bate com o `price-resolver`.** HMAC só garante autenticidade — não corrige payload falsificado por quem tem o segredo.
**Tipo:** Superestima. **Severidade:** Alta — qualquer integrador pode mandar `unitPrice: 0,01` e criar pedido válido. Não é "segurança resolvida".

### Divergência 3 — Página `/teste` é E2E destrutivo, não "playground"
**Afirmação:** seção 1 item 5 — "rota pública não-protegida". `BUGS_DESCOBERTOS.md:B5` descreve como "playground/debug".
**Código real (`src/app/teste/page.tsx:1-80`):** é runner E2E client-side com 12 steps que **cria conta de vendedor real** (`email: teste${Date.now()}@figurinhaspro.com`, senha hardcoded `Teste@123`), faz login, mexe em preços, adiciona estoque, cria pedido. Cada execução polui o banco prod com `Seller` novo + Inventory + Order de teste. Sem rate limit.
**Tipo:** Subestima. **Severidade:** Alta — é botão público que polui produção a cada clique.

### Divergência 4 — Webhook Stripe omite eventos sem `metadata.sellerId`
**Afirmação:** seção 2 — "Webhook Stripe — processa 4 eventos. Atualiza plano + datas + log em `SubscriptionEvent`".
**Código real (`src/app/api/stripe/webhook/route.ts:38-49`):** o log em `SubscriptionEvent` **só é criado se `metadata.sellerId` está presente**. Eventos sem metadata (ex: `invoice.payment_succeeded` em retry, ou objetos sem subscription) **não são logados nem capturados**. O `else` é silencioso.
**Tipo:** Superestima. **Severidade:** Média — funciona no caminho feliz; trilha de auditoria incompleta nos casos de borda.

### Divergência 5 — Tração comercial "sustentada em seed é confundir cenário com palco"
**Afirmação:** seção 4 — "cockpit foi usado ativamente pelo operador" / "pelo menos uma assinatura foi testada".
**Código real (`src/app/api/comercial/seed/route.ts:280-289`):** o seed popula leads/milestones com texto **`"Restaurar checkStickerLimit"`, `"Restaurar checkAlbumLimit"`, `"Restaurar checkOrderLimit"`** — meta-comentário sobre o próprio backlog interno, não dados de operação. Nenhum `BizKpiSnapshot` automático com Stripe MRR ou `Seller.count`. `SubscriptionEvent.stripeEventId @unique` garante apenas que pelo menos um evento entrou — pode ter sido teste do dono.
**Tipo:** Superestima. **Severidade:** Alta — "tração comercial" via seed é teatro.

### Divergência 6 — Suite de testes não é "quase vazia": é setup elaborado para teatro
**Afirmação:** seção 1 item 3 — "4 testes em utilitários inertes; setup tem 175 linhas de mocks que ninguém usa".
**Detalhe omitido:** o hook pré-commit afirma rodar `npm run test`, mas **CI servidor (`quality-gate.yml`) não roda test**. Quem comita com `--no-verify` ou via PR direto não tem nenhum gate. O setup com 18 modelos Prisma + Stripe sugere intenção (ADR 0005, Fase 5c rollout no `CLAUDE.md`) mas não execução.
**Tipo:** Subestima. **Severidade:** Média.

### Divergência 7 — Doc desatualizada não é só ruído: o seed prova que operador acreditava estar desligado
**Afirmação:** seção 1 item 2 — "`CLAUDE.md` está desatualizado, dívida documental".
**Código real:** seed popula milestones `"Restaurar checkStickerLimit"` com status `DONE`, `IN_PROGRESS`, `PENDING` — operador tinha em mente restauração parcial, mas código tem todos 3 ativos. Ou o seed também está desatualizado, ou doc reflete realidade temporária que código já passou. Sintoma de operador que perdeu a fonte da verdade.
**Tipo:** Subestima. **Severidade:** Média.

### Divergência 8 — Sentry "nunca usado" é inexato; está parcialmente ativo
**Afirmação:** seção 1 item 1 — "0 chamadas `Sentry.captureException` em src/".
**Código real (`instrumentation.ts:13` + `next.config.ts:12`):** `withSentryConfig` envolve `nextConfig` e `instrumentation.ts` exporta `onRequestError = Sentry.captureRequestError`. Erros não-tratados (uncaught) em rotas API **são enviados ao Sentry automaticamente** pelo runtime Next.js 16. O que falta é capturar caminhos onde handler **engole o erro** com `try/catch` + `console.error` + `return 500` (ex: `api/auth/login/route.ts:57`).
**Tipo:** Subestima a parte que funciona, mas também subestima o problema (handlers silenciam erros antes do `onRequestError`). **Severidade:** Média.

### Divergência 9 — Connection pool Neon: especulação tratada como sinal técnico
**Afirmação:** seção 4 — "atinge limites Neon antes de perceber".
**Realidade:** Lazy Proxy com `PrismaNeon({ connectionString })` sem opções customizadas — usa defaults. Em Vercel serverless, cada invocation cria conexão WebSocket; pool Neon (default 100 em pago) cobre uso pequeno. Risco real, mas vendido como gravidade que ainda não se materializou.
**Tipo:** Especulação apresentada como sinal. **Severidade:** Baixa — devia ser qualificada com "(especulação, depende de tráfego)".

### Divergência 10 — "Obsessão com qualidade operacional" não é enforçada pelo CI
**Afirmação:** seção 7 traço 3 — "Hook pré-commit roda test+tsc+build em sequência".
**Código real (`.github/workflows/quality-gate.yml`):** CI servidor só roda `npm ci && npm run build`. Sem lint, sem test, sem `tsc --noEmit`. `npm run test` no pré-commit é fácil de pular com `--no-verify` ou commit direto na UI do GitHub. "Test" hoje significaria 0 arquivos de lógica core. Hook pré-commit é só do desenvolvedor; PR de outra máquina entra com gate vazio.
**Tipo:** Superestima a "obsessão". **Severidade:** Média.

## 12. Paralaxe cognitiva do dono

### Ilusão 1 — "Suite de testes existe e está em rollout (Fase 5c)"
**Como o dono enxerga (seção 7 + CLAUDE.md):** "Obsessão com qualidade operacional", ADR 0005 Fase 5c Rollout, setup com 175 linhas de mocks Prisma+Stripe, hook pré-commit que roda `npm run test`.
**O que os dados mostram:** 4 testes / 370 linhas em utilitários inertes (formato breadcrumb, country-flags). Cobertura efetiva da lógica de negócio: zero. Setup tem mocks para 18 modelos que nenhum teste consome. CI não roda test.
**Custo da ilusão:** quando dono diz "Restaurar checkStickerLimit", não tem teste de regressão pra confirmar que ainda funciona. Cada deploy é confiança no `next build` — que não pega bug de domínio (preço errado, limite ignorado, decremento de inventário inexistente). Atrasa qualquer cirurgia em `albums.ts` (CIRURGIA_CANDIDATES.md #1) porque "rede de caracterização" é pré-requisito formal mas não existe.
**Severidade:** Alta.

### Ilusão 2 — "Cockpit comercial é estrutura para operar SaaS (já está operando)"
**Como o dono enxerga:** 7 sub-módulos operacionais, "operador foi usado ativamente", Vercel Analytics + Speed Insights monitorando "uso real".
**O que os dados mostram:** 18 modelos no banco; seed popula leads com nomes fictícios e milestones que descrevem o **próprio backlog interno**. Nenhum sinal de `BizKpiSnapshot` populado por job automático com Stripe MRR ou `Seller.count`. Sem evidência quantitativa de quantos sellers existem hoje. `SubscriptionEvent.stripeEventId @unique` indica que pelo menos um evento entrou — pode ter sido teste.
**Custo da ilusão:** dono construiu UI de operar antes da operação existir. CRM sem leads. Experimentos sem experimentos rodando. KPIs sem snapshots automáticos. Atrasa feature que move agulha (decrementar inventário no checkout do bot, capturar webhook Stripe, observability básica) porque tempo foi para o painel de comando de uma operação que ainda não opera.
**Severidade:** Alta.

### Ilusão 3 — "Bleeding edge intencional" é decisão sem custo visível
**Como o dono enxerga:** "Atualiza deps ativamente e documenta breaking changes em `AGENTS.md`".
**O que os dados mostram:**
- `AGENTS.md` literal: "This is NOT the Next.js you know" — disclaimer que o **próprio dono escreveu para o agente IA não inventar código**.
- 43 arquivos com `'use client'` contradizem RSC-first do `AGENTS.md`. Regra "Server Components são o padrão" foi violada na prática a ponto do **próprio relatório de análise contar 0** — ruído da decisão é tal que nem agente analítico enxergou.
- `albums.ts` 44.781 linhas contradiz "arquivos até 500 linhas".
**Custo:** "intencional" sugere benefício > custo. Custos não-contabilizados: cirurgia em `albums.ts` (CIRURGIA_CANDIDATES.md #1) é breaking — escolha de stack agrava migração. React Compiler ativo significa `useMemo`/`useCallback` "desnecessários", mas em 43 Client Components com `store-album-view.tsx` de 1.052 linhas, é confiança em compilador não-validado nesse domínio.
**Severidade:** Média.

### Ilusão 4 — "Janela Copa 2026" como deadline acionável
**Como o dono enxerga:** "Visão de longo prazo disfarçada de urgência. Plano v2 datado 03/04/2026, Copa 2026 como janela, mas estrutura para operar por anos".
**O que os dados mostram:** Copa 2026 começa **junho 2026**. Hoje é 28/04/2026. Janela: ~6 semanas. Para atender Persona 1 (Rodrigo, alvo PRO):
- Falta decrement de inventário no `/api/bot/quote` (figurinha "vendida" 2x).
- Falta cache do `albums.ts` (cold start parseia 44k linhas a cada SSR).
- Falta observability funcional (Sentry só pega uncaught, handlers engolem erros).
- `/teste` em prod polui banco a cada execução.
- Suite de testes vazia bloqueia qualquer cirurgia urgente.
**Custo:** "longo prazo" é ok; mas Copa 2026 é janela de tração (8M colecionadores em 2014, bancas crescendo 347%). Se produto não está pronto pra absorver demanda em junho, janela passa. Cada semana refinando cockpit comercial é semana fora do core (loja robusta, bot confiável, observability mínimo). "Longo prazo" pode ser autoengano para racionalizar não-priorizar emergência.
**Severidade:** Alta.

### Ilusão 5 — "Workspace multi-projeto como estratégia, não bagunça"
**Como o dono enxerga:** "Construiu infraestrutura de trabalho antes de construir features".
**O que os dados mostram:**
- 13 projetos + infra ativos.
- Em 2026-04-20 (8 dias antes desta análise) o dono **reorientou foco**: "Pilar 'afiliados' saiu da priorização" — ele percebeu dispersão.
- Reorientação ainda lista 7 projetos como "foco ativo" — ainda muito.
- P8 compete com P1 (vendas Firebase), P3 (CRM Neon + ML), P9 (Twenty bloqueado), P13 (LGPD), arena-wa-infra (37 containers VPS).
- "Pendências user-blocked" mostra vários sistemas esperando o dono — gargalo de pessoa.
**Custo:** "infraestrutura de trabalho" é positivo se amplifica output. Aqui divide: cada projeto tem CLAUDE.md, AGENTS.md, hooks, agents próprios; sessão IA precisa de minutos só para reorientar. P8 é prioridade Copa 2026 mas compete com P1 (também Copa 2026, vendas). Persona 1 do P8 (Rodrigo) é praticamente a mesma persona do P1 — sobreposição não-resolvida entre os dois produtos.
**Severidade:** Média — risco real, mas dono já demonstrou capacidade de cortar foco em 2026-04-20.

## 14. Críticas positivas

### a. Acertos arquiteturais

**Lazy Proxy no `db.ts` resolve cold start sem sacrificar ergonomia.** `src/lib/db.ts` (26 linhas) usa `Proxy` JS que intercepta acesso ao `db` e só inicializa Neon na primeira chamada real. Resultado: `npm run build` passa sem `DATABASE_URL`. A alternativa seria `if (!db) db = new PrismaClient()` espalhado, ou forçar env no CI. O projeto isolou o problema em ponto central de 26 linhas com comentário do motivo.

**Sistema de preços em 3 eixos com hierarquia codificada.** `src/lib/price-resolver.ts` (119 linhas) implementa cascata `customPrice > sectionRule > albumTypeRule > globalTypeRule > default` como função pura tipada. Caminho mais curto seria calcular preço direto nos componentes React. Em vez disso, extraiu pra função pura testável. `buildStickerSectionMap()` calculado no server pra não vazar `albums.ts` ao client. Hierarquia documentada no cabeçalho.

**Schema Prisma separa domínio de produto de domínio operacional sem sobreposição.** 18 modelos em dois grupos sem relações cruzadas: produto (`Seller`/`Inventory`/`Order`/`PriceRule`/`SectionPriceRule`/`QuantityTier`/`CustomAlbum`/`SubscriptionEvent`) e cockpit (`Biz*` × 9). Único ponto de junção é `BizLead.convertedSellerId` — cockpit pode ser removido ou migrado sem tocar no núcleo. Topologia codifica a separação.

### b. Acertos de produto

**Filtro de "lista de faltantes" é feature que nenhum concorrente direto tem.** `src/components/loja/store-album-view.tsx` aceita lista colada de códigos (`BRA7, BRA12, 324-331`) e filtra a vitrine. Nenhum dos 9 concorrentes (ML, Shopee, StickerManager, TrocaFigurinhas, etc.) oferece. Resolve a dor "você tem a BRA-7?" 50× por venda — inverte o fluxo, comprador filtra sozinho antes de contatar.

**Parser de álbuns customizados aceita 3 formatos sem template.** `src/lib/custom-albums.ts` `parseStickersInput()` aceita range numérico (`1-670`), range com prefixo (`BRA1-BRA20`) e lista mista com sanitização. Vendedor cola o que tem no caderno. Slug com prefixo `custom_` evita colisão com Panini estático. Caminho fácil seria exigir CSV; o projeto escolheu o formato que o usuário real já usa.

**HMAC com janela anti-replay de 300s + `timingSafeEqual`.** `src/lib/bot-hmac.ts` (104 linhas) assina `${ts}.${rawBody}` — timestamp na assinatura impede replay. Em dev sem secret, `dev-skip` com warning. Sem isso, vazamento do HMAC permitiria orders fraudulentas indefinidamente.

### c. Acertos de processo e disciplina

**Hook pré-commit integrado ao Claude Code (não `.git/hooks/`).** `.claude/settings.json` configura `PreToolUse` que intercepta `git commit*` e roda `bin/precommit-router.sh` (test → tsc → build) com exit 2 em falha. Maioria dos projetos com hook pré-commit usa `.git/hooks/` — não commitado, depende de cada dev rodar `npx husky install`. Aqui o gate é efetivo também para o agente IA que escreve código. Reforçado ativamente: commit `chore(hooks): fortalece pre-commit com test e tsc antes do build`.

**`AGENTS.md` força agente IA a reler breaking changes antes de codar.** O bloco "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data" é instrução de sistema, não doc humana. Documenta `await cookies()`/`await params`, `proxy.ts` vs `middleware.ts`, Tailwind 4 CSS-first, Prisma 7 com adapters, Zod 4. Bloca preventivamente alucinação de APIs Next.js 15.

**Decisão de produto datada e verificável antes do código.** `docs/DOCUMENTACAO_NEGOCIO_MONETIZACAO.md` (2026-04-05) define ICP, tese, monetização e métricas. `docs/PLANO_SAAS_V2.md` tem "verificado no código" literal. Decisão registrada antes da implementação permite verificar aderência. Raro em projetos solo.

### d. Acertos comerciais e de timing

**Lançamento alinhado com janela Copa 2026.** Álbum lançado 30/04/2026 (980 figurinhas, recorde, R$ 7/pacote). Modo de execução acelerada a partir de mar/abr 2026. Mercado de avulsas só existe em volume 2-4 semanas após lançamento — não é sorte: janela Copa dura 3-4 meses de pico e cai abruptamente. Quem não está pronto em maio não aproveita.

**Identificação de vácuo de mercado antes de construir.** Pesquisa do passo 5 não encontrou SaaS equivalente no Brasil em 10+ queries. Incomum — maioria dos verticais já tem player SaaS. Alternativa dominante é "WhatsApp + planilha + memória" (15.638 grupos detectados). Preço FREE/PRO R$ 29 calibrado para competir com "grátis" — vendedor compara com 3-4 vendas perdidas/semana, não com SaaS rival. Tese documentada antes da implementação.

## 15. Críticas negativas

### a. Riscos técnicos

**a.1 — Sentry instalado e nunca chamado em handlers (Severidade: Alta).** `@sentry/nextjs@10.49.0` em `package.json`, `instrumentation.ts` com `onRequestError` ativo (pega uncaught), mas Grep `Sentry.|captureException` em `src/` retorna 0. Os 24 handlers de API engolem erros com `console.error`. Custo: produto que processa Stripe + dados de seller fica observabilidade-cega — primeiro 500 em junho/26 será descoberto por reclamação de cliente, não alerta.

**a.2 — Suite de testes vazia apesar de "Fase 5c rollout" (Severidade: Alta).** 4 arquivos / 370 linhas, todos em utilitários inertes. `price-resolver.ts`, `plan-limits.ts`, webhook Stripe — toda lógica que afeta receita — sem cobertura. Setup com 175 linhas de mocks Prisma+Stripe que nenhum teste usa. Custo: refactor de `albums.ts` (CIRURGIA_CANDIDATES #1, "roleta-russa sem testes prontos") fica bloqueado; mudança de preço pode quebrar checkout silenciosamente.

**a.3 — CI roda apenas `npm run build` (Severidade: Média).** `.github/workflows/quality-gate.yml`: `npm ci` + `npm run build`. Sem lint, sem typecheck separado, sem test. Hook pré-commit local existe mas `--no-verify` ou commit via UI do GitHub escapa. Custo: drift de tipo silencioso até build de prod estourar — em Copa, pior momento.

**a.4 — Senha em texto puro pode existir no banco (Severidade: Crítica).** `src/app/api/auth/login/route.ts:25-37`: se `bcrypt.compare(senha, sellerHash)` falha porque `sellerHash` não tem prefixo `$2`, o código faz `senha === sellerHash`. Sellers que nunca relogaram desde a migração têm senha plaintext em `Seller.password`. A query `SELECT COUNT(*) FROM "Seller" WHERE "password" NOT LIKE '$2%'` nunca foi rodada. Custo: vazamento Neon = vazamento direto LGPD-violatório.

**a.5 — Página `/teste` é E2E destrutivo público (Severidade: Alta).** `src/app/teste/page.tsx` cria conta real (`teste${Date.now()}@figurinhaspro.com`), faz login, mexe em estoque, cria pedido. Cada execução polui banco prod. Acessível em produção sem auth nem `noindex`. Custo: superfície de ataque + Google indexa rota de debug. Em junho/26 com tráfego, vetor.

**a.6 — `albums.ts` 44.781 linhas re-parseado em todo cold start (Severidade: Alta).** Importado em múltiplas rotas server-side. Em Vercel serverless, cold start = segundos parseando JSON-em-TS. Custo: pico Copa = mais cold starts = TTFB inflado em loja pública (`/loja/[slug]/[albumSlug]`) — exatamente a página de Paulo (persona 3).

**a.7 — Stripe price IDs sem validação Zod — 500 silencioso (Severidade: Alta).** `src/lib/stripe.ts:19-35` lê `process.env.STRIPE_PRICE_PRO/UNLIMITED` direto. `src/lib/env.ts` (Zod schema) **não valida** essas vars. Custo: env var ausente em produção = 500 no checkout, mas app sobe sem reclamar — descoberta só quando primeiro vendedor tenta upgrade. Sem Sentry (a.1), operador não sabe.

**a.8 — Neon WebSocket Pool sem connection limit configurado (Severidade: Média).** `src/lib/db.ts` instancia `PrismaNeon({ connectionString })` sem `?connection_limit=N`. Em Vercel serverless multi-região, bursts atingem teto Neon — `Too many connections` sem fallback. Custo: vendedor não consegue listar pedidos durante pico Copa, sem mensagem clara.

**a.9 — Sem `proxy.ts` para auth centralizada (Severidade: Média).** 24 rotas API + ~10 páginas autenticadas chamam `getSession()` individualmente. Custo: regra de auth nova (rate limit, IP geo-block, audit log) precisa ser propagada em N lugares — esquecimento vira CVE. Cresce mal.

### b. Riscos de produto

**b.1 — Cockpit tem 9 modelos `Biz*` mas tração real não medida (Severidade: Alta).** Sem query nem painel que conte: sellers PRO ativos hoje, MRR, churn 30d, sellers que tocaram `/painel/estoque` na última semana. KPIs populados via seed. Cockpit é theater of metrics. Custo: dono opera por intuição; decisão de pivô em junho/26 sem dado.

**b.2 — Funcionalidade-killer ("lista de faltantes") tem descoberta incerta (Severidade: Alta).** Paulo (persona 3, P14): "nunca ouvi falar". Feature está embutida em `store-album-view.tsx` (1.052 LOC) sem CTA destacado, sem onboarding na vitrine, sem instrução copy-paste a partir do app Panini. Custo: feature mais valiosa fica oculta — Paulo nunca aciona, vendedor nunca conta.

**b.3 — Onboarding de 772 linhas pode fazer Camila desistir (Severidade: Média).** Wizard multi-step (`shopDescription`, `businessHours`, `paymentMethods`). Persona Camila (P7, confiança Alta): "Configurar muito. Cadastrar 670 figurinhas uma por uma — não vou fazer". Custo: usuário FREE-natural que viraria PRO-na-Copa não passa do registro.

**b.4 — Plano FREE 100 figurinhas é teto baixo para Camila — sem instrumentação de "atingiu limite" (Severidade: Média).** Camila opera 80–180/mês. `plan-limits.ts:36-50` retorna `{ allowed: count < 100 }` mas não dispara evento `plan_limit_hit` em analytics nem upsell contextual. Custo: vendedor vê "não consegui adicionar" e some — sem nudge.

**b.5 — Sem instrumentação custom (NPS, churn, telemetria) (Severidade: Alta).** Vercel Analytics + Speed Insights = page views. Zero: `Inventory.lastUpdated` tracked, `Order.firstQuoteAt` inexiste, sem `SellerActivity`. Custo: dono não responde "qual feature mais usada", "quantos churned", "% FREE bate teto" — estratégia Copa improvisada às cegas.

### c. Riscos comerciais

**c.1 — Janela Copa começa em ~6 semanas e produto não tem canal de aquisição evidente (Severidade: Crítica).** Pico junho-julho. `/painel/comercial/leads` populado por seed, não leads reais. Sem evidência de Ads pago, parceria com banca, content marketing, integração com app Panini. Custo: produto pronto + janela aberta + zero tráfego = janela perdida, próxima é Copa 2030.

**c.2 — Bulk de 980 figurinhas (recorde Copa 2026) sem evidência de teste em produção (Severidade: Alta).** `api/inventory/setup` faz upsert mas sem teste de carga, sem evidência de seller que cadastrou 980 itens via UI. `inventory-manager.tsx` 1.036 LOC sem teste. Custo: vendedor abre o produto na Copa, tenta cadastrar lote grande, UI trava → desinstala.

**c.3 — Concorrente real (ML+WhatsApp+planilha) ganha por hábito; onboarding tem que ser radicalmente mais simples (Severidade: Alta).** P8 entrega vitrine + 3 eixos + cockpit — feature-rich, custo cognitivo alto. Rodrigo (P6): "Tentei Shopify, ficou 2 dias e desisti". Custo: produto perde para WhatsApp por ser "demais" e perde para ML por não ter audiência built-in.

**c.4 — Sem conexão evidente com ecossistema Arena Cards (Severidade: Média).** Workspace tem P1 (`arenacards.com.br`), P3 (3.298 customers), P9 (bot WhatsApp). P8 não aparece em funnels: nenhum botão "experimente FigurinhasPro" em P1, sem cross-sell email Listmonk para P3, sem campanha Postiz programada. Custo: dono tem audiência Arena (canal próprio) e não a aproveita.

**c.5 — 3 dependências externas sem plano de contingência (Severidade: Média).** Vercel/Neon/Stripe — `AGENTS.md` lista sem seção "se Stripe cair". Webhook Stripe é caminho crítico; falha silenciosa = seller paga, plano não atualiza, suporte explode. Custo: 1 incidente terceiro em junho/26 = horas de degradação sem playbook.

### d. Riscos de execução

**d.1 — Dívida documentada em 4 artefatos (`BUGS_DESCOBERTOS.md`, `AUDIT.md`, `CIRURGIA_CANDIDATES.md`, `AGENTS.md.gaps.md`) sem cronograma (Severidade: Alta).** Criados em 2026-04-27 por `/akita-bootstrap-auto`. Nenhuma issue/milestone/board com prazo para B1 (Sentry), B2 (senha), B3 (testes), B4 (CI), B5 (`/teste`). Cockpit comercial poderia servir mas está populado por seed. Custo: dívida em modo "documentei = sob controle"; junho/26 chega com tudo aberto.

**d.2 — 13 projetos paralelos diluem foco no P8 (Severidade: Alta).** Reorientação 2026-04-20 ainda lista 7 projetos como "ativos" simultâneos. P8 disputa atenção com P1v2 (Stripe figurinhas), P3 (CRM Neon), P9 (Twenty cutover bloqueado por API key). Custo: bandwidth do dono fragmentado em janela curta.

**d.3 — Auto-deploy desativado em P8 — deploy manual é fricção (Severidade: Média).** `npx vercel deploy --prod` manual. Cada commit precisa de comando ativo. Custo: hotfix em pico Copa atrasa minutos por ato consciente; janelas sem deploy se acumulam.

**d.4 — `CLAUDE.md` divergente do código (gates de plano) (Severidade: Média).** `CLAUDE.md` afirma "guards desabilitados, retornam true"; `plan-limits.ts:36-50` está ATIVO. Agente IA lê CLAUDE.md, presume gates off, escreve código sem checar limite, deploya, prod-FREE bloqueia o seller que ele ia testar. Custo: cada nova sessão começa com contexto errado — multiplica retrabalho.

**d.5 — Cockpit comercial sem operador externo, sem ciclo PDCA fechado (Severidade: Média).** Acesso restrito a 1 admin (que também é dev). 7 sub-módulos é estrutura pesada para 1 pessoa. Sem colaborador, growth hacker, vendedor B2B. Custo: dono gasta tempo populando ferramenta interna que não compartilha — meta-trabalho compete com aquisição (c.1).

**Resumo das críticas mais bloqueadoras para junho/26:** a.4 (senha plaintext, LGPD), a.7 (Stripe env, mata receita), b.5 (sem telemetria, voa cego), c.1 (sem aquisição, janela aberta + zero tráfego), d.2 (foco diluído, execução em 7 frentes).

## 16. Pesquisa sobre novas funcionalidades

### a. Funcionalidades que concorrentes têm e P8 não tem

**1. Scan de figurinha por câmera (OCR).** Panini Collectors App + Sticker Collector 26 (Apple Store) reconhecem código de figurinha via câmera. Para P8, valor maior é no fluxo do vendedor: Rodrigo atualiza estoque no celular sem digitar. **Esforço: M.** Stack: Google Cloud Vision Document Text Detection + UI mobile. **Quem ganha:** Rodrigo.

**2. Matching automático de trocas.** StickerManager (291k usuários, 3M trocas) tem "Super Swap" que cruza coleções. Para P8, adaptação seria "comprador X tem repetida que vendedor Y precisa, troca com desconto" — habilita reposição de estoque sem custo monetário. **Ressalva:** P8 é venda, não troca pura — exige valoração monetária. **Esforço: G.** **Quem ganha:** Rodrigo (reposição), Paulo (trocar repetidas).

**3. Gamificação de reputação do vendedor.** Panini Collectors tem badges + ranking de colecionador. Para P8, badges de vendedor (`Loja Verificada`, `Responde em <1h`, `100 pedidos entregues`) exibidos como selos de confiança na vitrine. **Esforço: P** (campo JSON em `Seller`). **Quem ganha:** Rodrigo (sinaliza loja séria), Paulo (decide sem arriscar).

**4. Rating/Reputação tipo ML.** Mercado Livre usa termômetro 5 cores (% reclamações × % cancelamentos × % despachos no prazo). Para P8, CTA pós-DELIVERED para comprador avaliar 1-5 + comentário. **Ressalva:** P8 não tem checkout interno (fecha via WhatsApp), entrega não é verificável. Rating sem compra comprovada = manipulável. **Esforço: M.** **Quem ganha:** Paulo, Rodrigo.

### b. O que o mercado pede (sem produto existente atender)

**1. Notificação automática "sua figurinha chegou" via WhatsApp.** Paulo (P10): "5 horas depois responde, já comprei de outro". Nenhum concorrente permite ao comprador registrar "quero a BRA-7 do vendedor X, me avisa". WhatsApp Business Cloud API (Meta 2025) suporta templates de notificação proativos via n8n já presente na infra Arena Cards. **Esforço: M.** Modelo `StockAlert` + trigger no update de inventory. **Quem ganha:** Paulo (compra no que avisa primeiro), Rodrigo (captura venda que perderia).

**2. Checkout direto Mercado Pago / Pix automático sem sair pro WhatsApp.** Paulo prefere Pix direto, mas hoje é manual (vendedor envia chave, cliente transfere, vendedor confirma). MP tem API marketplace com OAuth por vendedor + `marketplace_fee`. **Ressalva:** P8 já tem Stripe; adicionar MP aumenta complexidade. **Esforço: G.** **Quem ganha:** Rodrigo (já usa MP), Paulo (sem conta Stripe).

**3. Compra protegida / garantia "se não chegar em N dias, devolve".** Mercado secundário tem baixa confiança estrutural ([Reclame Aqui — golpe álbum Copa 2026](https://blog.reclameaqui.com.br/golpe-album-copa-site-falso/)). Stripe `payment_intent` com captura posterior habilita escrow. **Bloqueado por checkout online inexistente.** **Esforço: G.** **Quem ganha:** Paulo (confiança em vendedor desconhecido).

### c. Tecnologia recente que habilita oportunidades

**1. OCR Google Cloud Vision para escanear álbum físico.** Colecionador aponta câmera para página preenchida do álbum, app reconhece números colados, gera lista de faltantes (páginas vazias). Sticker Collector 26 já implementou. Custo Vision API: ~$1,50/1.000 imagens. **Esforço: M** — UI câmera (MediaDevices API) + Vision API + parser + merge.

**2. IA generativa para sugestão de preço por seção.** P8 já tem 3 eixos manuais. Com Claude Haiku (~$1/MTok), analisar histórico de Order + PriceRule do vendedor e sugerir ajuste ([MIT Sloan — How to Use Generative AI for Pricing](https://sloanreview.mit.edu/article/how-to-use-generative-ai-for-pricing/)). **Ressalva:** sem dados de mercado integrados, sugestão é só histórico interno. **Esforço: M.** **Quem ganha:** Rodrigo (margem ótima sem analisar planilha).

**3. Vercel Edge Config para A/B test de copy sem deploy.** Key-value global, latência ~15ms p99. Operador muda copy de CTA pelo dashboard Vercel, efeito imediato em produção. ([Vercel Edge Config docs](https://vercel.com/blog/vercel-edge-config-is-now-generally-available)). **Esforço: P** — `@vercel/edge-config` + leitura no Server Component da landing.

**4. Stripe Subscription Schedule para trial PRO automático.** `subscription_schedules` permite "trial 30 dias → downgrade automático para FREE". API version `2026-03-25.preview` tem Trial Offer API. Trials com cartão convertem 2-3x mais. **Esforço: P** — ajuste na rota `api/stripe/checkout`.

### d. Janela Copa 2026 — features urgentes (junho–julho/2026)

**1. "Modo Copa" automático — banner de urgência + countdown.** Componente com data hardcoded até 18/07/2026 (final), copy variável por semana, destaque SEO. Habilitado por flag Edge Config (item c.3). **Esforço: P.** **Quem ganha:** Rodrigo (converte indecisos), Paulo (urgência real).

**2. Trial PRO Copa com downgrade automático.** Stripe `subscription_schedule` para trial 30 dias entre 30/04 e 15/06/2026, revertendo para FREE automaticamente em 15/07. Após Copa, volume de cadastros despenca — janela de conversão é junho-julho. **Esforço: P.**

**3. Alertas de figurinhas especiais (foil/shiny).** Durante Copa, especiais têm precificação e escassez distintas. Comprador registra alerta para código específico, recebe WhatsApp quando vendedor adiciona. Reusa infra de b.1 (`StockAlert`). **Esforço: M** combinado com b.1. **Quem ganha:** Paulo (raras são as mais difíceis), Rodrigo (alta margem em foil).

**Confiança da pesquisa: Média.** Features de concorrentes confirmadas via fontes primárias (App Store, FAQ StickerManager fetch direto, docs Stripe/Vercel). Dores de mercado inferidas das personas + Reclame Aqui parcial (403 bloqueou). Tecnologia confirmada via documentação oficial. Sem acesso a fóruns Reddit BR e grupos WhatsApp internos.

## 17. Sistema ideal

> Versão plausível em 6-12 meses, com 1-2 devs em foco. Não é "best-in-class global" — é "P8 vencendo o nicho de revendedor brasileiro de figurinhas avulsas, janela Copa absorvida e operação enxuta sustentando após o pico".

### a. Núcleo do produto (loja + estoque)

- **Vitrine pública servida em <500ms p95 mobile.** `/loja/[slug]/[albumSlug]` usa Cache Components Next 16 (`'use cache'` + `cacheTag(albumSlug-sellerId)`) sobre `albums.ts` migrado pra DB (CIRURGIA #1). Cold start não parseia 44k linhas. Filtro de "lista de faltantes" é o **CTA primário** acima da dobra (não enterrado em `store-album-view.tsx`), com instrução copy-paste do app Panini em 1 linha.
- **`/api/bot/quote` confiável: server resolve preço E decrementa inventário em transação.** Hoje aceita `unitPrice` do payload e não decrementa (Divergência 2). Ideal: ignora preço do payload, chama `resolveUnitPrice(ctx)`, valida `Inventory.quantity >= item.quantity`, decrementa em `prisma.$transaction`. Stripe paga e item não decrementar = alerta Sentry.
- **Onboarding cortado de 772 → ~200 linhas em 1 tela.** Form único (nome loja + slug + senha + álbum primário) → cria `Seller` + `Inventory` vazio → cai em `/painel/estoque/import` com upload CSV ou colagem. Camila precisa cadastrar 670 figurinhas em <2 min ou some.
- **Cadastro em massa de 980 figurinhas testado e instrumentado.** `inventory-manager.tsx` com benchmark documentado: importar 980 códigos via colagem em <10s, UI sem travar. Botão "importar do Panini Collectors" se houver API; senão tutorial em 3 prints.
- **Modo Copa explícito.** Toggle `seller.copaMode = true` que destaca álbum Copa 2026, sugere preços baseados em mediana ML scraping (opt-in), ativa banner "Modo Copa: vendendo agora" na vitrine.

### b. Monetização e aquisição

- **Modelo mantido FREE/PRO/UNLIMITED, com PRO renomeado "Revendedor" e UNLIMITED "Profissional".** FREE 100/10/1 calibrado pra Camila bater teto na 2ª semana de Copa; PRO R$ 29 calibrado contra "3-4 vendas perdidas/semana" do Rodrigo. Modelo está bom — falta instrumentação.
- **Trial PRO 14 dias automático em conta nova durante Copa (1/jun a 31/jul/2026).** Sem cartão. Cria conta → 14 dias PRO → expira → volta FREE com banner "veja seus números do trial". `Seller.trialEndsAt` + cron diário que rebaixa.
- **Upgrade contextual disparado por evento `plan_limit_hit`.** Hoje `plan-limits.ts:36-50` retorna `{ allowed: false, reason: 'plan_limit' }` e UI mostra modal genérico. Ideal: cada bloqueio dispara analytics custom + modal contextual ("você adicionou 100 figurinhas em 8 dias — em alta temporada o teto vira gargalo").
- **3 canais de aquisição mínimos:**
  1. **Cross-sell Arena Cards (P1):** botão "Vendendo? Use FigurinhasPro" no checkout do P1. Audiência cativa.
  2. **Parceria com 3-5 grupos WhatsApp gigantes** (15.638 grupos detectados). Operador entra como admin convidado, oferece 30 dias grátis PRO.
  3. **Conteúdo Instagram/TikTok com Rodrigo arquétipo** — vídeos curtos "como organizo meu estoque". 3 vídeos/semana durante Copa.
- **Cockpit comercial conectado a dados reais.** Cron noturno popula `BizKpiSnapshot` com `Seller.count`, `Seller.count where plan='PRO'`, MRR Stripe, churn 30d, `Order.count last 7d`. Hoje seed mete `"Restaurar checkStickerLimit"` como milestone — cockpit é teatro.

### c. Confiabilidade e segurança

- **Zero senhas plaintext.** Job único força reset de todos `Seller.password NOT LIKE '$2%'`. Branch plaintext do `login/route.ts:25-37` removida. Query mensal alerta se ≥1.
- **Sentry capturando handlers que engolem erros.** Wrapper `withErrorReport` em `src/lib/observability.ts` aplicado nos 24 handlers `/api/*`. Hoje só `onRequestError` (uncaught) chega ao Sentry.
- **Stripe price IDs validados em boot via Zod.** `src/lib/env.ts` adiciona `STRIPE_PRICE_PRO: z.string().startsWith('price_')`. Em produção, env ausente = build falha, não 500 silencioso.
- **Connection limit Neon configurado.** `PrismaNeon({ connectionString: addParam(url, 'connection_limit=20') })`.
- **`proxy.ts` para auth centralizada.** Substitui `getSession()` espalhado em 24 rotas + 10 páginas. Permite rate limit, IP geo-block, audit log em 1 ponto.
- **Suite de testes cobrindo funções de receita (≥80%):**
  - `price-resolver.test.ts` — hierarquia 3 eixos, edge cases
  - `plan-limits.test.ts` — `checkStickerLimit/AlbumLimit/OrderLimit`
  - `stripe-webhook.test.ts` — 4 eventos + caso `metadata.sellerId` ausente
  - `bot-quote.test.ts` — HMAC válido, replay rejeitado, decrement, preço server-side
- **CI roda lint + typecheck + test + build.** Substitui `npm ci && npm run build` por `npm ci && npm run lint && npx tsc --noEmit && npm run test && npm run build`. Sem `--no-verify` driblando.

### d. Observability e operação

- **Telemetria custom em 6 eventos:** `plan_limit_hit`, `inventory_bulk_import`, `order_quote_created`, `order_paid`, `seller_trial_started`, `seller_trial_converted`. Stack: Vercel Analytics custom events + tabela `Telemetry` no Neon.
- **Dashboard de operação `/painel/admin/operacao` (admin-only):** sellers ativos 7d, MRR + delta semanal, conversão FREE→PRO, conversão trial→paid, lista-faltantes click-through, latência p95 da loja pública.
- **`/teste` deletada de produção.** Substituída por suite Playwright em CI contra preview Vercel.
- **Auto-deploy reativado com gate.** Auto-deploy em `master` com requisito de status check verde (CI completo). Rollback de 1 clique via Vercel UI documentado em `runbook.md`.

### e. Posicionamento e ecossistema

- **Foco assumido em Rodrigo (revendedor profissional).** Camila é caso de borda atendido pelo FREE; Paulo é beneficiário do filtro de faltantes (decisão: nunca cobrar dele). Roadmap, copy de marketing e onboarding escritos para Rodrigo.
- **Diferencial "lista de faltantes" promovido em 3 superfícies:**
  - Vitrine pública: header "Cole sua lista do app Panini e veja só o que falta" com prefill.
  - Onboarding do vendedor: vídeo "veja como cliente filtra a lista".
  - Copy compartilhável: link `loja.figurinhaspro.com/[slug]/copa-2026?paste-list` cai com input aberto.
- **Conexões com ecossistema Arena Cards aproveitadas:**
  - **P1 (arenacards.com.br):** banner pós-checkout "Vende suas repetidas? Crie loja grátis FigurinhasPro" → tracking UTM.
  - **P3 (CRM Neon, 3.298 customers):** segmento "comprou Copa 2018/2022" recebe email Listmonk com convite trial PRO.
  - **P9 (bot WhatsApp Twenty):** bot oficial Arena Cards consulta `/api/bot/stickers` e direciona pra vendedor FigurinhasPro mais próximo.
  - **P13 (LGPD):** DSR do P8 (export/delete por seller) processado via `/governance` consolidado.
- **P8 declarado prioridade #1 do workspace junho-julho/26.** `CLAUDE.md` raiz Arena Cards explicita: P8 + P1v2 são única prioridade até 31/jul/2026. P3, P6, P9, P13 em manutenção mínima.

## 18. Gaps identificados

> 14 gaps numerados, ordenados por prioridade pra janela Copa 2026.

### G1 — Senha plaintext potencial no banco
**Estado atual:** `src/app/api/auth/login/route.ts:25-37` aceita `senha === sellerHash` se hash não tem prefixo `$2`. Sellers que nunca relogaram desde migração têm plaintext em `Seller.password` (a.4, BUG B2).
**Estado ideal:** §17.c — zero plaintext, branch removida, query de auditoria mensal.
**Esforço:** P (1 dia: query Neon + force-reset por email + remover branch + deploy).
**Bloqueia:** todos. Vazamento Neon = vazamento LGPD direto.
**Severidade Copa:** **Crítica**.

### G2 — `/api/bot/quote` aceita preço falsificado e não decrementa inventário
**Estado atual:** handler usa `unitPrice` enviado pelo cliente externo, não chama `resolveUnitPrice`, não valida estoque, não decrementa (Divergência 2, `bot/quote/route.ts:73-97`).
**Estado ideal:** §17.a — server resolve preço, decrementa em transação Prisma.
**Esforço:** P (2 dias: refatorar handler + transação + 1 teste de regressão).
**Bloqueia:** Rodrigo (vende mesma figurinha 2x e refunda). Paulo perde confiança quando "10 em estoque" mente.
**Severidade Copa:** **Crítica**.

### G3 — Página `/teste` em produção polui banco
**Estado atual:** `src/app/teste/page.tsx` cria `Seller` real a cada execução pública (Divergência 3, BUG B5). Sem auth, sem rate limit, indexável.
**Estado ideal:** §17.d — deletada, substituída por Playwright em CI.
**Esforço:** P (≤1 dia).
**Bloqueia:** operador. Vetor de ataque em junho/26.
**Severidade Copa:** **Alta**.

### G4 — Stripe price IDs sem validação Zod (500 silencioso)
**Estado atual:** `src/lib/stripe.ts:19-35` lê `process.env` direto, sem validação Zod (a.7).
**Estado ideal:** §17.c — validados em boot, build falha sem env var.
**Esforço:** P (≤1 dia: 2 linhas no Zod schema).
**Bloqueia:** receita direta (Rodrigo tenta PRO, vê 500, abandona).
**Severidade Copa:** **Crítica**.

### G5 — Sentry só captura uncaught; handlers engolem erro
**Estado atual:** `instrumentation.ts` ativo, mas `Grep "Sentry\."` em `src/` retorna 0. 24 handlers usam `console.error` + `return 500` (Divergência 8, a.1, BUG B1).
**Estado ideal:** §17.c — wrapper `withErrorReport` aplicado nos 24 handlers.
**Esforço:** M (3-4 dias).
**Bloqueia:** operador. 1º bug crítico em junho será descoberto por reclamação.
**Severidade Copa:** **Alta**.

### G6 — Suite de testes vazia bloqueia qualquer cirurgia
**Estado atual:** 4 testes em utilitários; lógica de receita sem cobertura (a.2, BUG B3).
**Estado ideal:** §17.c — 4 suites cobrindo funções de receita, ≥80%.
**Esforço:** M (5-7 dias). Pré-requisito de cirurgia em `albums.ts`.
**Bloqueia:** todos. Sem rede, hotfix em pico Copa é roleta.
**Severidade Copa:** **Alta**.

### G7 — Sem telemetria custom (plan_limit_hit, MRR, churn)
**Estado atual:** Vercel Analytics + Speed Insights = page views. Zero eventos de produto (b.5).
**Estado ideal:** §17.d — 6 eventos custom + dashboard `/painel/admin/operacao`.
**Esforço:** M (4-5 dias).
**Bloqueia:** dono (sem dado pra decidir pivô em junho). Indireto Rodrigo/Camila (sem upgrade contextual em `plan_limit_hit`).
**Severidade Copa:** **Alta**.

### G8 — Sem canal de aquisição funcionando
**Estado atual:** `/painel/comercial/leads` populado por seed. Sem Ads, sem parceria, sem cross-sell P1, sem conteúdo (c.1).
**Estado ideal:** §17.b — 3 canais ativos.
**Esforço:** M (2 semanas).
**Bloqueia:** todos. Janela aberta + zero tráfego = janela perdida.
**Severidade Copa:** **Crítica**.

### G9 — `albums.ts` 44k linhas re-parseado em cold start
**Estado atual:** importado em N rotas server-side, parseado a cada cold start (a.6, CIRURGIA #1).
**Estado ideal:** §17.a — migrado pra DB com `'use cache'`.
**Esforço:** G (1-2 dias com testes prontos; sem testes = roleta). **Bloqueado por G6.**
**Bloqueia:** Paulo (TTFB inflado em mobile).
**Severidade Copa:** **Média**.

### G10 — Onboarding 772 linhas faz Camila desistir
**Estado atual:** wizard multi-step (b.3). Persona 2 P7: "configurar muito = não vou fazer".
**Estado ideal:** §17.a — 1 tela com 4 campos, redireciona pra `/painel/estoque/import`.
**Esforço:** M (4-5 dias).
**Bloqueia:** Camila. Indireto Rodrigo.
**Severidade Copa:** **Alta** — converter visitante em vendedor é função do mês de junho.

### G11 — Lista de faltantes oculta (Paulo nunca soube)
**Estado atual:** feature embutida em `store-album-view.tsx` (1.052 LOC) sem CTA destacado (b.2). Paulo P14: "nunca ouvi falar".
**Estado ideal:** §17.e — promovida em 3 superfícies.
**Esforço:** P (2-3 dias).
**Bloqueia:** Paulo. Indireto Rodrigo.
**Severidade Copa:** **Alta** — diferencial não-promovido é diferencial perdido.

### G12 — CI não roda lint nem test nem typecheck
**Estado atual:** `.github/workflows/quality-gate.yml` só `npm ci && npm run build` (Divergência 6/10, BUG B4).
**Estado ideal:** §17.c — CI roda lint + tsc + test + build.
**Esforço:** P (≤1 dia).
**Bloqueia:** operador.
**Severidade Copa:** **Média**.

### G13 — Cockpit comercial não conectado a dados reais
**Estado atual:** seed popula com texto "Restaurar checkStickerLimit"; sem cron de MRR/churn (Divergência 5, b.1).
**Estado ideal:** §17.b — cron noturno popula `BizKpiSnapshot` com Seller.count, MRR, churn.
**Esforço:** M (3-4 dias).
**Bloqueia:** operador.
**Severidade Copa:** **Média**.

### G14 — Foco diluído em 7+ projetos paralelos
**Estado atual:** reorientação 2026-04-20 ainda lista 7 projetos como "ativos" (d.2).
**Estado ideal:** §17.e — `CLAUDE.md` raiz declara P8 + P1v2 como única prioridade até 31/jul.
**Esforço:** P (≤1 dia). Disciplina, não código.
**Bloqueia:** dono. Bandwidth fragmentado em janela curta = nenhum projeto entrega.
**Severidade Copa:** **Crítica** — meta-gap. Sem isso, G1-G13 não fecham.

## 19. Roteiro do que precisa ser feito

> 6 etapas, ~30 dias úteis, encaixe na janela Copa (28/04 → 09/06 ≈ 6 semanas). **Pré-condição absoluta: G14 (declaração de foco) na semana 0.**

### Semana 0 — Decisão de foco (1 dia, antes de tudo)
- **Resultado:** `CLAUDE.md` raiz Arena Cards atualizado declarando P8 + P1v2 como única prioridade até 31/jul/2026. Backlog dos demais projetos congelado em issue.
- **Gaps que fecha:** G14.
- **Risco:** dono não conseguir cumprir. Mitigação: review semanal de tempo gasto por projeto.

### Etapa 1 — Sangria (5 dias úteis)
- **Resultado:** (a) zero senhas plaintext no Neon; (b) `/api/bot/quote` rejeita preço falsificado e decrementa em transação; (c) `/teste` deletada; (d) Stripe price IDs validados em boot; (e) CI roda `lint + tsc + test + build`.
- **Gaps que fecha:** G1, G2, G3, G4, G12.
- **"Pronto":** query plaintext = 0; cURL `/api/bot/quote` com `unitPrice: 0,01` = 422; `GET /teste` = 404; build sem `STRIPE_PRICE_PRO` falha; PR com lint error é bloqueado.
- **Risco:** force-reset por email espanta sellers. Mitigação: copy focada em "novidade de segurança", suporte WhatsApp 48h.

### Etapa 2 — Observability mínima (3 dias úteis)
- **Resultado:** wrapper `withErrorReport` aplicado nos 24 handlers; 1º erro forçado em staging chega ao Sentry; 1º evento `plan_limit_hit` registrado.
- **Gaps que fecha:** G5, parcialmente G7.
- **"Pronto":** handler que faz `throw new Error('test')` aparece no Sentry; FREE adiciona 101ª figurinha e evento aparece em Vercel Analytics.
- **Risco:** wrapper aplicado errado em handler que precisa swallow erro (ex: webhook Stripe que retorna 200). Mitigação: revisar caso a caso.

### Etapa 3 — Núcleo da loja confiável (7 dias úteis)
- **Resultado:** (a) suite de testes cobrindo `price-resolver`/`plan-limits`/`stripe-webhook`/`bot-quote` (≥30 testes, ≥80%); (b) cache da loja pública via `'use cache'` + `cacheTag` (sem migrar `albums.ts` ainda — cachear output de `getAlbumBySlug`); (c) lista de faltantes promovida com header CTA + tutorial onboarding + URL `?paste-list`.
- **Gaps que fecha:** G6, G11. **Adia G9** — cache resolve 80% sem refactor de risco em pico Copa.
- **"Pronto":** `npm run test` com ≥30 testes verdes; Playwright mede TTFB <500ms p95 mobile; usuário novo usa lista de faltantes em sessão guiada.
- **Risco:** suite de testes pode estourar 7 dias. Mitigação: cortar `bot-quote` pra Etapa 4 se atrasar.

### Etapa 4 — Aquisição mínima viável (7 dias úteis)
- **Resultado:** (a) banner cross-sell em P1 pós-checkout com tracking UTM; (b) outreach para 5 grupos WhatsApp — onboarding como admin convidado em ≥2; (c) onboarding de seller cortado de 772 → ~200 linhas.
- **Gaps que fecha:** G8, G10.
- **"Pronto":** banner P1 com ≥10 cliques tracked; ≥1 grupo com mensagem fixada; novo seller cria conta + adiciona 1ª figurinha em <3 min.
- **Risco:** outreach depende de admins externos. Mitigação: lista de 8-10 grupos, não 3-5.

### Etapa 5 — Polimento e janela (5 dias úteis)
- **Resultado:** (a) telemetria completa (5 eventos restantes); (b) cockpit comercial com cron noturno populando `BizKpiSnapshot` real; (c) Modo Copa ativado; (d) trial PRO 14 dias automático em conta nova durante 1/jun-31/jul.
- **Gaps que fecha:** G7 (resto), G13.
- **"Pronto":** `/painel/admin/operacao` mostra MRR e contagem de sellers PRO em valores reais; novo seller em junho recebe 14 dias PRO sem ação manual.
- **Risco:** Modo Copa pode atrasar pra Etapa 6 se Etapa 4 derrapar. Telemetria + trial são essenciais.

### Etapa 6 — Lançamento e iteração (durante Copa, junho-julho)
- **Resultado:** observar dados, hotfix, iterar. Auto-deploy reativado com gate verde. Runbook de rollback escrito.
- **Gaps que fecha:** nenhum novo. **Adia G9** para agosto/26.
- **"Pronto":** sem critério rígido — postura de operação. Métrica da janela inteira: ≥50 sellers PRO pagantes em 31/jul/2026.
- **Risco:** pico Copa pode revelar gaps não previstos (ex: bug no decrement sob concorrência). Mitigação: Sentry + telemetria das Etapas 2 e 5 dão dado pra reagir; não tentar feature nova durante janela.

### O que **não** cabe em 6 semanas (cortado deliberadamente)
- **G9 — Cirurgia `albums.ts`** → setembro/26.
- **`proxy.ts` para auth centralizada** → pós-Copa.
- **CIRURGIA #2 e #3 (editores de preço, viewers de álbum)** → outubro-dezembro/26.
- **NPS, comunidade, integrações com app Panini Collectors** → fase 2027.

### Riscos da síntese (autocrítica)
- **Otimismo de estimativa:** 30 dias úteis em 6 semanas assume 1 dev em foco total. Se dono também opera P1v2, números dobram. Sintoma: G6 sozinho consome semana inteira de um dev.
- **Aquisição depende de execução não-técnica:** Etapa 4 supõe que dono executa outreach e produz conteúdo — atividades fora da zona de conforto técnica.
- **Trial PRO automático pode canibalizar conversões orgânicas:** 14 dias grátis pode treinar sellers a esperar trial. Risco aceito porque ICP brasileiro raramente paga sem testar.
- **Etapa 1 é densa:** 5 gaps em 5 dias = 1/dia, sem buffer. Se G1 (force-reset) gerar suporte pesado, Etapas 2-3 atrasam em cascata.
