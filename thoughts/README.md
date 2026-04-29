# `thoughts/` — Repositório de artefatos do workflow ACE

Diretório versionado de pesquisas, planos, revisões, decisões e handoffs da metodologia.

> Inspirado no `thoughts/` do HumanLayer/CodeLayer. Adaptado pra solo dev brasileiro: sem `humanlayer thoughts sync` (versionamento via git normal).

## Estrutura

```
thoughts/
├── pesquisas/      ← outputs de /pesquisa
├── planos/         ← outputs de /plano
├── revisoes/       ← outputs de /revisa
├── decisoes/       ← ADRs (architectural decision records)
├── handoffs/       ← outputs de /handoff
└── shared/         ← contexto compartilhado, glossários, links
```

## Convenções

### Naming

`YYYY-MM-DD-<topico-slug>.md` em todas as pastas.

- `topico-slug` em kebab-case, sem caracteres especiais
- Datas em ISO (4 dígitos, hífens)
- Exemplo: `pesquisas/2026-04-25-validacao-claudemd.md`

### Frontmatter YAML obrigatório

Todo artefato tem este bloco no topo:

```yaml
---
data: 2026-04-25
tipo: pesquisa | plano | revisao | decisao | handoff
topico: <slug>
autor: <user>
relacionados: [planos/2026-04-20-feature-X.md]
status: rascunho | ativo | arquivado
---
```

Campos:
- `data` — ISO date de criação
- `tipo` — categoria (casa com a sub-pasta)
- `topico` — slug curto
- `autor` — quem escreveu (email ou handle)
- `relacionados` — array de paths relativos a `thoughts/` (ex: `pesquisas/...`, `planos/...`)
- `status` — ciclo de vida do artefato

### Status — quando muda

- `rascunho` → recém-criado, ainda em iteração
- `ativo` → aprovado, em uso (planos vão pra `ativo` antes de `/implementa` rodar — ver `/plano` step 7)
- `arquivado` → consumido ou superado, mantido pro histórico

## Quando criar cada tipo

| Tipo | Quando |
|---|---|
| **pesquisa** | Antes de planejar mudança não-trivial. Documenta o codebase como ele é. Não propõe mudanças. |
| **plano** | Pré-requisito: pesquisa relevante existir. Detalha tarefas, fases, validação. Espera aprovação. |
| **revisao** | Antes de PR. Captura achados de revisão pra histórico. |
| **decisao** | ADR — decisão arquitetural significativa com trade-offs e alternativas consideradas. |
| **handoff** | Capturar estado da sessão pra retomar depois (você ou outro dev). |

## Como popular

Slash commands ACE escrevem aqui automaticamente:
- `/pesquisa <tópico>` → `pesquisas/`
- `/plano <tarefa>` → `planos/`
- `/revisa` → `revisoes/`
- `/handoff` → `handoffs/`

Decisões (ADRs) são escritas manualmente — não tem slash command próprio. Use template em `shared/` (futuro).

## Bootstrap

Em projeto novo: `bash scripts/thoughts-init.sh --target /caminho/projeto`. Cria a estrutura, copia este README e o glossário.

Ou via `install.sh` do System Master ACE — ele chama `thoughts-init.sh` automaticamente (passe `--skip-thoughts` pra pular).

## Versionamento

`thoughts/` é versionada com git normal junto com o código. Não usa sync externo.

Para times: considere git submodule ou subdirectory dedicado se compartilhar entre projetos. Ver Manual 6 (Equipes) — Sub-projeto 2.
