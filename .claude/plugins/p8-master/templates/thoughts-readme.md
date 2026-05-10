# thoughts/ — repositório de artefatos do P8-FigurinhasPro

> Diretório versionado pelo plugin P8-MASTER. Contém pesquisas, planos, revisões, decisões, handoffs e propostas de auto-melhoria.

## Estrutura

```
thoughts/
├── README.md (este)
├── pesquisas/        # outputs de /p8-master:pesquisa
├── planos/           # outputs de /p8-master:plano
├── valida-coisas/    # outputs intermediários de /p8-master:valida (raros)
├── revisoes/         # revisões formais de PR ou plano
├── decisoes/         # ADRs locais ao P8
├── handoffs/         # outputs de /p8-master:handoff
├── auto-melhoria/    # propostas geradas por /p8-master:lessons-audit
├── atualizacoes/     # outputs de /p8-master:stay-current
└── shared/
    ├── glossario.md          # termos do domínio P8
    ├── canonical-paths.md    # paths críticos
    └── ciclo-vida.md         # status rascunho/ativo/arquivado
```

## Naming

`YYYY-MM-DD-<topico-slug>.md` em todas as pastas.

## Frontmatter obrigatório

Todo artefato tem frontmatter YAML:

```yaml
---
data: 2026-05-10
tipo: pesquisa | plano | valida | revisao | decisao | handoff | auto-melhoria | atualizacao
topico: <slug>
autor: <email>
projeto: P8-FigurinhasPro
relacionados: [pesquisas/<arquivo>.md]
status: rascunho | ativo | arquivado
sha: <git short SHA>
branch: <branch>
---
```

## Status

- **rascunho** — recém-criado, aguarda revisão/aprovação humana.
- **ativo** — aprovado, em uso, fonte de verdade.
- **arquivado** — superado por outro artefato (que cita este como `relacionados:`).

## Fluxo

```
/p8-master:pesquisa → cria em pesquisas/ (status: ativo)
                     ↓
/p8-master:plano    → cria em planos/ (status: rascunho)
                     ↓ aprovação humana
                     → status: ativo
                     ↓
/p8-master:implementa → atualiza checkboxes do plano
                     ↓
/p8-master:handoff  → cria em handoffs/ (status: ativo)
                     ↓
/p8-master:hurdle   → propõe edit em CLAUDE.md/AGENTS.md (não em thoughts/)
```

## Comandos

- **Bootstrap inicial**: `pwsh -File .claude/plugins/p8-master/scripts/thoughts-init.ps1`
- **Pesquisar histórico**: invoque `historiador` (sub-agent do plugin) com modo LOCALIZAR ou SINTETIZAR.

## Versionamento

- `thoughts/` é versionado em git junto com o código P8.
- `.gitkeep` em pastas vazias preserva estrutura.
- `state/` (do plugin) é gitignored — cache local, não compartilhado.

---

Para detalhes, consulte [.claude/plugins/p8-master/references/workflow-sma.md](../.claude/plugins/p8-master/references/workflow-sma.md).
