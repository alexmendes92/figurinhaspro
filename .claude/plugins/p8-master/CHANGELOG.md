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

## [Unreleased]

### Planejado

Ver [planeje-um-plugin-cosmic-sedgewick.md](C:\Users\conta\.claude\plans\planeje-um-plugin-cosmic-sedgewick.md) para roadmap completo.
