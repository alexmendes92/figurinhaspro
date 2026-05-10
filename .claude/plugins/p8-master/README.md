# P8-MASTER — Plugin Claude Code para P8-FigurinhasPro

> Plugin local versionado junto com o código P8. Compõe **SMA** (System Master ACE) + **Akita Bootstrap** + **Oracle** (análise estratégica) + **auto-melhoria** num pipeline único. Auto-ativa em qualquer sessão dentro de P8-FigurinhasPro.

---

## O que é

Plugin canônico de governança, planejamento, implementação e auto-melhoria para o projeto **P8-FigurinhasPro** (SaaS de revendedoras de figurinhas, Next.js 16 + Prisma 7 + Stripe + Sentry).

**Pipeline central:** `pesquisa → plano → valida → implementa → itera` + utilities (`commit`, `pr`, `handoff`, `hurdle`).

**Autonomia:** Akita-style — humano aprova `/plano`; agente executa pesquisa/análise/implementação automaticamente. Deploy prod e edits em SKILL.md/CLAUDE.md exigem gate humano.

**Idioma:** PT-BR.

---

## Status

- **Versão:** 0.2.0 (Fase 1 + Fase 2 — SMA core + utilities + bateria de testes verde)
- **Data:** 2026-05-10
- **Plano:** [planeje-um-plugin-cosmic-sedgewick.md](C:\Users\conta\.claude\plans\planeje-um-plugin-cosmic-sedgewick.md)
- **Suite de testes:** `pwsh -File tests/run-all.ps1` — 18/18 pytest + 2/2 integration verde

### Fase 1 entregue

- [x] Estrutura completa de pastas (24 skills, 11 agents, 6 hooks, 12 scripts, 9 references, 7 templates)
- [x] `.claude-plugin/plugin.json` + `permissions.json`
- [x] Skill orquestradora `p8-master:p8-master` com description "pushy"
- [x] 5 SMA core skills: `pesquisa`, `plano`, `valida`, `implementa`, `itera`
- [x] 3 sub-agents: `explorador`, `historiador`, `revisor`
- [x] 2 hooks: `session-start.ps1`, `validate-thoughts.ps1`
- [x] 2 scripts bootstrap: `thoughts-init.ps1`, `spec-metadata.ps1`
- [x] 3 references: `p8-glossario.md`, `stack-cheatsheet.md`, `workflow-sma.md`
- [x] 5 templates (pesquisa, plano, handoff, decisao, revisao) + thoughts-readme + thoughts-glossario
- [x] Ativação tripla: `@import` em CLAUDE.md, hook SessionStart em settings.json, descrição "pushy"

### Fase 2 entregue

- [x] 4 SMA utilities: `commit`, `pr`, `handoff`, `hurdle`
- [x] 2 hooks adicionais: `precommit-router.ps1`, `pretooluse-deny-secrets.ps1`
- [x] 2 scripts Python: `validate-frontmatter.py`, `inventory.py`
- [x] Bateria de testes inicial: 11 + 7 pytest unit + 2 PowerShell integration suites
- [x] 3 evals JSON iniciais (`pesquisa`, `plano`, `implementa`)
- [x] `tests/run-all.ps1` + `tests/run-all.sh` (Windows + Unix)

### Próximas fases

- **Fase 3** — Oracle wrappers + 6 agents Oracle + 4 scripts Python
- **Fase 4** — Self-improvement (lessons-audit, skill-creator, stay-current, update-claude-docs) + estado
- **Fase 5** — Skills domínio P8 (snapshot, stripe-sync, prisma-migrate, deploy, plan-limits-audit, rate-limit-design, sentry-health, custom-album)
- **Fase 6** — Documentação completa, CHANGELOG, hardening, eat your own dogfood

---

## Como ativar

### Já ativado automaticamente

O plugin auto-ativa em qualquer sessão Claude Code dentro de `P8-FigurinhasPro/` via:

1. **`@import` em [CLAUDE.md](../../../CLAUDE.md):**
   ```markdown
   @.claude/plugins/p8-master/skills/p8-master/SKILL.md
   ```
   Carrega a skill orquestradora no system prompt.

2. **Hook `SessionStart`** em `P8-FigurinhasPro/.claude/settings.json`:
   ```json
   "SessionStart": [{"matcher": "*", "hooks": [
     {"type": "command", "command": "pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/plugins/p8-master/hooks/session-start.ps1"}
   ]}]
   ```
   Roda script de boot que valida cwd, carrega glossário, dispara `currentdate-gap.py` (a partir da Fase 4).

3. **Description "pushy"** da skill orquestradora — disparada por menções a "p8", "figurinhaspro", arquivos em `src/`, `prisma/`, `output/`, `thoughts/`.

### Bootstrap inicial

Se `thoughts/` ainda não existe (ou está incompleto):

```powershell
pwsh -File .claude/plugins/p8-master/scripts/thoughts-init.ps1
```

Cria pastas + README + glossário inicial. Idempotente.

---

## Como usar

### Pipeline canônico

```bash
# 1. Pesquisar área antes de planejar
/p8-master:pesquisa "fluxo de Stripe webhook"
# → thoughts/pesquisas/2026-05-10-stripe-webhook-flow.md

# 2. Planejar mudança baseada na pesquisa
/p8-master:plano "adicionar idempotência em webhook"
# → thoughts/planos/2026-05-10-webhook-idempotency.md (status: rascunho)
# → AGUARDA aprovação humana

# 3. Validar plano antes de implementar (opcional, mas recomendado)
/p8-master:valida thoughts/planos/2026-05-10-webhook-idempotency.md
# → diff inline + checklist

# 4. Após aprovação, implementar
/p8-master:implementa thoughts/planos/2026-05-10-webhook-idempotency.md
# → TDD Red→Green→Refactor por fase
# → gate pre-commit por commit
# → aborta no primeiro vermelho

# 5. Iterar se descoberta nova surgiu
/p8-master:itera thoughts/planos/2026-05-10-webhook-idempotency.md
# → preserva histórico

# 6. Commit (geralmente automático em /implementa)
/p8-master:commit

# 7. Captura estado de sessão
/p8-master:handoff
# → thoughts/handoffs/2026-05-10-webhook-idempotency.md
```

### Roteador central

Ou simplesmente descreva sua intenção:

```bash
/p8-master implementar email Resend após pagamento Stripe
```

A skill orquestradora rotea pra sub-skill correta.

---

## Estrutura

```
.claude/plugins/p8-master/
├── .claude-plugin/      # plugin.json + permissions.json
├── README.md            # este arquivo
├── CHANGELOG.md         # histórico de versões
├── skills/              # 24 SKILL.md
├── agents/              # 11 sub-agents
├── hooks/               # 6 hooks (.ps1)
├── scripts/             # 12 scripts (Python + PowerShell)
├── references/          # docs leves
├── templates/           # modelos de artefatos
├── evals/               # benchmarks por skill
├── tests/               # bateria do plugin
├── state/               # cache local (gitignored)
└── docs/                # docs do plugin
```

---

## Princípios

1. **Humano decide o QUÊ. Agente decide o COMO.** Plano sempre com gate humano.
2. **Pesquisa antes de plano.** Plano sem pesquisa é cego — abortou.
3. **TDD não-negociável.** Mudança de comportamento começa por teste vermelho.
4. **Gate pre-commit obrigatório.** `npm run test` → `tsc --noEmit` → `npm run build`. Vermelho bloqueia.
5. **Deploy prod com gate humano.** Akita override do CLAUDE.md "deploy automático".
6. **Não acumulo escopo.** "Já que estou aqui" → tarefa nova, não expansão.

---

## Coexistência com hooks existentes

O plugin coexiste com hooks já ativos em [P8-FigurinhasPro/.claude/hooks/](../../../.claude/hooks/) — `precommit-router.sh` e `validate-thoughts.sh`. Plugin adiciona seus próprios hooks em `settings.json`, não sobrescreve.

---

## Documentação

- [references/workflow-sma.md](references/workflow-sma.md) — pipeline SMA detalhado
- [references/p8-glossario.md](references/p8-glossario.md) — termos do domínio P8
- [references/stack-cheatsheet.md](references/stack-cheatsheet.md) — Next 16, Prisma 7, Tailwind 4, Zod 4 quirks
- [CHANGELOG.md](CHANGELOG.md) — histórico de versões

---

## Licença

Interno (Arena Cards). Metodologia SMA baseada em [System Master ACE](C:\Users\conta\Projetos\Documentação\System Master ACE\) (Fabio Akita + HumanLayer).
