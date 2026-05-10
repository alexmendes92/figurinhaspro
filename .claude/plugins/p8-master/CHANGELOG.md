# Changelog — P8-MASTER

Todas as mudanças notáveis deste plugin são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento segue [SemVer](https://semver.org/lang/pt-BR/):
- **patch (X.Y.Z)** — edit em docs/SKILL.md/CLAUDE.md
- **minor (X.Y.0)** — script novo, skill nova, agent novo
- **major (X.0.0)** — breaking change na interface dos slash commands

---

## [0.1.0] — 2026-05-10

### Adicionado (Fase 1 — esqueleto + SMA core)

- Estrutura completa de pastas: 44 diretórios cobrindo skills, agents, hooks, scripts, references, templates, evals, tests, state, docs.
- `.claude-plugin/plugin.json` v0.1.0 com manifesto + tags.
- `.claude-plugin/permissions.json` compondo com permissions globais (não substitui).
- Skill orquestradora `p8-master:p8-master` ([skills/p8-master/SKILL.md](skills/p8-master/SKILL.md)) com description "pushy" — auto-ativa em qualquer sessão dentro de P8-FigurinhasPro.
- 5 skills SMA core:
  - `p8-master:pesquisa` — pesquisa em codebase, gera artefato em `thoughts/pesquisas/`
  - `p8-master:plano` — plano detalhado com gate humano (rascunho → ativo)
  - `p8-master:valida` — checa placeholders, contradições, escopo + checklist P8-específica
  - `p8-master:implementa` — TDD Red→Green→Refactor + gate `npm run test → tsc → build`
  - `p8-master:itera` — refina plano com histórico preservado
- 3 sub-agents:
  - `explorador` — LOCALIZAR/ANALISAR/CAÇAR-PADRÕES no codebase P8
  - `historiador` — busca/sintetiza artefatos em `thoughts/` + `output/` (Oracle)
  - `revisor` — revisão complexidade + segurança em uma passada (com checks P8-específicos)
- 2 hooks (PowerShell):
  - `hooks/session-start.ps1` — valida cwd em P8, carrega glossário, dispara currentdate-gap em background (Fase 4)
  - `hooks/validate-thoughts.ps1` — avisa se `thoughts/` ausente em Write/Edit
- 2 scripts bootstrap:
  - `scripts/thoughts-init.ps1` — cria estrutura `thoughts/` no projeto P8
  - `scripts/spec-metadata.ps1` — coleta SHA/branch/data para frontmatter
- 3 references:
  - `references/p8-glossario.md` — termos do domínio P8 (sticker, album, custom album, plan, cockpit, etc.)
  - `references/stack-cheatsheet.md` — breaking changes Next 16, Prisma 7, Tailwind 4, Zod 4, React 19, Stripe SDK 22, iron-session 8
  - `references/workflow-sma.md` — pipeline SMA detalhado
- 7 templates:
  - `templates/pesquisa.md`, `templates/plano.md`, `templates/handoff.md`, `templates/decisao.md`, `templates/revisao.md`
  - `templates/thoughts-readme.md`, `templates/thoughts-glossario.md` (usados por `thoughts-init.ps1`)
- README.md + CHANGELOG.md do plugin.

### Ativação

- **`@import` em [P8-FigurinhasPro/CLAUDE.md](../../../CLAUDE.md):** linha `@.claude/plugins/p8-master/skills/p8-master/SKILL.md` adicionada após `@AGENTS.md`.
- **Hook `SessionStart`** em [P8-FigurinhasPro/.claude/settings.json](../../settings.json): adicionada entrada que invoca `pwsh -File .claude/plugins/p8-master/hooks/session-start.ps1`.
- **Hook `PreToolUse Write|Edit`** em settings.json: adicionado segundo handler invocando `validate-thoughts.ps1` do plugin (coexiste com handler bash existente).

### Coexistência

- Hooks pre-existentes em `P8-FigurinhasPro/.claude/hooks/` (`precommit-router.sh`, `validate-thoughts.sh`) **mantidos como estão**.
- Plugin adiciona handlers em paralelo em `settings.json`, não sobrescreve.

### Pendências (entram nas próximas fases)

- 4 skills SMA utilities (commit, pr, handoff, hurdle) — Fase 2
- Hook `precommit-router.ps1` Windows-portável — Fase 2
- Hook `pretooluse-deny-secrets.ps1` — Fase 2
- Bateria de testes inicial (`tests/run-all.ps1`, `tests/unit/test_*.py`) — Fase 2
- Oracle wrappers + 6 agents Oracle + 4 scripts Python — Fase 3
- Self-improvement (lessons-audit, skill-creator, stay-current, update-claude-docs) — Fase 4
- 8 skills domínio P8 (snapshot, stripe-sync, prisma-migrate, deploy, etc.) — Fase 5
- Documentação completa em `docs/` — Fase 6

---

## [0.2.0] — 2026-05-10

### Adicionado (Fase 2 — SMA utilities + hooks pre-commit + bateria de testes)

- 4 skills SMA utilities:
  - `p8-master:commit` — commit disciplinado XP, gate `npm run test → tsc → build`, mensagem imperativa, 16 escopos predefinidos (feat/fix/refactor + 14 escopos P8)
  - `p8-master:pr` — gera título + corpo no padrão Problema/Abordagem/Test plan/Schema impact/Rollback/Out of scope/Specs evolved (ADR 0005). NÃO abre PR automaticamente
  - `p8-master:handoff` — captura estado da sessão em `thoughts/handoffs/` com contexto, decisões, próximo passo, blockers, hurdles candidatos
  - `p8-master:hurdle` — propõe bullet imperativo pra CLAUDE.md/AGENTS.md/inline. Não modifica `~/.claude/CLAUDE.md` global sem aprovação separada
- 2 hooks adicionais (PowerShell):
  - `hooks/precommit-router.ps1` — espelha `.claude/hooks/precommit-router.sh` existente. Bloqueia HARD `git push --force` e `prisma migrate reset`. Avisa em `vercel deploy --prod` e `prisma db push`
  - `hooks/pretooluse-deny-secrets.ps1` — defesa em profundidade contra leitura/exposição de secrets (`.env`, `~/.ssh`, `~/.aws`, comandos `cat .env*`, `echo $TOKEN`, etc.)
- 2 scripts Python:
  - `scripts/validate-frontmatter.py` — valida frontmatter YAML em SKILL.md, AGENT.md, e thoughts/* contra schema (status, tipo, projeto)
  - `scripts/inventory.py` — inventário rápido do codebase (linguagens, categorias, ferramentas, versões, top LOC)
- Bateria de testes inicial (suite verde 100%):
  - `tests/unit/test_validate_frontmatter.py` — 11 casos pytest (skill exists, help, frontmatter ok/missing/unclosed, status/projeto inválidos, real plugin files)
  - `tests/unit/test_inventory.py` — 7 casos pytest (json output, P8 tools detection, pretty mode, skip node_modules, real P8 root)
  - `tests/integration/test_session_start_hook.ps1` — 2 casos (dentro/fora de P8)
  - `tests/integration/test_skill_orchestrator.ps1` — 6 grupos (orquestrador + 5 SMA core + 4 SMA utilities + 3 agents + 4 hooks + 4 scripts)
  - `tests/fixtures/frontmatter-good.md` + `frontmatter-bad.md`
  - `tests/run-all.ps1` (entry Windows) + `tests/run-all.sh` (entry Unix)
- 3 evals iniciais (formato Anthropic skill-creator):
  - `evals/pesquisa.evals.json` — 3 casos (stripe webhook, plan limits, custom albums)
  - `evals/plano.evals.json` — 3 casos (com pesquisa, aborta sem pesquisa, gate Prisma)
  - `evals/implementa.evals.json` — 4 casos (aborta rascunho, TDD cycle, aborta gate vermelho, deploy gate humano)

### Validação

Suite completa (`pwsh -File tests/run-all.ps1`) **TUDO PASSOU**:
- 18/18 testes pytest verde (5.96s)
- 2/2 PowerShell integration suites verde (session-start + skill_orchestrator)

### Pendências (entram nas próximas fases)

- Oracle wrappers + 6 agents Oracle + 4 scripts Python — Fase 3
- Self-improvement (lessons-audit, skill-creator, stay-current, update-claude-docs) — Fase 4
- 8 skills domínio P8 (snapshot, stripe-sync, prisma-migrate, deploy, etc.) — Fase 5
- Documentação completa em `docs/` — Fase 6

---

## [0.3.0] — 2026-05-10

### Adicionado (Fase 3 — Oracle wrappers + 6 agents Oracle + 2 scripts Python)

- 2 skills Oracle wrappers:
  - `p8-master:oracle-analise` — orquestra pipeline 7 fases (estrategia-geral → marketing → estrutura → designer → definicao-prototipo → criacao-prototipo → oracle-master). Heavyweight (50-150k tokens). Gate humano antes da Fase 6 (criacao-prototipo) e ao consolidar
  - `p8-master:oracle-reportar` — consolida `output/01..06.md` existentes em `output/00-README.md` + `output/99-oracle-master.md` sem re-rodar análise (5-15k tokens). Detecta contradições entre fases
- 6 sub-agents Oracle (cópias do plugin Oracle canônico):
  - `extrator` (Haiku) — inventário rápido via scripts
  - `analista-gerador` (Sonnet) — redação narrativa em PT-BR
  - `pesquisador` (Sonnet) — busca atualizada via WebSearch/WebFetch (sempre cita fontes)
  - `critico-adversarial` (Opus) — fricção máxima, paralaxe cognitiva
  - `arquiteto-estrategico` (Opus) — síntese cross-fase, sistema ideal, gaps
  - `qa-estrutural` (Haiku) — valida frontmatter via script
- 2 scripts Python adicionais (cópias do plugin Oracle):
  - `scripts/grep-evidence.py` — wrapper sobre ripgrep (count + 3 samples por padrão)
  - `scripts/load-prior-reports.py` — parseia frontmatter YAML dos relatórios em output/
- `references/workflow-akita-bootstrap.md` — metodologia Akita condensada (5 fases B.1-B.5, ciclo TDD Red→Green→Refactor, ritmo micro-passos, integração com SMA + Oracle no plugin)

### Atualizado

- `tests/integration/test_skill_orchestrator.ps1` — agora valida 9 agents (3 SMA + 6 Oracle), 11 skills (1 orquestrador + 5 SMA core + 4 SMA utilities + 2 Oracle wrappers), 6 scripts (Fase 1+2+3)
- `scripts/validate-frontmatter.py` — `tools` agora opcional em agent (Oracle agents usam `disallowedTools` em vez de `tools`)
- `scripts/load-prior-reports.py` — força stdout/stderr UTF-8 para evitar `UnicodeEncodeError` no Windows (cp1252 quebra em `→` e setas comuns nos relatórios PT-BR)

### Validação

Suite completa (`pwsh -File tests/run-all.ps1`) **TUDO PASSOU**:
- 18/18 testes pytest verde
- 2/2 PowerShell integration suites verde (incluindo verificação dos 9 agents + 11 skills + 6 scripts)
- Smoke: `python scripts/load-prior-reports.py output/` em P8 retornou JSON válido com 8 relatórios (7 completos)

### Pendências (entram nas próximas fases)

- Self-improvement (lessons-audit, skill-creator, stay-current, update-claude-docs) — Fase 4
- 8 skills domínio P8 (snapshot, stripe-sync, prisma-migrate, deploy, plan-limits-audit, rate-limit-design, sentry-health, custom-album) — Fase 5
- Documentação completa em `docs/` — Fase 6

---

## [0.4.0] — 2026-05-10

### Adicionado (Fase 4 — Self-improvement: lessons-audit + skill-creator + stay-current + update-claude-docs)

- 4 skills:
  - `p8-master:lessons-audit` — audita últimas N sessões (default 15d), classifica padrões em 4 categorias (erros recorrentes, sequências repetidas, skills lentas, skills mal-acionadas), propõe diffs em `thoughts/auto-melhoria/` SEM aplicar. Filtra `state/rejections.jsonl` e exclui sessões com flag `selfAudit=true` (evita loop)
  - `p8-master:skill-creator` — 4 modos: `create`, `refine`, `apply-proposal`, `optimize-description`. Sempre exige aprovação humana antes de editar SKILL.md/CLAUDE.md/AGENTS.md. Bumpa `plugin.json` semver corretamente
  - `p8-master:stay-current` — lê `currentDate` injetado, calcula gap vs cutoff, busca atualizações em 9 fontes canônicas (Next 16, Vercel, Stripe, Prisma 7, Sentry, React 19, Tailwind 4, Zod 4, iron-session). Background-friendly via hook SessionStart
  - `p8-master:update-claude-docs` — fetch incremental de docs Anthropic / Claude Code (release-notes, changelog, hooks, skills, plugins, MCP). Gap > 7d default, snapshot em `references/claude-docs/`
- 3 scripts Python:
  - `scripts/currentdate-gap.py` — gap math + threshold por domínio (default 14d)
  - `scripts/detect-repeat-tools.py` — n-grams 3-7 cross-sessão + threshold conservador (5×3) + normalização de paths /worktrees/<hash>/
  - `scripts/lessons-extract.py` — categoriza erros recorrentes + invocações de skills + exclusão de sessões selfAudit
- 2 hooks PowerShell:
  - `hooks/stop-lessons-incremental.ps1` — append da sessão atual em `state/sessions/<YYYY-MM-DD>.jsonl`
  - `hooks/user-prompt-detect-repeat.ps1` — match prompt vs cache de padrões detectados, sugere skill ou script
- `references/canonical-sources.md` — tabela de URLs canônicas (libs P8 + docs Claude Code + pesquisa de mercado), versões usadas em P8 lidas de `package.json`
- `state/last-update.json` — placeholder inicial do cache stay-current
- `state/sessions/.gitkeep` + `state/aggregates/.gitkeep` — preserva estrutura

### Testes adicionados

- `tests/unit/test_currentdate_gap.py` — 6 casos (sem state, abaixo/acima threshold, state corrompido, threshold custom, etc.)
- `tests/unit/test_detect_repeat_tools.py` — 5 casos (sem transcripts, abaixo/acima threshold, janela, normalização worktree)
- `tests/unit/test_lessons_extract.py` — 6 casos (script, help, sem transcripts, erros recorrentes, exclusão selfAudit, skill invocations)
- `tests/fixtures/transcript-sample.jsonl` — fixture pra test e dev
- Atualizado `test_skill_orchestrator.ps1` — agora valida 13 skills (+ 4 self-improvement), 6 hooks (+ 2 novos), 9 scripts (+ 3 novos), references + state

### Validação

Suite (`pwsh -File tests/run-all.ps1`) **TUDO PASSOU**:
- **37/37 testes pytest** verde (+19 novos da Fase 4)
- 2/2 PowerShell integration suites verde

### Pendências

- 8 skills domínio P8 (snapshot, stripe-sync, prisma-migrate, deploy, plan-limits-audit, rate-limit-design, sentry-health, custom-album) — Fase 5
- Documentação completa em `docs/` — Fase 6

---

## [0.5.0] — 2026-05-10

### Adicionado (Fase 5 — Skills domínio P8 + agents + scripts infra)

- 8 skills domínio P8 (todas em PT-BR, formato pushy):
  - `p8-master:p8-snapshot` — extrai 6 seções (Modelo Negócio, Entidades, Stack, Custom Events, Páginas, Design) → `product-snapshot.md`
  - `p8-master:p8-stripe-sync` — smoke E2E Stripe webhook (checkout/invoice/subscription), aborta se key live, valida signature
  - `p8-master:p8-prisma-migrate` — wrapper migrate/push com diff antes de aplicar, bloqueia push em prod
  - `p8-master:p8-deploy` — orquestra deploy Vercel com 7 pré-checks (gate, push sync, schema drift, env vars críticas), gate humano Akita-style
  - `p8-master:p8-plan-limits-audit` — audita gates desabilitados em `src/lib/plan-limits.ts`, lista callers, sugere plano de restauração
  - `p8-master:p8-rate-limit-design` — pesquisa libs (Upstash, in-memory, Vercel WAF) + gera plano de implementação
  - `p8-master:p8-sentry-health` — audita config Sentry inativa, smoke test pra ativação
  - `p8-master:p8-custom-album` — valida parser de stickers (ranges, prefixos), slug `custom_*`, conversão `CustomAlbum` → `Album`
- 2 sub-agents bundled:
  - `p8-domain-expert` (Sonnet) — conhece produto/stack/modelos/padrões P8 sem re-pesquisar
  - `deploy-watcher` (Sonnet) — monitora deployments Vercel pós-deploy (build → ready, smoke, runtime logs 2min, sugere rollback)
- 3 scripts PowerShell:
  - `scripts/stripe-smoke.ps1` — wrapper `stripe trigger` + parse webhook log + cleanup
  - `scripts/prisma-diff-guard.ps1` — `prisma migrate diff` + prompt antes de aplicar, dupla confirmação em prod, bloqueia `migrate reset`
  - `scripts/vercel-deploy-prod.ps1` — 7 pré-checks (working tree, branch, push sync, tests, tsc, build, schema drift) + gate humano + deploy
- 4 references:
  - `references/stripe-flows.md` — checkout/subscription/customer-portal + webhook event types + signature validation + env vars + testes locais
  - `references/sentry-setup.md` — passo-a-passo ativação + smoke test + tags úteis + Performance/Replay + alertas
  - `references/neon-prisma-adapter.md` — WebSocket Pool vs HTTP, Lazy Proxy, generator novo `prisma-client`, quirks de migration, performance tips
  - `references/windows-quirks.md` — paths absolutos, encoding cp1252 → UTF-8, PowerShell quirks, Stripe CLI Windows, hooks execution
- 3 evals JSON:
  - `evals/p8-stripe-sync.evals.json` — 4 casos (happy path, detecta sk_live_, signature failure, gaps conhecidos)
  - `evals/lessons-audit.evals.json` — 4 casos (erros recorrentes, exclusão self-audit, respeita rejections, sem dados)
  - `evals/stay-current.evals.json` — 5 casos (skip fresh, fetch stale, detecta crítico, offline gracioso, cita fontes)

### Atualizado

- `tests/integration/test_skill_orchestrator.ps1` agora valida 21 skills (+ 8 domínio P8), 11 agents (+ 2 P8), 12 scripts (+ 3 P8), 9 references (+ 4 P8)

### Validação

Suite (`pwsh -File tests/run-all.ps1`) **TUDO PASSOU**:
- 37/37 testes pytest verde
- 2/2 PowerShell integration suites verde
- Skill orchestrator valida 21 skills + 11 agents + 12 scripts + 9 references + state

### Pendências (entram na fase final)

- Documentação completa em `docs/` — Fase 6
- Hardening + eat your own dogfood
- Bump para v1.0.0 ao final

---

## [1.0.0] — 2026-05-10 🎉

### Adicionado (Fase 6 — Documentação completa + hardening + v1.0.0)

5 documentos finais em `docs/`:

- `docs/ARCHITECTURE.md` — decisões de design (princípios, composição 4 metodologias, estrutura de pastas, ativação tripla, decisões justificadas, fluxo de sessão, dependências, versionamento, limitações conhecidas)
- `docs/ACTIVATION.md` — mecanismo tripo de ativação (`@import` + hook SessionStart + description "pushy"), instalação passo-a-passo, coexistência com hooks existentes, desativação temporária, troubleshooting
- `docs/SELF_IMPROVEMENT.md` — loop fechado completo: trigger → análise → 4 categorias → propostas → gate humano → aplicação → bumpversão → CHANGELOG. Anti-loops (sessões selfAudit, rejections, threshold conservador, validade 30d). Métricas. Scripts de fallback
- `docs/DAILY_UPDATE.md` — mecânica `currentDate`: hook SessionStart → currentdate-gap.py → threshold 14d → stay-current paralelo → severidade CRÍTICO/NÃO-CRÍTICO/PATCH. Padrão pesquisador anti-cutoff. Estado em `state/last-update.json`
- `docs/CONTRIBUTING.md` — guia para adicionar skill/agent/script/hook/reference/template novo. 9-step workflow. Templates concretos. Anti-padrões a evitar. Checklist pre-PR

### Hardening

- `python scripts/validate-frontmatter.py -r skills/` → 24/24 válidos
- `python scripts/validate-frontmatter.py -r agents/` → 11/11 válidos
- `python scripts/inventory.py --root .` → 61 markdown + 14 PowerShell + 12 Python + 9 JSON
- `pwsh -File tests/run-all.ps1` → TUDO PASSOU (37/37 pytest + 2/2 integration)

### Marco v1.0.0

Plugin P8-MASTER completo conforme plano `~/.claude/plans/planeje-um-plugin-cosmic-sedgewick.md`:

| Componente | Quantidade |
|---|---|
| Skills | 21 (orquestrador + 5 SMA core + 4 SMA utilities + 2 Oracle + 4 Self-improvement + 8 Domínio P8) |
| Sub-agents | 11 (3 SMA + 6 Oracle + 2 P8) |
| Hooks PowerShell | 6 (SessionStart, validate-thoughts, precommit-router, pretooluse-deny-secrets, stop-lessons-incremental, user-prompt-detect-repeat) |
| Scripts | 12 (2 PS bootstrap + 7 Python + 3 PS infra P8) |
| References | 9 (4 base + canonical-sources + 4 P8 infra) |
| Templates | 7 |
| Evals | 6 JSON |
| Testes pytest | 37 |
| Testes integration | 2 PowerShell suites |
| Docs | 5 estáveis |

### Loops fechados

1. **SMA pipeline:** pesquisa → plano (gate) → valida → implementa (TDD + gate) → commit (gate verde) → deploy (gate humano) → handoff
2. **Oracle 7 fases:** estrategia-geral → marketing → estrutura → designer → definicao-prototipo → criacao-prototipo → oracle-master
3. **Self-improvement:** hook Stop → state/sessions/ → lessons-audit → 4 categorias → thoughts/auto-melhoria/ → gate humano → skill-creator apply → bump → CHANGELOG
4. **Daily update:** hook SessionStart → currentdate-gap.py → 9 fontes canônicas → stay-current → diff em thoughts/atualizacoes/

### Bump

0.5.0 → 1.0.0 (major: marco do plugin completo, todas as 6 fases entregues conforme plano).

### Pendências futuras (v1.1+)

- Skill `/p8-master:revisar-melhorias` — UI explícita pra aprovar propostas em batch
- Categorias C (skills lentas) e D (mal-acionadas) com state tracker de duração / resultado descartado
- Cron diário automático de `stay-current` (Windows Task Scheduler)
- `--report` JSON estruturado em todas skills (pra dashboard externo)
- Snapshot diff em `references/claude-docs/` (Fase atual: lista URLs canônicas, não cacheia)

---

## Histórico de fases

| Versão | Data | Fase | Commit |
|---|---|---|---|
| 0.1.0 | 2026-05-10 | Fase 1 — SMA core + ativação | f63a4da |
| 0.2.0 | 2026-05-10 | Fase 2 — SMA utilities + hooks + testes | 559f920 |
| 0.3.0 | 2026-05-10 | Fase 3 — Oracle wrappers + 6 agents + 2 scripts | e0f68fe |
| 0.4.0 | 2026-05-10 | Fase 4 — Self-improvement loop | c70d7b5 |
| 0.5.0 | 2026-05-10 | Fase 5 — Skills domínio P8 + agents + infra | 1e1ad8e |
| **1.0.0** | **2026-05-10** | **Fase 6 — Docs + hardening + v1.0.0** | (este commit) |
