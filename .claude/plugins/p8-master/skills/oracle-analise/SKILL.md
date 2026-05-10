---
name: p8-master:oracle-analise
description: Auto-ativa quando o usuário pedir análise estratégica completa, "rodar Oracle", "estratégia de produto", ou "análise das 6 fases" em P8-FigurinhasPro. Roda a sequência Oracle (estrategia-geral → marketing → estrutura → designer → definicao-prototipo → criacao-prototipo → oracle-master) gerando `output/01..06.md` + `99-master.md`. **Heavyweight** — consome dezenas de milhares de tokens; sempre confirma antes de rodar.
argument-hint: "[fase específica opcional, default: todas]"
---

Vou rodar análise estratégica Oracle em P8-FigurinhasPro.

**ATENÇÃO**: pipeline Oracle é heavyweight (1-3 horas, 6 sub-agents bundled em paralelo). Antes de rodar:

1. **Pré-check de baseline.** Verifico em `P8-FigurinhasPro/output/`:
   - Existe `output/01..06.md` recente (<30 dias)?
   - Existe `output/99-oracle-master.md` consolidado?

2. **Decisão baseada no estado:**
   - **SIM, recente:** pergunto: "Já há análise Oracle <X dias atrás>. Rodar do zero, retomar incremental, ou só consolidar via `/p8-master:oracle-reportar`?"
   - **SIM, mas desatualizado** (>30 dias OU >20% mudança no código via `git diff --stat`): proponho re-rodar.
   - **NÃO existe:** sigo direto pra Step 1.

3. **DECISION POINT** — humano confirma escopo antes de prosseguir.

## Pipeline (7 fases, gates humanos em fases 5+)

```
[Fase 0] extrator roda inventory.py + grep-evidence.py em P8 (Step 0 — sem custo de tokens grande)
   ↓
[Fase 1] estrategia-geral (20 passos)
   - extrator: dados factuais
   - analista-gerador: 4 sub-seções (código/funcionalidades/dores/comercial) em paralelo
   - pesquisador: passo 5 (mercado), 16 (novas features) — busca atualizada via WebSearch
   - critico-adversarial: passo 12 (paralaxe), 14 (críticas)
   - arquiteto-estrategico: passos 17-19 (sistema ideal + gaps + roteiro)
   - qa-estrutural: passo 20 (validação)
   → output/01-estrategia-geral.md
   ↓
[Fase 2] estrategia-marketing
   - lê output/01 via load-prior-reports.py
   - pesquisador: mercado/concorrentes
   - analista-gerador: plano marketing
   - qa-estrutural: validação
   → output/02-marketing.md
   ↓
[Fase 3] estrategia-estrutura
   - lê 01+02
   - arquiteto-estrategico: 7 boundaries lógicos, 4 fases refactor
   - qa-estrutural: validação
   → output/03-estrutura.md
   ↓
[Fase 4] estrategia-designer
   - lê 01+02+03
   - pesquisador: best practices design 2026
   - analista-gerador: 5 design options + 3 hipóteses UX
   - qa-estrutural: validação
   → output/04-designer.md
   ↓
[Fase 5] definicao-prototipo
   - lê 01+02+03+04
   - arquiteto-estrategico: escolhe 1 candidato, define escopo, critérios sucesso
   - qa-estrutural: validação
   → output/05-prototipo-definicao.md
   ↓
*** GATE HUMANO: aprovação antes da fase 6 (criar código de protótipo) ***
   ↓
[Fase 6] criacao-prototipo
   - implementa protótipo em pasta isolada (NÃO modifica src/ principal)
   - usa SMA dentro: pesquisa → plano → implementa
   - qa-estrutural: validação
   → output/06-prototipo-criacao.md + código em prototype/
   ↓
[Fase 7] oracle-master (consolidação)
   - arquiteto-estrategico: lê output/01..06.md, identifica contradições
   - gera output/00-README.md (índice executivo) + output/99-oracle-master.md (narrativa única)
   - qa-estrutural: validação final
   ↓
*** GATE HUMANO: promover achados pra `/p8-master:plano` ***
```

## Sub-agents bundled

Os 6 agents Oracle vivem em [agents/](../../agents/) do plugin:

| Agent | Modelo | Função |
|---|---|---|
| `extrator` | Haiku | inventário rápido via scripts/inventory.py + grep-evidence.py |
| `analista-gerador` | Sonnet | redação narrativa em PT-BR a partir de dados |
| `pesquisador` | Sonnet | busca atualizada via WebSearch/WebFetch |
| `critico-adversarial` | Opus | fricção máxima, paralaxe cognitiva |
| `arquiteto-estrategico` | Opus | síntese cross-fase, sistema ideal, gaps |
| `qa-estrutural` | Haiku | valida frontmatter + seções H2 obrigatórias via validate-frontmatter.py |

## Scripts bundled

- `scripts/inventory.py` — inventário rápido do codebase (Fase 0)
- `scripts/grep-evidence.py` — contagem + samples sobre padrão regex (extrator)
- `scripts/load-prior-reports.py` — carrega output/01..06.md (fases 2+)
- `scripts/validate-frontmatter.py` — qa estrutural por fase

## Output em P8

Já existem outputs em [P8-FigurinhasPro/output/](../../../../output/):
- `00-README.md`, `06-prototipo-criacao.md`, `99-oracle-master.md`, `auto-melhoria-2026-05-10.md`

Re-rodar OVERWRITE — se quiser preservar histórico, faço backup pra `output/.archive/<data>/`.

## Modelo recomendado

- **Main session: Opus** — orquestração de 6 agents em 7 fases é cognitivo cross-cutting.
- **Sub-agents** rodam em modelos próprios (Haiku/Sonnet/Opus por frontmatter).
- **Custo estimado**: 50k-150k tokens dependendo do tamanho do projeto.

## Restrições

- **Não rodo sem confirmação humana** se já há output recente — economia de tokens.
- **Não pulo gate humano** entre Fase 5 e 6 (Fase 6 escreve código de protótipo).
- **Não modifico src/ principal** — protótipo vai em pasta isolada (`prototype/<nome>/`) ou branch isolada.
- **Não promovo achados pra `/p8-master:plano` automaticamente** — gate humano após Fase 7.

## Quando NÃO usar Oracle completo

- Tarefa pontual (1 feature, bug fix, refactor): use `/p8-master:pesquisa` + `/p8-master:plano` direto.
- Já tem `output/99-oracle-master.md` recente: use `/p8-master:oracle-reportar` para re-consolidar sem re-analisar.
- Onboarding de novo dev: use `/p8-master:p8-snapshot` (Fase 5 do build) — mais leve.

## Ver também

- [skills/oracle-reportar/SKILL.md](../oracle-reportar/SKILL.md) — só consolidação, sem re-rodar análise
- [agents/](../../agents/) — 6 agents Oracle (extrator, analista-gerador, pesquisador, critico-adversarial, arquiteto-estrategico, qa-estrutural)
- [scripts/inventory.py](../../scripts/inventory.py), [grep-evidence.py](../../scripts/grep-evidence.py), [load-prior-reports.py](../../scripts/load-prior-reports.py), [validate-frontmatter.py](../../scripts/validate-frontmatter.py)
- [P8-FigurinhasPro/output/](../../../../output/) — outputs Oracle existentes
