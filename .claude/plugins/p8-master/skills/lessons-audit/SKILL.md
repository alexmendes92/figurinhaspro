---
name: p8-master:lessons-audit
description: Auto-ativa quando o usuário pedir auditoria de sessões, "extrair padrões", "lições de uso", ou "auto-melhoria" do plugin em P8-FigurinhasPro. Audita últimas N sessões em `~/.claude/projects/`, classifica padrões em 4 categorias (erro recorrente, sequência repetida, skill lenta, skill mal-acionada), e propõe diffs em `thoughts/auto-melhoria/` SEM aplicar.
argument-hint: "[--days N, default 15]"
---

Vou auditar sessões recentes do projeto P8-FigurinhasPro: $ARGUMENTS

**Não aplico mudanças automaticamente.** Apenas detecto padrões e proponho diffs em `thoughts/auto-melhoria/<data>-<topico>.md`. Humano aprova individualmente via `/p8-master:revisar-melhorias` (futuro).

## Sequência

1. **Definir janela:** default 15 dias (override via `--days N`).

2. **Coletar transcripts** das sessões P8:
   - Pasta: `~/.claude/projects/<hash-P8>/*.jsonl`
   - Cache append-only: `state/sessions/*.jsonl` (gravado pelo hook `Stop`)
   - Filtra por currentDate - days

3. **Spawn `extrator` (Haiku)** com [scripts/lessons-extract.py](../../scripts/lessons-extract.py):
   ```bash
   python .claude/plugins/p8-master/scripts/lessons-extract.py \
     --project P8-FigurinhasPro \
     --days <N> \
     --output state/aggregates/<data>-audit.json
   ```

4. **Spawn `extrator` (Haiku) novamente** com [scripts/detect-repeat-tools.py](../../scripts/detect-repeat-tools.py):
   ```bash
   python .claude/plugins/p8-master/scripts/detect-repeat-tools.py \
     --project P8-FigurinhasPro \
     --days <N> \
     --threshold-occurrences 5 \
     --threshold-sessions 3
   ```

5. **Classificar achados em 4 categorias:**

   ### a) Erro recorrente (≥3 ocorrências em ≥2 sessões)
   - Mesmo erro de tool / mesma exception / mesmo gate vermelho.
   - Proposta: bullet em CLAUDE.md/AGENTS.md/SKILL.md com contexto.

   ### b) Sequência repetida (≥5 ocorrências em ≥3 sessões, janela 30d)
   - Mesma tripla/quartupla de tool calls em sessões distintas.
   - Proposta: novo script em `scripts/auto-generated/<slug>.ps1` ou skill nova.

   ### c) Skill lenta (tempo médio > 2x mediana global do plugin)
   - Skill X demora consistentemente mais que outras.
   - Proposta: `skill-creator` otimiza descrição (frontmatter mais conciso, remove exemplos longos, melhor prompt-cache).

   ### d) Skill mal-acionada (resultado descartado >40% das vezes)
   - User pede X, plugin invoca skill Y, user descarta + pede de novo.
   - Proposta: refinar trigger words em `description` da skill Y.

6. **Filtrar via `state/rejections.jsonl`:**
   - Propostas já rejeitadas anteriormente NÃO são re-propostas (evita ruído recorrente).

7. **Excluir sessões com flag `selfAudit=true`:**
   - Sessões que rodaram `/p8-master:lessons-audit` ou cron de auto-melhoria são marcadas e EXCLUÍDAS da própria auditoria (evita loop).

8. **Gerar relatório consolidado** em `thoughts/auto-melhoria/<YYYY-MM-DD>-audit.md`:

```yaml
---
data: <YYYY-MM-DD>
tipo: auto-melhoria
topico: audit-sessions-<N>d
autor: <user>
projeto: P8-FigurinhasPro
status: rascunho
---
```

Conteúdo:
- **Sumário** — N sessões analisadas, M padrões detectados, K propostas geradas
- **Categoria A — Erros recorrentes** — lista numerada com evidência (linhas JSONL) + diff sugerido
- **Categoria B — Sequências repetidas** — lista numerada com sample, contagem, diff de script novo
- **Categoria C — Skills lentas** — tabela skill | tempo médio | mediana global | sugestão
- **Categoria D — Skills mal-acionadas** — tabela skill | taxa descarte | trigger words sugeridas
- **Próximo passo:** rodar `/p8-master:revisar-melhorias` (Fase 6, futuro)

9. **Mostrar caminho** + sumário (X propostas geradas).

10. **NÃO aplico nada.** Aprovação humana é individual, via comando separado.

## Padrões P8-MASTER já conhecidos (alimenta filtro)

Da implementação atual:
- Script falha em Windows com `cp1252` em chars unicode → fix conhecido (`io.TextIOWrapper(encoding="utf-8")`)
- Agents Oracle usam `disallowedTools` em vez de `tools` → schema `validate-frontmatter.py` já tolera
- Pre-commit hook bloqueia gate vermelho → comportamento esperado, não é erro

## Modelo recomendado

- **Main session: Sonnet** — análise estatística + classificação por threshold é determinístico.
- **Sub-agents:** `extrator` (Haiku) roda os scripts; síntese pode subir pra Opus se houver muito material qualitativo.

## Restrições

- **Não aplico mudanças automáticas.** Sempre propõe em rascunho.
- **Não re-propõe rejeições.** `state/rejections.jsonl` filtra.
- **Não audita sessões `selfAudit=true`** — evita loop infinito.
- **Não vaza secrets.** Transcripts JSONL têm prompts/outputs — relatório agregado **não cita** content que pareça API key, password, token.
- **Threshold conservador:** 5×3 sequências, 3×2 erros — false-positive é pior que false-negative.

## Ver também

- [scripts/lessons-extract.py](../../scripts/lessons-extract.py)
- [scripts/detect-repeat-tools.py](../../scripts/detect-repeat-tools.py)
- [skills/skill-creator/SKILL.md](../skill-creator/SKILL.md) — quem aplica diffs aprovados
- `state/sessions/`, `state/aggregates/`, `state/rejections.jsonl` — dados do plugin
