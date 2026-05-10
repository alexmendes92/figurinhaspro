# Workflow SMA (System Master ACE) — referência condensada

> SMA = fusão de Akita (5 disciplinas XP) + ACE (Research → Plan → Implement). É a metodologia base do plugin P8-MASTER.

---

## Pipeline canônico

```
PESQUISA → PLANO → VALIDA → IMPLEMENTA → ITERA (se necessário) → COMMIT → HANDOFF → HURDLE (se aprendizado novo)
              ↑
         GATE HUMANO obrigatório (status: rascunho → ativo)
```

---

## As 9 skills SMA (com namespace P8-MASTER)

| Skill | Quando | Output |
|---|---|---|
| `/p8-master:pesquisa <topico>` | ANTES de planejar mudança | `thoughts/pesquisas/YYYY-MM-DD-<slug>.md` |
| `/p8-master:plano <descricao>` | DEPOIS de pesquisa, ANTES de codar | `thoughts/planos/...` (status: rascunho) |
| `/p8-master:valida <path>` | ANTES de aprovar plano | diff inline + checklist |
| `/p8-master:implementa <path>` | Plano com `status: ativo` | commits + checkboxes atualizados |
| `/p8-master:itera <path>` | Descoberta nova durante implementação | plano refinado + histórico |
| `/p8-master:commit` | Mudança pronta para commitar | `git commit` (mensagem imperativa) |
| `/p8-master:pr` | Branch pronto pra PR | título + body |
| `/p8-master:handoff` | Fim de sessão / pausa | `thoughts/handoffs/...` |
| `/p8-master:hurdle <descoberta>` | Aprendizado novo | proposta de bullet pra CLAUDE.md/AGENTS.md |

---

## Princípios

### Regra-mãe

**Humano decide o QUÊ. Agente decide o COMO.**

- Arquitetura, escopo, prioridades, trade-offs, escolha de bibliotecas, decisão de release → humano.
- Implementação linha-a-linha → agente.

### Pesquisa antes de plano

- `/p8-master:plano` aborta se não houver `thoughts/pesquisas/` relevante.
- Pesquisa documenta o que existe; não propõe mudança.
- Plano sem pesquisa é cego.

### Plano espera aprovação

- `status: rascunho` é a saída de `/p8-master:plano`.
- Aprovação humana muda pra `status: ativo`.
- `/p8-master:implementa` checa `status: ativo` antes de rodar.

### TDD não-negociável

- Toda mudança de comportamento começa por teste vermelho (RED).
- Implementa o mínimo (GREEN).
- Refatora em micro-passos (REFACTOR — <50 linhas, <2 arquivos).

### Gate de pre-commit

Em P8: `npm run test` → `npx tsc --noEmit` → `npm run build`. Hook `precommit-router.sh` em [.claude/hooks/](../../../.claude/hooks/) executa automaticamente. Vermelho bloqueia.

### Compactação intencional

- Cada artefato em `thoughts/` substitui contexto de sessão.
- Sessões longas usam `/compact` (built-in) entre fases.
- Não acumulo contexto desnecessário.

---

## Frontmatter padrão de artefatos thoughts/

```yaml
---
data: <YYYY-MM-DD>
tipo: pesquisa | plano | valida | revisao | decisao | handoff | auto-melhoria | atualizacao
topico: <slug>
autor: <user email>
projeto: P8-FigurinhasPro
relacionados: [pesquisas/<arquivo>.md, planos/<arquivo>.md]
status: rascunho | ativo | arquivado
sha: <git SHA>
branch: <branch>
iteracoes: 0
---
```

Status fluem:
- `rascunho` — recém criado, aguarda revisão/aprovação.
- `ativo` — aprovado, em uso.
- `arquivado` — superado por outro artefato (cita `relacionados`).

---

## Como o pipeline gira numa feature típica

```
14:00 user: /p8-master implementar email Resend após Stripe paid
14:00 plugin: detecta cenário "feature nova"
14:00 plugin: verifica thoughts/pesquisas/ (vazio relevante)
14:00 plugin: dispara /p8-master:pesquisa "email Resend Stripe webhook"
14:01 plugin: spawn 3 sub-agents paralelos (explorador 2x + historiador)
14:02 plugin: thoughts/pesquisas/2026-05-10-email-resend.md gerado
14:02 plugin: dispara /p8-master:plano automaticamente
14:03 plugin: thoughts/planos/2026-05-10-email-resend.md (status: rascunho)
14:03 plugin: PERGUNTA — aprovar plano? [s/n/itera]
14:03 user: s
14:03 plugin: status → ativo
14:03 plugin: /p8-master:valida (auto) → 0 placeholders
14:04 plugin: /p8-master:implementa fase 1 (TDD RED → GREEN → REFACTOR)
14:05 plugin: gate pre-commit verde → /p8-master:commit
14:05 plugin: continua fases 2-5
14:18 plugin: build verde, push origin
14:18 plugin: PERGUNTA — deploy prod? [s/n]
14:19 user: s
14:19 plugin: npx vercel deploy --prod
14:21 plugin: smoke test em prod, /p8-master:handoff
14:23 plugin: hook Stop → registra sessão pra lessons-audit
```

---

## Quando NÃO usar SMA

- **Tarefa trivial** (typo, rename, ajuste 1 linha): sem plano, vai direto.
- **Exploração pura** (não vai mudar código): só `/p8-master:pesquisa`, sem plano.
- **Hotfix crítico** (prod quebrada agora): `/p8-master:plano` mini de 2-3 fases, gate humano rápido, deploy emergência.

Para tudo mais que toca >1 arquivo OU >30 linhas OU regra de negócio: SMA completo.

---

## Referências de origem

- **System Master ACE** — `C:\Users\conta\Projetos\Documentação\System Master ACE\` (versão padrão do SMA, fora de P8).
- **Manual do Akita** — palestras de Fabio Akita sobre Agile Vibe Coding (2026).
- **HumanLayer / CodeLayer** — workflow Research → Plan → Implement, conceito ACE.

Plugin P8-MASTER = SMA + Akita Bootstrap + Oracle + auto-melhoria, customizado pra P8-FigurinhasPro.
