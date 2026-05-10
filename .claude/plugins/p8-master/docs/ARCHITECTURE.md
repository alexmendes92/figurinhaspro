# Arquitetura do plugin P8-MASTER

> Decisões de design e por quê. Atualize este arquivo quando mudar uma decisão estrutural.

---

## Princípio-mãe

**Plugin é local, focado, autônomo dentro do limite Akita.**

- Local em `P8-FigurinhasPro/.claude/plugins/p8-master/` (não global em `~/.claude/`).
- Atua **exclusivamente** em P8-FigurinhasPro.
- Versionado junto com o código do projeto.
- Pesquisa/análise/refactor são automáticos. Plano, deploy, edit em SKILL.md, migration prod sempre exigem aprovação humana.

---

## Composição: 4 metodologias num pipeline

| Camada | Origem | Função | Skills |
|---|---|---|---|
| **SMA** (System Master ACE) | `Documentação/System Master ACE/` | Pipeline canônico research → plan → implement | `pesquisa`, `plano`, `valida`, `implementa`, `itera`, `commit`, `pr`, `handoff`, `hurdle` |
| **Akita Bootstrap** | Fabio Akita 2026 + `~/.claude/skills/akita-tdd/` | TDD Red→Green→Refactor + 5 fases B.1-B.5 + ritmo micro-passos | Embedded em `implementa` + `references/workflow-akita-bootstrap.md` |
| **Oracle** | `~/.claude/plugins/marketplaces/.../oracle/` | Análise estratégica em 6 fases | `oracle-analise`, `oracle-reportar` + 6 agents |
| **Self-improvement** | Novo (gap detectado nas skills existentes) | Loop fechado de auto-melhoria por sessão | `lessons-audit`, `skill-creator`, `stay-current`, `update-claude-docs` |

**Por quê compor em vez de ter 4 plugins separados?**
- Coerência: pipeline unificado evita lacunas (ex: pesquisa Oracle não alimenta `/plano` SMA)
- Performance: 1 plugin = 1 SessionStart hook, 1 cache de state
- Manutenção: mudança em 1 fase atualiza só 1 arquivo
- Domínio P8 embutido em 1 lugar (`p8-domain-expert` agent + 4 references)

---

## Estrutura de pastas

```
.claude/plugins/p8-master/
├── .claude-plugin/
│   ├── plugin.json          # manifesto (nome, versão, ativação)
│   └── permissions.json     # allow/ask/deny específicos do plugin
├── README.md                # entry point pra humano
├── CHANGELOG.md             # histórico de versões (semver)
├── .gitignore               # ignora cache local (state/sessions, etc)
│
├── skills/                  # 21 SKILL.md namespaced p8-master:*
│   ├── p8-master/           # orquestrador (entry da skill)
│   ├── pesquisa/, plano/, valida/, implementa/, itera/   # 5 SMA core
│   ├── commit/, pr/, handoff/, hurdle/                   # 4 SMA utilities
│   ├── oracle-analise/, oracle-reportar/                 # 2 Oracle wrappers
│   ├── lessons-audit/, skill-creator/, stay-current/, update-claude-docs/  # 4 self-improvement
│   └── p8-snapshot/, p8-stripe-sync/, p8-prisma-migrate/, p8-deploy/,
│       p8-plan-limits-audit/, p8-rate-limit-design/, p8-sentry-health/, p8-custom-album/  # 8 domínio
│
├── agents/                  # 11 sub-agents .md
│   ├── explorador.md, historiador.md, revisor.md  # SMA
│   ├── extrator.md, analista-gerador.md, pesquisador.md,
│   │   critico-adversarial.md, arquiteto-estrategico.md, qa-estrutural.md  # Oracle
│   └── p8-domain-expert.md, deploy-watcher.md  # P8
│
├── hooks/                   # 6 hooks PowerShell (com .sh fallback alguns)
│   ├── session-start.ps1, validate-thoughts.ps1
│   ├── precommit-router.ps1, pretooluse-deny-secrets.ps1
│   └── stop-lessons-incremental.ps1, user-prompt-detect-repeat.ps1
│
├── scripts/                 # 12 scripts (Python + PS)
│   ├── thoughts-init.ps1, spec-metadata.ps1            # bootstrap
│   ├── inventory.py, grep-evidence.py, validate-frontmatter.py, load-prior-reports.py  # Oracle
│   ├── currentdate-gap.py, detect-repeat-tools.py, lessons-extract.py  # self-improvement
│   ├── stripe-smoke.ps1, prisma-diff-guard.ps1, vercel-deploy-prod.ps1  # P8 infra
│   └── auto-generated/      # scripts gerados por skill-creator (gitignore)
│
├── references/              # 9 docs leves consultadas sob demanda
│   ├── p8-glossario.md, stack-cheatsheet.md, workflow-sma.md, workflow-akita-bootstrap.md
│   ├── canonical-sources.md, stripe-flows.md, sentry-setup.md, neon-prisma-adapter.md
│   └── windows-quirks.md
│
├── templates/               # 7 modelos de artefatos
│   ├── pesquisa.md, plano.md, handoff.md, decisao.md, revisao.md
│   └── thoughts-readme.md, thoughts-glossario.md
│
├── evals/                   # 6 JSON pra benchmark (Anthropic skill-creator format)
│   ├── pesquisa, plano, implementa, p8-stripe-sync, lessons-audit, stay-current
│   └── shared/fixtures/
│
├── tests/                   # bateria do próprio plugin
│   ├── unit/                # 37 testes pytest
│   ├── integration/         # 2 PowerShell suites
│   ├── fixtures/            # transcript-sample.jsonl + frontmatter-good/bad.md
│   ├── run-all.ps1          # entry Windows
│   └── run-all.sh           # entry Unix
│
├── state/                   # cache local do plugin (gitignored exceto last-update.json template)
│   ├── sessions/            # JSONL por sessão (consumido por lessons-audit)
│   ├── aggregates/          # diários/semanais
│   └── last-update.json     # cache stay-current (template seed versionado)
│
└── docs/                    # docs estáveis pra humano
    ├── ARCHITECTURE.md      # este arquivo
    ├── ACTIVATION.md        # como o plugin ativa por sessão
    ├── SELF_IMPROVEMENT.md  # ciclo de auto-melhoria
    ├── DAILY_UPDATE.md      # mecânica currentDate
    └── CONTRIBUTING.md      # como adicionar skill/agent/script novo
```

---

## Ativação tripla

Plugin ativa em **todas** as sessões dentro de P8-FigurinhasPro via 3 mecanismos paralelos:

1. **`@import` em `P8-FigurinhasPro/CLAUDE.md`** (top of file):
   ```markdown
   @.claude/plugins/p8-master/skills/p8-master/SKILL.md
   ```
   Carrega description "pushy" do orquestrador no system prompt.

2. **Hook `SessionStart`** em `P8-FigurinhasPro/.claude/settings.json`:
   ```json
   "SessionStart": [{"matcher": "*", "hooks": [
     {"type": "command", "command": "pwsh -File .claude/plugins/p8-master/hooks/session-start.ps1"}
   ]}]
   ```
   Hook valida cwd, carrega `references/p8-glossario.md`, dispara `currentdate-gap.py` em background.

3. **Description "pushy"** da skill `p8-master:p8-master`:
   > "Auto-ativa SEMPRE em qualquer sessão dentro de P8-FigurinhasPro... NÃO É OPCIONAL"

Os 3 mecanismos são redundantes — se 1 falha, os outros 2 cobrem. Detalhes em [ACTIVATION.md](ACTIVATION.md).

---

## Decisões de design

### 1. PowerShell como linguagem primária dos hooks/scripts

**Decisão:** `.ps1` com `.sh` fallback para alguns.

**Razão:**
- P8 roda em Windows nativo (cwd = `C:\Users\conta\Projetos\...`)
- PowerShell é nativo Windows (sem dependência adicional)
- Bash via Git Bash funciona mas tem encoding cp1252 issues
- Hooks devem ser cross-shell-friendly (executar em qualquer terminal)

**Alternativa rejeitada:** Node.js como runtime universal. Rejeitado porque overhead de startup (200-500ms) é alto pra hook que roda a cada `git commit`.

### 2. Python pra scripts complexos (inventário, parsing JSONL)

**Decisão:** Python 3.10+ com stdlib only (sem pip install).

**Razão:**
- Python tem JSON/regex/datetime stdlib robusta
- Cross-platform (não depende de PowerShell)
- 7 scripts críticos (inventory, grep-evidence, validate-frontmatter, load-prior-reports, currentdate-gap, detect-repeat-tools, lessons-extract)
- Encoding UTF-8 fix conhecido (3 linhas no topo do script)

**Alternativa rejeitada:** Node.js. Rejeitado porque parsing JSONL/markdown em JS é mais verboso e há `.pyc` cache automático em Python.

### 3. State em JSONL append-only (não SQLite)

**Decisão:** `state/sessions/<YYYY-MM-DD>.jsonl` com 1 entry por sessão.

**Razão:**
- Append-only é simples (sem corrupção parcial)
- JSONL é parseável line-by-line (memória eficiente)
- Diff via git é legível
- `lessons-audit` faz scan + filter, não precisa indexação

**Alternativa rejeitada:** SQLite. Rejeitado porque:
- Adiciona dependência (sqlite3 module)
- Locking pode bloquear hooks rápidos
- Diff binário não é legível em PR

### 4. Agents Sonnet por default, Opus seletivo, Haiku pra mecânico

**Decisão:**
- Haiku: extração mecânica (`extrator`, `qa-estrutural`)
- Sonnet: análise estruturada, redação, busca (`analista-gerador`, `pesquisador`, `revisor`, `explorador`, `historiador`, `p8-domain-expert`, `deploy-watcher`)
- Opus: síntese cross-fase, crítica adversarial (`arquiteto-estrategico`, `critico-adversarial`)

**Razão:**
- Custo: Haiku é ~10x mais barato que Opus
- Performance: trabalho mecânico não justifica Opus (latência 2-3x)
- Qualidade: síntese cross-source exige Opus (contexto longo + raciocínio)

### 5. Permissions compostas (não substituídas)

**Decisão:** `permissions.json` do plugin **adiciona** sobre `~/.claude/settings.json` global do user, não substitui.

**Razão:**
- Coexistência com permissions globais (ex: user pode ter `Read(.env)` permitido em outros projetos)
- Plugin foca em **deny adicional** (defesa em profundidade)
- Allow do plugin é **expansion** (ex: `Bash(npx vercel deploy*)` que global pode não ter)

### 6. Auto-melhoria opt-in via aprovação humana

**Decisão:** `lessons-audit` propõe diffs em `thoughts/auto-melhoria/<arquivo>.md` (status: rascunho). Skill-creator só aplica após aprovação humana via `/p8-master:apply-proposal <path>`.

**Razão:**
- Akita-style: humano aprova mudanças em SKILL.md/CLAUDE.md/AGENTS.md (são especificações)
- Evita loop de auto-modificação descontrolada
- Auditoria via `state/rejections.jsonl` previne re-proposta de coisa rejeitada

### 7. Fontes canônicas hardcoded em references/canonical-sources.md

**Decisão:** Lista das 9 URLs canônicas (libs P8 + 9 docs Claude Code) é versionada no plugin.

**Razão:**
- Determinismo: `stay-current` consulta sempre as mesmas fontes
- Manutenção: mudança de URL é commit no plugin (rastreável)
- Sem dependência externa (sem chamada à API de "find canonical sources")

**Alternativa rejeitada:** Buscar via Google. Rejeitado porque ranking SEO muda, retorna conteúdo de baixa qualidade primeiro.

---

## Fluxo de uma sessão típica

```
1. User abre Claude Code em P8-FigurinhasPro/
   ↓
2. Hook SessionStart roda (200ms)
   - Valida cwd dentro de P8
   - Carrega references/p8-glossario.md no contexto
   - Dispara currentdate-gap.py em background
   ↓
3. CLAUDE.md de P8 carrega
   - @import skills/p8-master/SKILL.md (description pushy)
   ↓
4. User digita pedido livre (ex: "implementar email Resend")
   ↓
5. Skill p8-master:p8-master decide rota:
   - Detecta "implementar" → cenário "feature nova"
   - Roteia: pesquisa → plano → valida → implementa → commit → deploy
   ↓
6. Sub-skills SMA executam com gates Akita-style
   - /pesquisa: spawn explorador + historiador em paralelo
   - /plano: gera rascunho, aguarda aprovação humana
   - /valida: checklist universal + P8-específica
   - /implementa: TDD ciclo + hook pre-commit
   - /commit: gate verde + mensagem imperativa
   - /p8-deploy: 7 pré-checks + gate humano
   ↓
7. Hook Stop append em state/sessions/<data>.jsonl
   - timestamp, session_id, tools_used (resumido)
   ↓
8. Próxima sessão: lessons-audit pode consumir esse JSONL pra detectar padrões
```

---

## Dependências externas

### Runtime (sempre presentes em P8)

- Node.js + npm (P8 já usa)
- Git for Windows (P8 já usa)

### Hooks/scripts dependem de

- PowerShell 7+ (`pwsh`) — Windows nativo, instalável via winget/scoop
- Python 3.10+ (em PATH) — necessário pra scripts inventory, validate-frontmatter, etc.
- ripgrep (`rg`) — para `grep-evidence.py` (alternativa: substituir por subprocess Python)
- Stripe CLI — para `/p8-master:p8-stripe-sync`
- Vercel CLI — para `/p8-master:p8-deploy`

Plugin checa presença em hooks/scripts e degrade gracioso (warning, não crash).

### Anthropic / Claude Code

- Hooks API (PreToolUse, SessionStart, Stop, UserPromptSubmit)
- Skills (com namespace `p8-master:*`)
- Sub-agents (Haiku/Sonnet/Opus)
- WebFetch / WebSearch (para `pesquisador`)

---

## Versionamento

Semver:
- **Major (X.0.0)** — breaking change na interface dos slash commands
- **Minor (0.X.0)** — skill nova, agent novo, script novo
- **Patch (0.0.X)** — edit em description, bugfix, doc update

`plugin.json` é fonte de verdade. `CHANGELOG.md` documenta cada bump com `[auto-melhoria]` se foi via lessons-audit.

---

## Limitações conhecidas

1. **Plugin é Windows-first.** Hooks `.ps1`, scripts `.ps1`. Linux/Mac via Git Bash + `pwsh` instalado, mas não foi testado.
2. **`pesquisador` precisa rede.** Em sessões offline, `stay-current`/`update-claude-docs`/`oracle:pesquisa` degradam.
3. **State não compartilha entre devs.** Cada dev tem seu `state/sessions/` local — `lessons-audit` é por-dev.
4. **Auto-melhoria não cobre ainda:** skills lentas (categoria C) e mal-acionadas (categoria D) são placeholders em `lessons-extract.py`.
5. **Dogfood não-completo:** plugin não roda `/p8-master:lessons-audit` em si mesmo automaticamente. Pendente em Fase 6.

---

## Ver também

- [ACTIVATION.md](ACTIVATION.md) — como ativa por sessão
- [SELF_IMPROVEMENT.md](SELF_IMPROVEMENT.md) — ciclo de auto-melhoria detalhado
- [DAILY_UPDATE.md](DAILY_UPDATE.md) — mecânica currentDate
- [CONTRIBUTING.md](CONTRIBUTING.md) — como adicionar skill nova
- [README.md](../README.md) — visão geral
- [CHANGELOG.md](../CHANGELOG.md) — histórico
- [planeje-um-plugin-cosmic-sedgewick.md](C:\Users\conta\.claude\plans\planeje-um-plugin-cosmic-sedgewick.md) — plano original
