> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28

# Etapa 4 — Implementação iterativa (DRAFT)

## Categoria

**W** (Web app) — confirmada na Etapa 2.

## Loop SMA adaptado (com TDD obrigatório por ADR 0005)

Cada feature da v0 segue o ciclo já enforced no projeto (`CLAUDE.md` + hook pré-commit):

1. **`/pesquisa <feature>`** — entender contexto: arquivos relacionados, convenção de domínio, gotchas (Next 16 async, Lazy Proxy DB, etc.). Artefato em `thoughts/pesquisas/`.
2. **`/plano <feature>`** — propor abordagem em ≤6 blocos com arquivos a tocar + riscos + perguntas abertas. Aprovação humana obrigatória.
3. **TDD ciclo Red→Green→Refactor** (`akita-tdd` skill):
   - **RED**: teste primeiro em `src/__tests__/` ou colocado junto do arquivo (`*.test.ts`)
   - **GREEN**: implementa o mínimo pra passar
   - **REFACTOR**: limpa, mantendo verde
4. **`/implementa <feature>`** — executa passo-a-passo, rodando `npm run test` antes de cada commit
5. **Spec evolution** — atualizar CLAUDE.md/AGENTS.md/ADR/comentário inline conforme ADR 0005
6. **Commit atômico** — hook roda `test → tsc → build`. Falhou: conserta + novo commit (nunca `--no-verify`).
7. **Deploy obrigatório** — `vercel deploy --prod` após push (regra inviolável do CLAUDE.md)

## Ordem sugerida da v0 (re-arquitetura mínima)

A v0 da Etapa 1 corta para 7 fluxos essenciais. Ordem técnica de re-implementação se fosse partir do zero (útil para validar quanto da estrutura atual é justificável):

| # | Feature | Arquivos | Domínio | Justifica reescrever? |
|---|---|---|---|---|
| 1 | **Auth básica** (registro + login + logout, iron-session + bcrypt) | `api/auth/{register,login,logout}/route.ts`, `lib/auth.ts`, `(auth)/login/page.tsx` | Seller | Não — código atual está OK |
| 2 | **Modelo Seller mínimo** (sem onboarding multi-passo, só email/senha/shopSlug) | `prisma/schema.prisma` (Seller stripped), `lib/db.ts` (Lazy Proxy mantém) | Seller | Reduzir campos: tirar `onboardingStep`, `paymentMethods`, `businessHours`, `logo` na v0 |
| 3 | **Custom Album único** (vendedor cria 1 álbum com lista de stickers JSON) | `api/albums/route.ts`, `lib/custom-albums.ts`, `painel/estoque/novo/page.tsx` | CustomAlbum | Não — domínio limpo |
| 4 | **Inventory bulk** (cadastrar quantidade por sticker) | `api/inventory/bulk/route.ts`, `painel/estoque/[albumSlug]/page.tsx` | Inventory | Não |
| 5 | **Vitrine pública** (loja read-only do estoque) | `loja/[slug]/page.tsx`, `loja/[slug]/[albumSlug]/page.tsx` | público | Manter — é o core do produto |
| 6 | **Carrinho + Quote** (cliente monta lista, gera Order em status QUOTE) | `lib/cart-context.tsx`, `api/orders/route.ts` | Order | Manter |
| 7 | **Stripe checkout** (FREE→PRO; UNLIMITED postergado) | `api/stripe/checkout/route.ts`, `api/stripe/webhook/route.ts`, `lib/stripe.ts` | billing | Manter |

**Restrições por feature da v0:**
- Cada feature ≤ 5 arquivos / ≤ 100 linhas. Se passar, quebra em 2.
- Cada feature termina com **1 commit atômico** + deploy.
- Se feature falhar no hook pré-commit → conserta antes de continuar (não pula).

## Features que NÃO fazem parte da v0

Re-implementação destas espera validação do v0 em produção (≥1 vendedor pagando PRO):

- Cockpit comercial admin (família `Biz*` — 9 modelos)
- Bot WhatsApp (`/api/bot/*` + integração HMAC + n8n VPS)
- Sistema de preços por seção (`SectionPriceRule`)
- Quantity tiers
- Onboarding multi-passo + checklist visual
- Reset senha + verificar email (auth básica sem recovery serve pro v0)
- Plano UNLIMITED + features `reports`/`priority_support`
- Multi-álbum (limit 13 → começar com 1)
- Páginas `/privacidade` e `/termos`
- Sentry + Speed Insights

## Testes obrigatórios por layer (ADR 0005)

| Layer | Padrão | Coverage alvo |
|-------|--------|--------------|
| **Utils** (`lib/sticker-types.ts`, `lib/price-resolver.ts`, `lib/custom-albums.ts`) | Puro funcional, sem mock | 100% |
| **Services** (`lib/auth.ts`, `lib/plan-limits.ts`) | Prisma mockado | 80%+ |
| **API routes** (`api/*/route.ts`) | Zod validation + handler + Prisma mock | 90%+ |
| **Components** (Server Components + Client) | React Testing Library | 80%+ |

Mocks globais já em `src/__tests__/setup.ts` (Prisma 18 modelos + Stripe).

## Restrições de processo

- **Nunca pule** `/plano` antes de `/implementa` em feature não-trivial (regra XP do projeto)
- **Nunca misture** feature + refactor no mesmo commit
- **Nunca commite** com CI vermelho (hook bloqueia automaticamente)
- **Sempre verifique UI mudada com Playwright** (regra `arenacards.md` — screenshot + console errors antes de declarar pronto)
- **Sempre confirme assinatura de lib externa** quando mexer em Stripe SDK / Prisma adapter / iron-session / Sentry — usa Context7 ou despacha `Agent api-verifier` (regra `~/.claude/CLAUDE.md`)

## Risco operacional da v0

- Decidir o que **deletar** do schema atual quando enxugar Seller é destrutivo. Migrations destrutivas exigem confirmação explícita (regra workspace).
- Cockpit comercial (Biz*) tem dados em prod (snapshot menciona seed populado). Removê-lo no v0 implica em backup antes.
- A frase da dor da Etapa 1 (`<NÃO INFERIDO COM CERTEZA>`) precisa ser confirmada — ela determina se a v0 acima é a correta. Se a dor for "vendedor abandona porque cadastrar 670 figurinhas demora 2h", a feature #1 da v0 deveria ser **importação CSV/colagem rápida**, não auth.

---

**Próxima etapa:** `/akita-bootstrap:akita-etapa-5-deploy`
