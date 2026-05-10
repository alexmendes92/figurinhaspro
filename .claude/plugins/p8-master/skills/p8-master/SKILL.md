---
name: p8-master
description: Auto-ativa SEMPRE em qualquer sessão dentro de P8-FigurinhasPro. Roteador central — decide qual sub-skill chamar (pesquisa, plano, valida, implementa, itera, commit, oracle, audit, deploy, etc.) baseado no pedido do usuário e no estado do projeto. NÃO É OPCIONAL — toda interação significativa em P8 passa por este roteador. Use também quando o usuário mencionar "p8", "figurinhaspro", "album-digital", "stripe webhook", "plan limits", "custom albums", ou referenciar arquivos em `src/`, `prisma/`, `output/`, `thoughts/` deste projeto. Compõe SMA + Akita Bootstrap + Oracle + auto-melhoria num pipeline único.
argument-hint: <intent livre — descreva o que quer fazer>
---

Vou rotear sua intenção: $ARGUMENTS

Sou o entry point do plugin **P8-MASTER**. Atuo SOMENTE no projeto P8-FigurinhasPro (Next.js 16 + Prisma 7 + Stripe + Sentry, SaaS de revendedoras de figurinhas).

## Como decido qual sub-skill chamar

Aplico esta árvore de decisão sobre o pedido:

| Intenção do usuário | Sub-skill |
|---|---|
| "pesquisar/explorar/entender X" | `/p8-master:pesquisa <X>` |
| "planejar/desenhar feature X" | `/p8-master:plano <X>` (verifica pesquisa primeiro) |
| "validar/revisar plano em <path>" | `/p8-master:valida <path>` |
| "implementar/executar plano em <path>" | `/p8-master:implementa <path>` |
| "iterar/refinar plano em <path>" | `/p8-master:itera <path>` |
| "commitar mudanças staged" | `/p8-master:commit` |
| "abrir PR" | `/p8-master:pr` |
| "registrar handoff/contexto" | `/p8-master:handoff` |
| "documentar hurdle/aprendizado" | `/p8-master:hurdle <descoberta>` |
| "implementar feature X" (sem mais detalhe) | pipeline canônico: pesquisa → plano (gate) → implementa → ui-review (se UI) → commit → deploy |
| "consertar bug X" | pipeline mini: pesquisa(causa-raíz) → plano(mini) → akita-tdd RED reproduz → GREEN → commit |
| "refatorar X" | akita-refactor (verifica rede de testes) → plano micro-passos → implementa por chunk |
| "testar UI / validar visual / rodar no browser" | `/p8-master:ui-review <feature>` (usa `/chrome` nativo, fallback Playwright) |
| "logue antes / sessão expirou / bootstrap auth / renove sessão" | `/p8-master:p8-auth <url-alvo>` (auto-login em preview/dev, manual em prod) |
| "alterar schema Prisma" | `/p8-master:p8-prisma-migrate` |
| "testar Stripe webhook" | `/p8-master:p8-stripe-sync` |
| "deploy prod" | `/p8-master:p8-deploy` (gate humano sempre) |
| "rodar Oracle / análise estratégica" | `/p8-master:oracle-analise` (cuidado: heavyweight) |
| "consolidar Oracle existente" | `/p8-master:oracle-reportar` |
| "auditar sessões / propor melhorias" | `/p8-master:lessons-audit` |
| "atualizar libs / verificar versões" | `/p8-master:stay-current` |
| "snapshot do produto" | `/p8-master:p8-snapshot` |
| "auditar plan-limits" | `/p8-master:p8-plan-limits-audit` |
| "design rate limit" | `/p8-master:p8-rate-limit-design` |
| "Sentry health" | `/p8-master:p8-sentry-health` |
| "custom albums" | `/p8-master:p8-custom-album` |

Se a intenção for ambígua, pergunto entre 2-3 candidatos antes de despachar.

## Princípios operacionais (Akita-style)

- **Humano decide o QUÊ. Agente decide o COMO.** Plano sempre tem gate humano antes de executar.
- **Pesquisa antes de plano.** Plano sem pesquisa é cego — abortou.
- **TDD não-negociável.** Toda mudança de comportamento começa por teste vermelho.
- **Gate pre-commit obrigatório.** `npm run test` → `npx tsc --noEmit` → `npm run build`. Vermelho bloqueia commit.
- **Deploy é parte da tarefa em P8** — mas exige gate humano (Akita override do CLAUDE.md "deploy automático").
- **Não acumulo escopo.** "Já que estou aqui" → volta como tarefa nova, não amplia.

## Restrições do P8

- Stack proibida em P8: `'use client'` desnecessário (React Compiler resolve), `useMemo`/`useCallback` (idem), `tailwind.config.js` (Tailwind 4 usa CSS-first), APIs sync de request (Next 16 exige `await`).
- Plan limits em [src/lib/plan-limits.ts](src/lib/plan-limits.ts) estão temporariamente desabilitados (TODO restaurar).
- Sentry está inativo (`instrumentation.ts` existe mas DSN opcional).
- Stripe webhook não tem teste E2E em prod.
- Deploy é manual via `npx vercel deploy --prod` no projeto Vercel `album-digital`.
- **Validação visual obrigatória** em mudanças de UI — use `/p8-master:ui-review <feature>`, que prefere `/chrome` nativo (Claude in Chrome) sobre Playwright MCP. Ver `arenacards.md` "Review de UI" e [skills/ui-review/SKILL.md](../ui-review/SKILL.md).

## Fluxo padrão de uma sessão P8

1. **SessionStart hook** carrega [references/p8-glossario.md](references/p8-glossario.md) e dispara `currentdate-gap.py` em background.
2. **Usuário descreve intenção** → eu roteio pra sub-skill.
3. **Sub-skill executa** seu protocolo (pesquisa, plano, etc.).
4. **Gates humanos** quando necessário: aprovação de plano, deploy prod, edit em SKILL.md/CLAUDE.md.
5. **Stop hook** registra a sessão em `state/sessions/` para `lessons-audit` consumir depois.

## Modelo recomendado

- **Main session: Opus** — roteamento + decisão estratégica é cognitivo, justifica Opus.
- **Sub-skills delegadas** podem cair pra Sonnet via frontmatter próprio quando o trabalho é mecânico (implementa, commit, valida).
- **Tarefas triviais** (1 arquivo, <30 linhas): user pode rodar `/model sonnet` antes — sem perda significativa.

## Ver também

- [references/workflow-sma.md](references/workflow-sma.md) — pipeline SMA canônico
- [references/workflow-akita-bootstrap.md](references/workflow-akita-bootstrap.md) — fases B.1-B.5 + ciclo TDD
- [references/p8-glossario.md](references/p8-glossario.md) — termos do domínio P8
- [references/stack-cheatsheet.md](references/stack-cheatsheet.md) — Next 16, Prisma 7, Tailwind 4, Zod 4 quirks
- [README.md](../../README.md) — visão geral do plugin
