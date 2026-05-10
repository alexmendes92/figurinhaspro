# Auto-melhoria do plugin P8-MASTER

> Loop fechado: plugin observa próprio uso, propõe melhorias, humano aprova, plugin se atualiza. Tudo em PT-BR, sempre com gate humano antes de editar SKILL.md.

---

## Visão geral do loop

```
[Sessão N] hook Stop append em state/sessions/<data>.jsonl
   ↓
[Trigger] cron sexta 18h | ≥10 sessões novas | /p8-master:lessons-audit manual
   ↓
[Análise] lessons-extract.py + detect-repeat-tools.py rodam em últimas 15 sessões
   ↓
[Classificação] 4 categorias de padrão:
   a) Erros recorrentes (≥3x em ≥2 sessões)
   b) Sequências repetidas (≥5x em ≥3 sessões)
   c) Skills lentas (tempo médio > 2x mediana)
   d) Skills mal-acionadas (resultado descartado >40%)
   ↓
[Propostas] thoughts/auto-melhoria/<data>-audit.md (status: rascunho)
   ↓
[Filtro] state/rejections.jsonl exclui propostas já rejeitadas
   ↓
[Gate humano] /p8-master:revisar-melhorias lista propostas pendentes
   ↓
[Aplicação] /p8-master:skill-creator apply-proposal <path>
   - Edit em SKILL.md / CLAUDE.md / AGENTS.md / scripts/
   - Bumpa plugin.json semver
   - Atualiza CHANGELOG.md
   - Roda tests/run-all.ps1 (valida que nada quebrou)
   - Move proposta pra _aplicadas/
[Sessão N+1] inicia com plugin atualizado
```

---

## Categorias de padrão (detalhe)

### A) Erros recorrentes

**Detecção:** `lessons-extract.py`
- Lê `state/sessions/*.jsonl`
- Filtra por janela (default 15 dias)
- Extrai eventos com `tool_result is_error: true`
- Normaliza signature (primeiros 160 chars do error message)
- Conta ocorrências cross-sessão
- Threshold: ≥3 ocorrências em ≥2 sessões distintas

**Exemplo de detecção:**
```
Padrão: "BLOQUEADO: git push --force nao e permitido em P8"
Ocorrências: 5
Sessões: 3
Sample: state/sessions/2026-05-08.jsonl, line 47
```

**Proposta gerada:**
- Adicionar bullet em `~/.claude/CLAUDE.md` (global): "Use `git push --force-with-lease` em vez de `--force`"
- OU adicionar em `references/windows-quirks.md`: "P8-MASTER bloqueia `--force` por hook"

### B) Sequências repetidas

**Detecção:** `detect-repeat-tools.py`
- Extrai n-gramas (3-7 tool_calls consecutivos) por sessão
- Normaliza paths (substitui `/worktrees/<hash>/` por `<wt>/`)
- Agrupa cross-sessão por hash da sequência
- Threshold: ≥5 ocorrências em ≥3 sessões distintas, em janela 30 dias
- Filtra sequências com tempo médio < 30s (não vale automatizar)

**Exemplo de detecção:**
```
Sequência:
  1. Bash:stripe trigger checkout.session.completed
  2. Bash:stripe logs tail
  3. Read:.ts (src/app/api/stripe/webhook/route.ts)
Ocorrências: 7
Sessões: 4
Tempo médio: 45s
```

**Proposta gerada:**
- Criar `scripts/auto-generated/stripe-webhook-smoke.ps1` que encadeia os 3 comandos + parse output
- Documentar uso em `references/stripe-flows.md`

### C) Skills lentas

**Detecção:** `lessons-extract.py` (categoria C — placeholder na v0.5.0, implementar quando state tracker durações)

**Critério:** tempo médio da skill > 2x mediana global do plugin.

**Exemplo:**
```
Skill: p8-master:oracle-analise
Tempo médio: 95s
Mediana global: 12s
Ratio: 7.9x (> 2x threshold)
```

**Proposta gerada:**
- Otimizar description (remove exemplos longos, encolhe pra <500 tokens)
- Re-organizar body em layers (essential primeiro, exemplos no fim)

### D) Skills mal-acionadas

**Detecção:** `lessons-extract.py` (categoria D — placeholder na v0.5.0, implementar quando state tracker resultado descartado)

**Critério:** Skill X invocada → user descarta resultado e refaz pedido em <2 turnos. ≥40% das vezes.

**Exemplo:**
```
Skill: p8-master:p8-stripe-sync
Invocações: 10
Resultados descartados: 6 (60%)
Re-pedido típico: "queria validar webhook signature, não trigger evento"
```

**Proposta gerada:**
- Refinar `description` adicionando trigger words da reformulação ("validar signature")
- OU criar nova skill `/p8-master:p8-stripe-validate` mais específica

---

## Ciclo de aprovação humana

### `/p8-master:revisar-melhorias` (skill futura, Fase 6+)

Lista propostas pendentes em `thoughts/auto-melhoria/`:

```
Propostas pendentes (3):

1. [Categoria A] thoughts/auto-melhoria/2026-05-08-audit.md
   Padrão: "BLOQUEADO git push --force" repete 5x em 3 sessões
   Diff sugerido: bullet em references/windows-quirks.md
   [aprovar / rejeitar / postpone]

2. [Categoria B] thoughts/auto-melhoria/2026-05-08-audit.md
   Padrão: stripe trigger + logs tail + Read webhook (5 sessões)
   Diff sugerido: scripts/auto-generated/stripe-webhook-smoke.ps1
   [aprovar / rejeitar / postpone]

3. [Categoria A] thoughts/auto-melhoria/2026-05-09-audit.md
   ...
```

User responde por número:
- `1 aprovar` → skill-creator apply-proposal
- `2 rejeitar "duplica skill p8-stripe-sync"` → grava em rejections.jsonl
- `3 postpone` → fica em rascunho mais 30 dias

### `/p8-master:skill-creator apply-proposal <path>`

Aplica proposta aprovada:

1. Lê `thoughts/auto-melhoria/<arquivo>.md`
2. Confere status (rascunho ou aprovado)
3. Aplica diffs descritos:
   - Categoria A: edit em CLAUDE.md/AGENTS.md/SKILL.md
   - Categoria B: cria `scripts/auto-generated/<slug>.ps1`
   - Categoria C: refina description (encolhe + remove exemplos)
   - Categoria D: refina trigger words em description
4. Bumpa `plugin.json`:
   - patch (X.Y.**Z**) — edit em docs/SKILL.md
   - minor (X.**Y**.0) — script novo, skill nova, agent novo
5. Atualiza `CHANGELOG.md` com entry `[auto-melhoria]`
6. Move proposta `thoughts/auto-melhoria/<arquivo>.md` → `thoughts/auto-melhoria/_aplicadas/<arquivo>.md`
7. Roda `tests/run-all.ps1` pra confirmar que nada quebrou
8. Sugere commit:
   ```
   git commit -m "feat(p8-master): aplicar proposta auto-melhoria <slug>

   Origem: thoughts/auto-melhoria/_aplicadas/<arquivo>.md
   Categoria: <A|B|C|D>
   Bump: 0.X.Y -> 0.X.Y+1

   Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
   ```

---

## Anti-loops

### 1. Sessões self-audit excluídas

Sessões cuja invocação foi `/p8-master:lessons-audit` ou que mencionam `auto-melhoria` no prompt são **marcadas com `selfAudit=true`** e excluídas da próxima auditoria.

Sem isso, plugin entraria em loop:
- Sessão A roda lessons-audit
- Sessão B roda lessons-audit, detecta sessão A como "padrão repetitivo"
- Sessão C detecta A+B como ainda mais repetitivo
- ...

### 2. Rejeições registradas

`state/rejections.jsonl` armazena propostas rejeitadas:
```json
{"timestamp": "2026-05-09T...", "proposal_id": "audit-2026-05-08-padrao-X", "reason": "duplica skill existente"}
```

Próxima auditoria filtra: padrões cujo `proposal_id` está em rejections **não viram nova proposta** (mesmo se threshold aumentou).

### 3. Threshold conservador

- Erros: 3×2 (3 ocorrências em 2 sessões)
- Sequências: 5×3 + tempo médio ≥30s
- Skills lentas: tempo > 2x mediana
- Mal-acionadas: descarte > 40%

Conservador previne false-positives (proposta gerada por ruído estatístico). Pode ser ajustado por argumento (`--threshold-occurrences`, etc.).

### 4. Validade de propostas

Propostas em `thoughts/auto-melhoria/` com `status: rascunho` por mais de 30 dias são **arquivadas automaticamente** com motivo "expired" pelo próximo `lessons-audit`. Evita acumular ruído indefinidamente.

---

## Métricas (em sessão)

Cada `lessons-audit` reporta:
- N sessões processadas
- N sessões skip (selfAudit)
- N propostas geradas (por categoria)
- N propostas filtradas por rejeições prévias
- Tempo total de execução

Permite rastrear:
- Saúde do loop (tem propostas?)
- Stagnação (taxa de propostas caiu? plugin estabilizou ou está cego?)
- Custo (tokens consumidos por audit)

---

## Quando NÃO usar auto-melhoria

- Em sessão crítica (deploy prod, hotfix em andamento) — pode interromper.
- Antes de release importante (proposta pode mudar comportamento de skill que está em uso).
- Se rejections.jsonl tem >100 entries — sinal que detector está com falso-positivos. Pausar e refinar threshold.

---

## Scripts de fallback

Se quiser rodar análise manual:

```bash
# Detecta sequências repetidas
python .claude/plugins/p8-master/scripts/detect-repeat-tools.py \
  --transcripts-dir state/sessions/ \
  --days 15 \
  --threshold-occurrences 5 \
  --threshold-sessions 3

# Extrai padrões de erro
python .claude/plugins/p8-master/scripts/lessons-extract.py \
  --transcripts-dir state/sessions/ \
  --days 15 \
  --exclude-self-audit \
  --output state/aggregates/manual-audit.json
```

Output JSON pode ser inspecionado e usado como input pra skill-creator manualmente.

---

## Ver também

- [ARCHITECTURE.md](ARCHITECTURE.md) — decisões de design
- [skills/lessons-audit/SKILL.md](../skills/lessons-audit/SKILL.md)
- [skills/skill-creator/SKILL.md](../skills/skill-creator/SKILL.md)
- [scripts/lessons-extract.py](../scripts/lessons-extract.py)
- [scripts/detect-repeat-tools.py](../scripts/detect-repeat-tools.py)
