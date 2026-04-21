---
status: stable
last_verified: 2026-04-20
source: auditoria Fase B + Glob/Grep do schema/routes
verification: pwsh ../scripts/check-doc-drift.ps1 --project P8-FigurinhasPro
---

# Known Issues — P8-FigurinhasPro

Issues identificadas na auditoria de drift doc↔código (Fase B do plano de governança documental). Itens aqui ficam BACKLOG até a Fase E ou sessão dedicada.

Convenção: cada issue tem ID `KI-P8-NNN`, severidade (`ALTA`/`MÉDIA`/`BAIXA`) e status (`BACKLOG`/`FIXED`/`RESOLVED`/`BLOCKED`).

---

## KI-P8-001 — Schema com 18 models documentados parcialmente

- **Severidade:** BAIXA
- **Status:** BACKLOG
- **Tipo:** doc-stale
- **Detectado em:** [P8-FigurinhasPro/AGENTS.md](P8-FigurinhasPro/AGENTS.md) seção "Schema Prisma (modelos)", [P8-FigurinhasPro/CLAUDE.md:86](P8-FigurinhasPro/CLAUDE.md)
- **Realidade:** `grep -c "^model " prisma/schema.prisma` = **18 models**. Tabela do AGENTS.md lista 17 + OrderItem implícito = 18. CLAUDE.md menciona "Seller, Inventory, Order, PriceRule, SectionPriceRule, QuantityTier, CustomAlbum, SubscriptionEvent + 9 modelos Biz*" = 17.
- **Resumo:** drift trivial — depende de contar `OrderItem` separado. Inventário detalhado, mas contagens finais inconsistentes.
- **Ação proposta:** padronizar para "18 models" em ambos arquivos. Atualizar tabela quando próximo model for adicionado.

---

## KI-P8-002 — Plan guards desabilitados (todos retornam true) é débito ativo

- **Severidade:** ALTA
- **Status:** BACKLOG (declarado como TODO em código)
- **Tipo:** code-debt
- **Detectado em:** [P8-FigurinhasPro/AGENTS.md](P8-FigurinhasPro/AGENTS.md) seção "Padroes Importantes", `src/lib/plan-limits.ts`
- **Realidade:** `checkStickerLimit()`, `checkOrderLimit()`, `checkAlbumLimit()`, `hasFeature()` documentados como "Temporariamente desabilitados (todos retornam true) — TODO restaurar".
- **Resumo:** sistema de planos FREE/PRO/UNLIMITED existe no schema (`Seller.plan`) e na UI, mas guards são no-op. Stripe webhook gravando subscriptions, mas sem enforcement de limites.
- **Ação proposta:**
  - **Doc:** adicionar warning destacado no CLAUDE.md raiz: "Plan limits estão desabilitados — qualquer Seller tem acesso UNLIMITED na prática".
  - **Code:** restaurar gates antes de cobrar primeiro Stripe Production. Risco financeiro: Sellers podem usar UNLIMITED sem pagar.
  - **NÃO consertar nesta sessão** — escopo é doc, não code.

---

## KI-P8-003 — Auto-deploy desativado: dependência de operador humano

- **Severidade:** MÉDIA
- **Status:** BACKLOG (decisão intencional)
- **Tipo:** ops-debt
- **Detectado em:** [P8-FigurinhasPro/CLAUDE.md:38-52](P8-FigurinhasPro/CLAUDE.md)
- **Realidade:** push em `master` NÃO dispara deploy. Operador deve rodar `npx vercel deploy --prod` manualmente.
- **Resumo:** docs reforçam regra ("NUNCA terminar tarefa sem deploy"), mas dependência humana = risco de drift `master` ↔ produção. Se commit X é pushado mas deploy falha silenciosamente, prod fica defasada sem aviso.
- **Ação proposta:**
  - **Curto:** adicionar GitHub Action que verifica se sha do `master` bate com sha deployed em Vercel. Alerta se diff > 1h.
  - **Longo:** reativar auto-deploy + adicionar testes de smoke pós-deploy.

---

## KI-P8-004 — Cockpit comercial admin-only sem 2FA

- **Severidade:** MÉDIA
- **Status:** BACKLOG
- **Tipo:** code-debt | security
- **Detectado em:** [P8-FigurinhasPro/CLAUDE.md:90-109](P8-FigurinhasPro/CLAUDE.md), [P8-FigurinhasPro/AGENTS.md](P8-FigurinhasPro/AGENTS.md)
- **Realidade:** `/painel/comercial/*` (8 sub-rotas) protegido apenas por `ADMIN_EMAIL` env var + auth iron-session. Acesso total: ler/escrever leads, ofertas, KPIs.
- **Resumo:** se sessão admin vazar (browser não-confiável, malware), atacante tem acesso completo. Sem 2FA, sem audit log de acessos.
- **Ação proposta:**
  - **Curto:** adicionar log de acesso em `audit table` (model novo) toda vez que `/painel/comercial/*` for acessado.
  - **Médio:** integrar 2FA via TOTP (`otplib`) — Seller cadastra QR no profile.
  - **NÃO consertar nesta sessão** — escopo é doc, não code.

---

## KI-P8-005 — Stripe webhook sem idempotency-key explícita

- **Severidade:** ALTA
- **Status:** BACKLOG
- **Tipo:** code-bug | doc-stale
- **Detectado em:** [P8-FigurinhasPro/CLAUDE.md:78](P8-FigurinhasPro/CLAUDE.md), `src/app/api/stripe/webhook/route.ts`
- **Realidade:** docs mencionam Stripe checkout/webhook/portal mas não documentam estratégia de idempotency. Stripe envia webhook múltiplas vezes em caso de retry — sem idempotency, `SubscriptionEvent` pode ter duplicatas.
- **Resumo:** risco em produção: cobrança duplicada, `Seller.plan` upgradado 2x, métricas de billing erradas.
- **Ação proposta:**
  - **Verificar:** ler `src/app/api/stripe/webhook/route.ts` e confirmar se `event.id` é checado contra `SubscriptionEvent.stripeEventId` antes de processar (assumir unique no schema).
  - **Doc:** adicionar seção "Webhook idempotency" no AGENTS.md com pattern correto.
  - **NÃO consertar nesta sessão** — escopo é auditoria de doc, não code review.

---

## KI-P8-006 — Sistema de preços (3 eixos) bem documentado mas frágil sem testes

- **Severidade:** MÉDIA
- **Status:** BACKLOG
- **Tipo:** code-debt
- **Detectado em:** [P8-FigurinhasPro/AGENTS.md](P8-FigurinhasPro/AGENTS.md) seção "Sistema de Precos (3 eixos)"
- **Realidade:** hierarquia "Individual > Secao > Tipo album > Tipo global > Padrao" + `resolveQuantityDiscount` + `applyDiscount`. Funções centralizadas em `src/lib/price-resolver.ts` mas (provavelmente) sem testes unitários.
- **Resumo:** se `resolveUnitPrice` quebrar em edge case, vendedor pode cobrar errado. Risco financeiro silencioso. Doc é boa, código não é coberto.
- **Ação proposta:** rodar Glob `src/lib/price-resolver*test*` pra confirmar. Se faltar, criar `src/lib/__tests__/price-resolver.test.ts` com 5-10 cenários (Vitest, Fase E do plano).

---

## Notas de auditoria

Validados via Glob/Grep nesta sessão:
- ✅ `prisma/schema.prisma` existe (18 models reais)
- ✅ `prisma.config.ts` existe
- ✅ Generator `prisma-client` (novo) com output `src/generated/prisma`
- ✅ 21 routes em `src/app/api/**/route.ts`: 9 auth/comercial/inventory/seller + 4 prices + 3 stripe + 2 albums + 2 orders + 1 logout
- ✅ Sentry + Vercel Analytics + Speed Insights + Stripe SDK 22 instrumentação confirmada
- ✅ iron-session + bcryptjs + Zod 4 stack confirmada
- ✅ Cockpit comercial: 8 rotas listadas batem com `/painel/comercial/*`

Inconsistências ALTAS (KI-P8-002 plan guards, KI-P8-005 webhook idempotency) são débitos de código, não doc — escopados como BACKLOG por estarem fora desta sessão.
