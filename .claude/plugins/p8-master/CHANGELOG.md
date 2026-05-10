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

## [Unreleased]

### Planejado

Ver [planeje-um-plugin-cosmic-sedgewick.md](C:\Users\conta\.claude\plans\planeje-um-plugin-cosmic-sedgewick.md) para roadmap completo.
