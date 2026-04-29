# BUGS_DESCOBERTOS.md — Backlog descoberto na auditoria

> Gerado por `/akita-bootstrap-auto` em 2026-04-27. **Não consertar agora.** Caracterização (`CHARACTERIZATION_TESTS.md`) deve capturar o comportamento atual antes de qualquer fix.
>
> Itens marcados ⚠️ são divergências entre o que a doc afirma e o que o código faz, não bugs de runtime.

---

## 🐛 Bugs / tech debt acionáveis

### B1 — Sentry instalado mas nunca chamado em código de produção

- **Onde**: `package.json` declara `@sentry/nextjs@10.49.0`. Existe `instrumentation.ts` configurando o SDK. Mas `Grep "Sentry\.|captureException|captureMessage" src/` retorna **0 matches**.
- **Sintoma**: erros server-side em rotas API (`/api/auth/login`, `/api/orders`, `/api/stripe/webhook`) usam `console.error` e o cliente recebe genérico. Nenhum evento chega ao dashboard Sentry.
- **Severidade**: ⚠️ alta — projeto pago em prod com observability cega.
- **Como capturar (caracterização)**: nenhum teste captura "Sentry foi chamado". Dá pra pular caracterização e ir direto pro fix, **mas** fazer isso em PR separado e pequeno.
- **Fix sugerido (não executar)**: wrapper `withErrorReport` em `src/lib/observability.ts` que faz `Sentry.captureException(err)` + log local. Aplicar nos 24 handlers `/api/*` em commits atômicos.

---

### B2 — Senha legada em texto puro pode existir no DB

- **Onde**: `src/app/api/auth/login/route.ts:25-37`.
- **Comportamento atual**: se `bcrypt.compare(senha, sellerHash)` joga erro (significa que `sellerHash` não tem formato bcrypt), o código faz `senha === sellerHash` e, se válido, rehasheia.
- **Implicação**: sellers que **nunca logaram** desde a migração ainda têm senha em texto puro no `Seller.password`. Vazamento do DB → vazamento de senhas.
- **Severidade**: ⚠️ alta — risco LGPD + risco de credential stuffing.
- **Como capturar**: contagem direta no DB — `SELECT COUNT(*) FROM "Seller" WHERE "password" NOT LIKE '$2%';` (bcrypt prefix). Não-zero = ação imediata.
- **Fix sugerido (não executar)**: job único de força-reset desses sellers (envia email "redefina sua senha"), depois remover a branch plaintext do login.

---

### B3 — Suite de testes vazia apesar de ADR 0005 declarar "Fase 5c rollout"

- **Onde**: `src/__tests__/setup.ts` tem 175 linhas de mocks Prisma + Stripe; `package.json` tem `"test": "vitest run"`. Mas **0 arquivos `*.test.ts`** existem em `src/`.
- **Implicação**: `npm run test` retorna `RUN  v4.1.4 ... No test files found, exiting with code 1`. CI nem roda `test`, então passa silenciosamente.
- **Severidade**: 🟡 média — não é bug de runtime, é dívida de processo. Mas declarar "rollout" sem suite = ruído documental.
- **Fix sugerido**: ver `CHARACTERIZATION_TESTS.md` — começar pela onda 1 (funções puras `resolveUnitPrice` + `resolveQuantityDiscount`).

---

### B4 — CI não roda lint nem test nem typecheck

- **Onde**: `.github/workflows/quality-gate.yml` só tem `npm ci` + `npm run build`.
- **Implicação**: PR pode ser merged com `biome check` reclamando, com `tsc --noEmit` falhando (Biome não cobre type-check), e sem testes (não que existam, mas se passarem a existir).
- **Severidade**: 🟡 média — disciplina ausente, prevenção zero.
- **Fix sugerido (não executar)**: adicionar steps `npm run lint` e `npm run test` (após criar suíte). Considerar `npx tsc --noEmit` separado.

---

### B5 — Página `/teste` em produção (659 LOC)

- **Onde**: `src/app/teste/page.tsx`.
- **Implicação**: rota pública `/teste` em prod (`album-digital-ashen.vercel.app/teste`) potencialmente expõe playground/debug. Não-bug se for inofensivo, mas vale 1 minuto de auditoria visual.
- **Severidade**: 🟡 média — depende do conteúdo. Pode ser landing alternativa ou página de stress-test que ninguém deletou.
- **Fix sugerido**: humano abre `/teste` em prod, decide: deletar, mover pra `/admin/teste` com guard, ou deixar.

---

## ⚠️ Divergências doc vs código (ruído documental, não bug)

### D1 — `CLAUDE.md` afirma `plan-limits` retornam `true` cego, mas código implementa lógica real

- **Doc**: `CLAUDE.md` linha "Plan guards: `checkStickerLimit()`, `checkOrderLimit()`, `checkAlbumLimit()`, `hasFeature()`. Temporariamente desabilitados (todos retornam `true`) — TODO restaurar."
- **Código**: `src/lib/plan-limits.ts:36-50` faz `db.inventory.count(...)` e retorna `{ allowed: count < limits.maxStickers }`. Idem para os outros.
- **Risco**: agente lê CLAUDE.md, presume gates desligados, escreve código sem se preocupar com limite, deploya, prod-FREE bloqueia o seller que ele ia testar.
- **Fix**: corrigir frase no `CLAUDE.md`.

---

### D2 — `AGENTS.md` linha 44 afirma "Este projeto **nao usa** proxy/middleware atualmente"

- **Verificação**: `Glob src/proxy.ts` + `Glob src/middleware.ts` retornaram nada na auditoria. Bate com a doc. ✅ não-divergente.
- Nota: incluído aqui só pra registrar que verifiquei, não há ação.

---

### D3 — `instrumentation.ts` registra Sentry mas `next.config.ts` pode não estar rodando o wrapper `withSentryConfig`

- **Verificação não feita** (não abri `next.config.ts` em detalhe). Vale conferir se a integração está completa.
- **Severidade**: 🟡 média — relacionado a B1.

---

## Itens NÃO incluídos (deliberadamente)

- TODOs em `painel/comercial/*` — backlog do módulo, não bugs descobertos por mim.
- "albums.ts é grande" — não é bug, é em CIRURGIA_CANDIDATES.md #1.
- "3 editores de preço duplicados" — idem, CIRURGIA_CANDIDATES.md #2.
- Quality de naming, formatação, etc. — Biome cuida.

---

## Próxima ação manual recomendada

Triagem rápida (15 min):

1. Rodar a query de B2 no Neon prod para saber **quantos** sellers têm senha plaintext. Se ≥ 1, tratamento é prioridade 1.
2. Decidir B5 (`/teste`): deletar ou guardar.
3. B1 e B4 entram no backlog regular (não urgente, mas alta-cobertura-de-valor).
