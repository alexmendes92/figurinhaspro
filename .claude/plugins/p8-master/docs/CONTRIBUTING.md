# Como contribuir — plugin P8-MASTER

> Adicionar skill, agent, script, hook, reference no plugin P8-MASTER. Roteiro Akita-style.

---

## Workflow geral (Akita pipeline)

Toda contribuição segue o pipeline SMA do próprio plugin:

```
/p8-master:pesquisa <topico>      ← entender o gap antes
   ↓
/p8-master:plano <tarefa>          ← desenhar mudança
   ↓ [GATE HUMANO]
/p8-master:valida <plano>          ← checar coerência
   ↓
/p8-master:skill-creator create     ← criar SKILL.md / AGENT.md / etc
   ↓
TDD (RED → GREEN → REFACTOR)
   ↓
tests/run-all.ps1                   ← suite verde
   ↓
/p8-master:commit                   ← mensagem imperativa, gate verde
   ↓
/p8-master:pr                       ← gera title + body de PR
```

---

## Adicionar uma skill nova

### Passo 1: Justificar (pesquisa)

Antes de criar skill, confirmar gap real:
- Existe skill similar? (`grep -l "name: p8-master:" skills/*/SKILL.md`)
- O caso de uso é recorrente? (≥3 ocorrências em sessões)
- Existe alternativa via SKILL existente?

Output: `thoughts/pesquisas/<data>-skill-<nome>.md` justificando criação.

### Passo 2: Estrutura

Criar pasta + SKILL.md:

```bash
mkdir -p .claude/plugins/p8-master/skills/<nome>
```

`SKILL.md` template:

```yaml
---
name: p8-master:<nome>
description: >
  Auto-ativa quando o usuário... [trigger words específicos].
  [Função em 1-2 frases].
  Use SEMPRE quando... [regra explícita].
argument-hint: "[descrição opcional dos args]"
---

Vou [verbo principal]: $ARGUMENTS

## Pré-condições

- [precondição 1]
- [precondição 2]

## Sequência

1. **[Passo 1]** com [agent/script/skill envolvido]
2. **[Passo 2]** ...
3. **[GATE HUMANO]** — descrever quando humano aprova
4. **[Passo final]** — gera output

## Output esperado

```markdown
[exemplo de output]
```

## Restrições

- **Não [coisa proibida]**
- **Sempre [comportamento obrigatório]**

## Modelo recomendado

- **Main session: [Haiku|Sonnet|Opus]** — [justificativa]
- **Sub-agents:** [se houver]

## Ver também

- [skills/<relacionada>/SKILL.md](...) — descrição
- [agents/<agent-usado>.md](...) — descrição
- [scripts/<script-usado>](...) — descrição
```

### Passo 3: Description "pushy"

Description é o trigger primário. Aplicar checklist:

- [ ] Começa com "Auto-ativa quando..."
- [ ] Lista 2-3 trigger words verbais
- [ ] Menciona "P8-FigurinhasPro" ou contexto domínio
- [ ] Termina com regra explícita ("use SEMPRE", "NÃO É OPCIONAL")
- [ ] <500 caracteres (caches melhor)

### Passo 4: Evals iniciais

Criar `evals/<nome>.evals.json` com 2-3 casos:

```json
{
  "skill": "p8-master:<nome>",
  "version": "0.1.0",
  "cases": [
    {
      "id": "happy-path",
      "input": "[pedido típico do user]",
      "preconditions": ["[estado esperado do projeto]"],
      "expected_artifacts": ["thoughts/.../sample.md"],
      "expected_keywords": ["palavra1", "palavra2"],
      "min_score": 0.85
    },
    {
      "id": "edge-case",
      "input": "[caso edge]",
      "expected_behavior": "[comportamento]",
      "min_score": 0.95
    }
  ]
}
```

### Passo 5: Atualizar `tests/integration/test_skill_orchestrator.ps1`

Adicionar verificação que skill nova existe + frontmatter válido:

```powershell
foreach ($skill in @("...existing...", "<nome>")) {
    $path = Join-Path $PluginRoot "skills/$skill/SKILL.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex "p8-master:$skill") {
        Write-Host "  PASS: $skill" -ForegroundColor Green
    } else {
        $failures++
    }
}
```

### Passo 6: Documentar em README + CHANGELOG

`README.md`:
- Atualizar contagem de skills
- Adicionar bullet em "skills disponíveis"

`CHANGELOG.md`:
- Adicionar entry sob versão atual ou nova `[Unreleased]`

### Passo 7: Bump `plugin.json`

Skill nova = minor bump (X.**Y**.0).

### Passo 8: Validar suite

```bash
pwsh -File tests/run-all.ps1
```

Tem que retornar `TUDO PASSOU.` Antes de commitar.

### Passo 9: Commit

```
feat(p8-master): adicionar skill <nome> (vX.Y.0)

[descrição em 1-2 frases]

Sequência:
- [passos principais]

Justificativa: [link pro thoughts/pesquisas/...]
Bump: 0.X.Y -> 0.X+1.0 (minor: skill nova).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

---

## Adicionar um sub-agent

### Justificativa

Criar agent novo SOMENTE se:
- Tarefa é executada em paralelo (fan-out)
- Tarefa exige modelo específico (Haiku barato, Opus poderoso)
- Reutilizado por ≥2 skills

### Estrutura

`agents/<nome>.md`:

```yaml
---
name: <nome>
description: >
  [Quando este agent é invocado, em 1-2 frases.]
  [Trabalho específico que faz.]
  [Quando NÃO usar.]
model: [haiku|sonnet|opus]
tools: [lista de tools permitidos]
color: [cor opcional]
---

Você é [função]. Sua tarefa é [escopo].

## Princípios

1. [princípio 1]
2. [princípio 2]

## Tools que você usa

- [tool] — para [propósito]

## Tools que você NÃO usa

- [tool proibido] — porque [razão]

## Output Format

```markdown
[template]
```

## Restrições

- [restrição 1]
- [restrição 2]
```

### Modelo

| Modelo | Quando |
|---|---|
| **Haiku** | Trabalho mecânico (parsing, contagem, validação determinística) |
| **Sonnet** | Análise estruturada, redação, busca, code review |
| **Opus** | Síntese cross-fase, crítica adversarial, decisão sob ambiguidade |

### Atualizar test_skill_orchestrator

Adicionar agent à lista de validação (com modelo esperado).

---

## Adicionar um script

### Justificativa

Script bash/PowerShell/Python só se:
- Determinístico (mesmo input → mesmo output)
- Idempotente (rodar 2x = rodar 1x)
- Usado por ≥2 skills

### Estrutura

#### Python (preferido para parsing/lógica complexa)

`scripts/<nome>.py`:

```python
#!/usr/bin/env python3
"""
<nome>.py — Plugin P8-MASTER

[Descrição em 2-3 linhas]

Uso:
  python <nome>.py --arg1 valor1 [--arg2 valor2]

Exit codes:
  0 — sucesso
  1 — pre-check falhou
  2 — execução falhou
"""

import argparse
import io
import sys

# Forca UTF-8 no Windows (cp1252 quebra em '->')
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description="...")
    parser.add_argument("--arg1", required=True)
    args = parser.parse_args()

    # ... lógica ...
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

#### PowerShell (preferido para wrappers + filesystem Windows)

`scripts/<nome>.ps1`:

```powershell
# scripts/<nome>.ps1
# Plugin P8-MASTER — [descrição]

param(
    [string]$Arg1 = "default"
)

$ErrorActionPreference = "Stop"

# Find raiz P8
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    Write-Host "[<nome>] ERRO: nao estamos em P8-FigurinhasPro" -ForegroundColor Red
    exit 1
}

# ... lógica ...
exit 0
```

### Testes

Para scripts Python: criar `tests/unit/test_<nome>.py` com pytest:

```python
"""Testa scripts/<nome>.py"""

import sys
import subprocess
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "<nome>.py"


def run_script(*args):
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def test_script_exists():
    assert SCRIPT.exists()


def test_help_works():
    rc, out, err = run_script("--help")
    assert rc == 0


def test_happy_path(tmp_path):
    rc, out, err = run_script("--arg1", "valor")
    assert rc == 0
    assert "esperado" in out
```

Para PowerShell scripts, adicionar a `tests/integration/test_<nome>.ps1`.

---

## Adicionar um hook

### Hooks suportados (Claude Code)

- `SessionStart` — antes da primeira mensagem
- `UserPromptSubmit` — quando user envia prompt
- `PreToolUse` (matcher: Bash, Read, Edit, Write, Skill, etc.) — antes de tool
- `PostToolUse` — depois de tool
- `Stop` — fim da sessão

### Estrutura `hooks/<nome>.ps1`

```powershell
# hooks/<nome>.ps1
# Plugin P8-MASTER — hook [evento].
# Responsabilidade: [descrição em 1-2 linhas]
# Exit codes: 0 (continua), 2 (bloqueia tool call).

$ErrorActionPreference = "SilentlyContinue"

$inputJson = $input | Out-String
if (-not $inputJson) { exit 0 }

try {
    $hookData = $inputJson | ConvertFrom-Json
} catch {
    exit 0
}

# ... lógica ...

exit 0
```

### Adicionar a settings.json

`P8-FigurinhasPro/.claude/settings.json`:

```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -NoProfile -ExecutionPolicy Bypass -File .claude/plugins/p8-master/hooks/<nome>.ps1"
          }
        ]
      }
    ]
  }
}
```

### Performance

Hooks rodam **toda vez** que o evento dispara. Mantenha:
- Síncrono < 100ms
- Trabalho pesado em background (`Start-Process -NoNewWindow`)
- Sem chamadas WebFetch/Bash síncronas

---

## Adicionar uma reference

References são docs leves que skills consultam sob demanda (não são carregadas no system prompt default).

### Estrutura `references/<nome>.md`

```markdown
# <Título> — referência P8-FigurinhasPro

> [1-2 frases sobre o que cobre. Quando consultar.]

---

## Visão geral

[Conteúdo principal]

---

## Tabela de referência

| Coluna 1 | Coluna 2 | Coluna 3 |
|---|---|---|
| ... | ... | ... |

---

## Exemplos práticos

[Code snippets, comandos]

---

## Ver também

- [skill relacionada](../skills/.../SKILL.md)
- [scripts/<script-relacionado>](../scripts/...)
- [P8-FigurinhasPro/<arquivo>](../../../<arquivo>)
```

### Critério

Reference vale a pena se:
- ≥2 skills consultam o mesmo conteúdo
- Conteúdo é estável (muda raramente)
- Cabe em <300 linhas

Senão, manter inline na skill.

### Atualizar test_skill_orchestrator

Adicionar a `tests/integration/test_skill_orchestrator.ps1` Teste 7 (references + state).

---

## Adicionar um template

Templates moram em `templates/` e são copiados quando usuário gera artefato novo.

### Estrutura

`templates/<nome>.md`:

```markdown
---
data: <YYYY-MM-DD>
tipo: <tipo>
topico: <slug>
autor: <user>
projeto: P8-FigurinhasPro
relacionados: []
status: rascunho
---

# <Título>

[Esqueleto de seções com placeholders {{slug}}, {{date}}, etc.]
```

### Uso

Skills (ex: `pesquisa`, `plano`) leem templates e substituem placeholders ao gerar artefato.

---

## Versionamento (semver)

| Tipo de mudança | Bump |
|---|---|
| Edit em description / docs / SKILL.md body | patch (0.X.**Y+1**) |
| Skill nova OU agent novo OU script novo | minor (0.**X+1**.0) |
| Breaking change na interface dos slash commands | major (**X+1**.0.0) |

CHANGELOG.md sempre acompanha bump.

---

## Antes de PR

Checklist:

- [ ] `tests/run-all.ps1` retorna TUDO PASSOU
- [ ] `python scripts/validate-frontmatter.py -r skills/` retorna OK
- [ ] `python scripts/validate-frontmatter.py -r agents/` retorna OK
- [ ] CHANGELOG.md atualizado com entry
- [ ] plugin.json bumpado
- [ ] README.md atualizado se contagem de skills/agents mudou
- [ ] Mensagem de commit imperativa, descreve intent

---

## Anti-padrões a evitar

- ❌ Skill que duplica outra (sem justificativa em pesquisa)
- ❌ Skill com description curta sem trigger words
- ❌ Skill que modifica código sem gate humano
- ❌ Hook que demora >100ms síncrono
- ❌ Script Python sem fix UTF-8 stdout (Windows)
- ❌ Bump versão sem mudança real (patch fantasma)
- ❌ Test integration sem caso edge (só happy path)
- ❌ Description "Faz X" sem mencionar trigger / contexto P8

---

## Ver também

- [ARCHITECTURE.md](ARCHITECTURE.md) — decisões estruturais
- [ACTIVATION.md](ACTIVATION.md) — como ativa
- [SELF_IMPROVEMENT.md](SELF_IMPROVEMENT.md) — auto-melhoria
- [DAILY_UPDATE.md](DAILY_UPDATE.md) — currentDate
- [planeje-um-plugin-cosmic-sedgewick.md](C:\Users\conta\.claude\plans\planeje-um-plugin-cosmic-sedgewick.md) — plano original
