---
name: p8-master:oracle-reportar
description: Auto-ativa quando o usuário pedir consolidação dos relatórios Oracle já existentes em `output/` de P8-FigurinhasPro, sem re-rodar análise pesada. Lê `output/01..06.md`, gera `output/00-README.md` (índice) + `output/99-oracle-master.md` (narrativa consolidada com contradições entre fases identificadas).
argument-hint: ""
---

Vou consolidar relatórios Oracle existentes em [P8-FigurinhasPro/output/](../../../../output/).

**Pré-requisito:** pelo menos 1 dos 6 relatórios-base deve existir em `output/`. Sem nenhum, sugiro `/p8-master:oracle-analise` antes.

## Sequência

1. **Inventariar `output/`** via [scripts/load-prior-reports.py](../../scripts/load-prior-reports.py):
   ```bash
   python .claude/plugins/p8-master/scripts/load-prior-reports.py output/
   ```

   JSON retorna:
   - `total_relatorios`, `fases_completas`, `fases_parciais`, `fases_com_placeholder_pendente`
   - lista de `relatorios` com frontmatter parseado + primeira_secao

2. **Decisão baseada no estado:**
   - **6/6 fases completas:** consolidação cheia → `oracle-master.md` rico.
   - **<6 fases:** pergunto: "Faltam <N> fases. Consolidar parcialmente, ou rodar fases faltantes via `/p8-master:oracle-analise`?"
   - **Alguma fase com placeholder pendente** (`_A preencher`): aviso, sugiro completar antes via `/p8-master:itera`.

3. **Spawn `arquiteto-estrategico` (Opus)** com contexto:
   - prior-reports.json (estruturado)
   - currentDate da sessão
   - lista de fases existentes + parciais

   Arquiteto identifica:
   - Contradições entre fases (ex: estrutura propõe X, designer propõe Y incompatível)
   - Pontos de alavancagem (20% esforço → 80% valor)
   - Gaps críticos vs altos vs médios
   - Roteiro consolidado de 30/60/90 dias

4. **Gera `output/99-oracle-master.md`** com narrativa única:

```yaml
---
fase: oracle-master
gerado-em: <ISO 8601>
versao: <N>
projeto-alvo: P8-FigurinhasPro
agents-usados: [arquiteto-estrategico, qa-estrutural, extrator]
fases-base: ["01-estrategia-geral", "02-marketing", ...]
status: completo
sumario: "..."
gaps-criticos: <N>
contradicoes-detectadas: <N>
prox-fase: null
---
```

5. **Gera `output/00-README.md`** (índice executivo):
   - Sumário em 3-5 frases (CEO leria em 30s)
   - Lista de 6 fases com link + status
   - Top 3 gaps críticos (clicáveis)
   - Top 3 ações recomendadas (próximos 30 dias)

6. **Spawn `qa-estrutural`** (Haiku) para validar 99-oracle-master.md + 00-README.md via `validate-frontmatter.py`.

7. **Mostro caminhos** dos 2 arquivos gerados + sumário do consolidado.

8. **DECISION POINT — promover achados pra `/p8-master:plano`?** Lista de candidatos:
   - "Plano #1: Restaurar plan-limits.ts" (se aparece em gaps críticos)
   - "Plano #2: Adicionar idempotência Stripe webhook" (se aparece)
   - "Plano #3: Ativar Sentry em prod" (se aparece)

   Humano escolhe o que vai virar `/p8-master:plano` no próximo passo.

## Detecção de contradições

Arquiteto analisa pares de fases:

| Par | Tipo de contradição |
|---|---|
| 01 (geral) vs 03 (estrutura) | "geral diz que produto é A, estrutura assume produto é B" |
| 02 (marketing) vs 04 (designer) | "marketing fala com persona X, designer otimiza pra persona Y" |
| 03 (estrutura) vs 05 (prototipo) | "estrutura propõe módulo Z, prototipo ignora Z" |
| 06 (criacao) vs 01 (geral) | "código do protótipo contradiz funcionalidades listadas em 01" |

Contradições viram seção `## Contradições detectadas` no master, classificadas como Críticas / Altas / Médias.

## Restrições

- **Não re-rodo análise pesada.** Se quiser re-rodar, é `/p8-master:oracle-analise`.
- **Não modifico output/01..06.md.** Apenas leio + sintetizo.
- **Não invento contradição.** Apenas reporto onde dados convergem ou divergem.
- **Não pulo qa-estrutural.** 99-oracle-master.md DEVE ser validado antes de declarar feito.

## Modelo recomendado

- **Main session: Opus** — síntese cross-fase é cognitivo de alta complexidade.
- **Sub-agents:** arquiteto-estrategico (Opus), qa-estrutural (Haiku).

## Custo

Leve em comparação com `/p8-master:oracle-analise`: ~5-15k tokens vs 50-150k.

## Ver também

- [skills/oracle-analise/SKILL.md](../oracle-analise/SKILL.md) — pra rodar análise completa
- [agents/arquiteto-estrategico.md](../../agents/arquiteto-estrategico.md), [agents/qa-estrutural.md](../../agents/qa-estrutural.md)
- [scripts/load-prior-reports.py](../../scripts/load-prior-reports.py), [scripts/validate-frontmatter.py](../../scripts/validate-frontmatter.py)
- [P8-FigurinhasPro/output/](../../../../output/) — origem dos relatórios
