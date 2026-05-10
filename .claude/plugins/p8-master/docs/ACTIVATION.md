# Ativação do plugin P8-MASTER

> Como o plugin se garante de estar ativo em **toda** sessão dentro de P8-FigurinhasPro.

---

## Mecanismo tripo (redundante por design)

Os 3 mecanismos rodam em paralelo. Se 1 falha (ex: hook bloqueado por antivírus), os outros 2 ainda ativam o plugin.

### 1. `@import` em CLAUDE.md de P8

`P8-FigurinhasPro/CLAUDE.md` topo:

```markdown
@.claude/plugins/p8-master/skills/p8-master/SKILL.md

# This is NOT the Next.js you know
...
```

**O que faz:** Claude Code carrega o conteúdo da skill orquestradora (description + body) no system prompt da sessão. Description "pushy" garante que skill é considerada em qualquer pedido do usuário.

**Quando falha:** se CLAUDE.md de P8 for editado e remover o `@import`, hook + description ainda tentam ativar.

### 2. Hook `SessionStart` em settings.json

`P8-FigurinhasPro/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/plugins/p8-master/hooks/session-start.ps1"
          }
        ]
      }
    ]
  }
}
```

**O que faz:**
- Roda `hooks/session-start.ps1` antes da primeira mensagem do user
- Hook valida que cwd está em P8 (saída silenciosa se não)
- Carrega `references/p8-glossario.md` no contexto (sinaliza presença)
- Dispara `currentdate-gap.py` em background pra checar se libs precisam refresh

**Performance:**
- Síncrono <500ms (lê last-update.json + emite mensagens curtas)
- Pesado fica async (currentdate-gap.py)

**Quando falha:** se hook é bloqueado (antivírus, permissions), session continua mas sem aviso. `@import` + description cobrem.

**Output esperado** (visível ao user no início da sessão):
```
[p8-master] Plugin ativo em P8-FigurinhasPro.
[p8-master] Pipeline canonico: /p8-master pesquisa -> plano -> valida -> implementa -> commit.
[p8-master] Gates humanos: aprovacao de plano + deploy prod sempre.
[p8-master] currentdate-gap.py disparado em background.
[p8-master] references/p8-glossario.md disponivel - consulte antes de afirmar termos do dominio.
[p8-master] Lembretes:
  - Tarefa nao-trivial = /p8-master pesquisa + plano antes de codar.
  - Gate pre-commit roda automatico: npm run test -> tsc --noEmit -> npm run build.
  - Deploy prod = npx vercel deploy --prod (com aprovacao humana).
```

### 3. Description "pushy" na skill orquestradora

`skills/p8-master/SKILL.md` frontmatter:

```yaml
description: >
  Auto-ativa SEMPRE em qualquer sessão dentro de P8-FigurinhasPro. Roteador central —
  decide qual sub-skill chamar (pesquisa, plano, valida, implementa, itera, commit,
  oracle, audit, deploy, etc.) baseado no pedido do usuário e no estado do projeto.
  NÃO É OPCIONAL — toda interação significativa em P8 passa por este roteador.
  Use também quando o usuário mencionar "p8", "figurinhaspro", "album-digital",
  "stripe webhook", "plan limits", "custom albums", ou referenciar arquivos em
  `src/`, `prisma/`, `output/`, `thoughts/` deste projeto.
```

**O que faz:** Claude vê a description quando lista skills disponíveis. Description "pushy" (com "auto-ativa SEMPRE", "NÃO É OPCIONAL", múltiplas trigger words) garante que skill é considerada mesmo em pedidos vagos.

**Quando funciona melhor:** quando user dá pedido livre ("implementar X") sem invocar skill explicitamente.

**Quando falha:** se Claude decide não consultar skills pra um pedido trivial (ex: "qual o resultado de 2+2"). Mas isso é desejável — não queremos ativar plugin pra perguntas triviais.

---

## Por que 3 mecanismos e não 1

Cada falha modo é diferente:

| Mecanismo | Falha quando... | Outros cobrem |
|---|---|---|
| `@import` | CLAUDE.md foi editado removendo import | Hook + description |
| Hook `SessionStart` | Antivírus bloqueia, PowerShell não está em PATH | `@import` + description |
| Description pushy | Pedido é trivial demais (Claude não consulta skills) | Pedido trivial não precisa de plugin |

Os 3 são fail-safe, não independentes — todos servem ao mesmo fim (ativar plugin), apenas em camadas diferentes.

---

## Como instalar (primeira vez)

Plugin já está versionado no repo P8. Pra ativar em sessão nova:

### 1. Verificar `@import` em CLAUDE.md

```bash
head -1 P8-FigurinhasPro/CLAUDE.md
# Esperado: @.claude/plugins/p8-master/skills/p8-master/SKILL.md
```

Se ausente, adicionar manualmente.

### 2. Verificar hook em settings.json

```bash
grep -A 8 "SessionStart" P8-FigurinhasPro/.claude/settings.json
```

Esperado: bloco com `"command": "pwsh -File .claude/plugins/p8-master/hooks/session-start.ps1"`.

Se ausente, adicionar (ver snippet na seção 2 acima).

### 3. Bootstrapar `thoughts/` (uma vez)

```bash
pwsh -File .claude/plugins/p8-master/scripts/thoughts-init.ps1
```

Cria `thoughts/{pesquisas,planos,revisoes,decisoes,handoffs,auto-melhoria,atualizacoes,shared}/` + README + glossário inicial.

### 4. Smoke test

```bash
# Roda a suite de testes do próprio plugin
pwsh -File .claude/plugins/p8-master/tests/run-all.ps1
```

Esperado: `TUDO PASSOU.`

### 5. Abrir nova sessão Claude Code em P8

```bash
cd P8-FigurinhasPro
claude
```

Hook deve disparar mensagens `[p8-master]` no início. Se não aparecer, verificar `pwsh --version` (precisa 7+).

---

## Coexistência com hooks existentes do P8

P8 já tem hooks em `P8-FigurinhasPro/.claude/hooks/`:
- `precommit-router.sh` (gate `npm run test → tsc → build`)
- `validate-thoughts.sh` (avisa se thoughts/ ausente)

Plugin **adiciona** novos hooks sem sobrescrever:
- `session-start.ps1` (Fase 1)
- `validate-thoughts.ps1` (Fase 1, complementa o `.sh`)
- `precommit-router.ps1` (Fase 2, espelha o `.sh` em PowerShell)
- `pretooluse-deny-secrets.ps1` (Fase 2, defesa adicional)
- `stop-lessons-incremental.ps1` (Fase 4)
- `user-prompt-detect-repeat.ps1` (Fase 4)

**Settings.json existente** roda os hooks `.sh` originais. Plugin **adiciona** hooks `.ps1` na mesma seção `hooks.PreToolUse` ou `hooks.SessionStart`. Claude Code roda **todos** os hooks do matcher.

Sem duplicação de execução: `precommit-router.ps1` checa se `precommit-router.sh` existe e degrade gracioso.

---

## Desativação temporária

Se precisar desativar plugin numa sessão específica:

### Opção 1: Editar CLAUDE.md de P8

Comente o `@import`:
```markdown
<!-- @.claude/plugins/p8-master/skills/p8-master/SKILL.md -->
```

### Opção 2: Definir env var

Em `.env.local`:
```
P8_MASTER_DISABLED=true
```

Hook `session-start.ps1` checa essa var e abort silenciosa se setada.

(Esta feature não está implementada na v0.5.0 — adicionar em Fase 6 hardening se necessário.)

### Opção 3: Rodar fora do P8

Plugin só ativa quando `cwd` está dentro de `P8-FigurinhasPro`. Em outro projeto, hook detecta e sai silencioso.

---

## Troubleshooting

### Plugin não dispara hook

**Sintoma:** abre sessão em P8, não vê mensagens `[p8-master]`.

**Causas:**
1. PowerShell 7+ não instalado → `pwsh` não está em PATH
   - Fix: `winget install Microsoft.PowerShell` ou `scoop install pwsh`
2. ExecutionPolicy bloqueando → mas usamos `-ExecutionPolicy Bypass` no settings.json
3. Hook não está no settings.json → ver seção 2 acima

### Description não dispara

**Sintoma:** user pede "implementar X", plugin não rotea.

**Causas:**
1. Pedido trivial demais (Claude não consulta skills)
2. CLAUDE.md de P8 não tem `@import`
3. SKILL.md tem frontmatter quebrado → rodar `python scripts/validate-frontmatter.py skills/p8-master/SKILL.md`

### Hook trava sessão

**Sintoma:** sessão fica em "loading" por mais de 5s.

**Causas:**
1. `currentdate-gap.py` rodando síncrono em vez de background → checar `session-start.ps1`
2. `pwsh` cold start lento (>2s) — aceitar ou trocar pra `.bat` wrapper

### Suite de testes falha

**Sintoma:** `tests/run-all.ps1` retorna falhas.

Diagnóstico: rodar pytest standalone:
```bash
cd .claude/plugins/p8-master
python -m pytest tests/unit/ -v
```

E PowerShell standalone:
```bash
pwsh -File tests/integration/test_skill_orchestrator.ps1
```

---

## Ver também

- [ARCHITECTURE.md](ARCHITECTURE.md) — visão geral
- [SELF_IMPROVEMENT.md](SELF_IMPROVEMENT.md) — ciclo de auto-melhoria
- [DAILY_UPDATE.md](DAILY_UPDATE.md) — mecânica currentDate
- [CONTRIBUTING.md](CONTRIBUTING.md) — adicionar skill/hook novo
