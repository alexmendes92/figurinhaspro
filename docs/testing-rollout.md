# Testing Rollout — Fase 5c (P8)

> Status volátil de adoção da estratégia de testes (ADR 0005).
> Mover linhas para "concluído" ou apagar a tabela quando rollout terminar.
> Última revisão: 2026-04 (migrado do CLAUDE.md em 2026-05-09).

## Contexto

P8 está aplicando o padrão TDD + Spec Evolution definido em [`../../docs/workspace/adr/0005-tdd-spec-evolution.md`](../../docs/workspace/adr/0005-tdd-spec-evolution.md), copiando o setup do piloto P3 (commit `bb86878` na raiz Arena Cards — 37 testes: 26 utils + 5 services + 6 API routes, ciclo Red→Green→Refactor→Update Spec→Commit completo).

O guia mestre de testing do workspace é [`../../docs/workspace/08-testing-strategy.md`](../../docs/workspace/08-testing-strategy.md) — esta página é só o status local de P8.

## Setup atual

- `vitest.config.ts`: `environment: "node"` (Prisma + Stripe, não browser).
- `setupFiles: ["./src/__tests__/setup.ts"]` — mocks globais (✅ criado).
- Hook pré-commit roda `npm run test` antes de `tsc --noEmit` e `next build`. Falha em qualquer um bloqueia o commit (configurado em `.claude/settings.json`).

### Mocks globais (`src/__tests__/setup.ts`)

- **Prisma**: 18 modelos mockados (Seller, Order, PriceRule, BizLead, BizActivity, BizOffer, BizExperiment, BizInitiative, BizMilestone, BizTask, BizKpi, BizKpiSnapshot, etc.).
- **Stripe**: `checkout.sessions`, `customers`, `products`, `prices`.
- **`beforeEach()`**: `vi.clearAllMocks()` — isola testes.

## Status de cobertura por layer

| Layer | Padrão alvo | Path | Status |
|-------|-------------|------|--------|
| **Utils** | Puro funcional, 100% coverage | `src/lib/*.test.ts` | 🟡 Próximo |
| **Services** | Integration + Prisma mock, 80%+ | `src/lib/services/*.test.ts` | 🟡 Próximo |
| **API routes** | Zod validation + handler, 90%+ | `src/app/api/**/route.test.ts` | 🟡 Fila |
| **Plan limits** | Guard functions, 80%+ | `src/lib/plan-limits.test.ts` | 🟡 Fila |
| **Components** | React Testing Library, 80%+ | `src/components/**/*.test.tsx` | 🟡 Fila |

Quando uma linha sair de 🟡 para ✅ + métrica real (ex: "✅ 85% (12/14 funções)"), atualizar aqui.

## Review gate (PR)

- [ ] Build + testes passam (CI / pré-commit).
- [ ] **Spec atualizado?** (mínimo 1 dos: CLAUDE.md, ADR, comentário inline `// @spec:`).

## Referências

- ADR: [`../../docs/workspace/adr/0005-tdd-spec-evolution.md`](../../docs/workspace/adr/0005-tdd-spec-evolution.md)
- Guia testing: [`../../docs/workspace/08-testing-strategy.md`](../../docs/workspace/08-testing-strategy.md)
- Piloto P3: commit `bb86878`
