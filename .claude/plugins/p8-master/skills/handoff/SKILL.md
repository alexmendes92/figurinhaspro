---
name: p8-master:handoff
description: Auto-ativa ao final de sessão ou quando o usuário pedir pra capturar o estado da sessão em P8-FigurinhasPro pra retomar depois (ou outro dev). Gera artefato em `thoughts/handoffs/` com contexto, decisões, próximo passo e blockers.
argument-hint: <slug opcional>
disable-model-invocation: false
---

Vou capturar estado da sessão atual em `thoughts/handoffs/YYYY-MM-DD-<slug>.md`.

Slug = $ARGUMENTS (ou inferido da tarefa atual se vazio).

## Sequência

1. **Coletar estado git:**
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -5
   git diff --staged --name-only
   ```

2. **Identificar plano em andamento:** procuro em `thoughts/planos/` por arquivo com `status: ativo` mais recente. Cito como `relacionados:` no frontmatter do handoff.

3. **Listar decisões tomadas** nesta sessão (a partir do histórico de mensagens):
   - Decisões aprovadas pelo humano (gate humano).
   - Decisões automáticas do agente (justificativa).
   - Trade-offs aceitos.

4. **Identificar próximo passo concreto:**
   - Comando exato pra retomar (ex: `/p8-master:implementa thoughts/planos/<arquivo>.md fase 3`).
   - O que precisa decisão humana antes de seguir.

5. **Listar blockers/pendências:**
   - Env var que precisa ser adicionada na Vercel.
   - Migration Prisma aprovada mas não rolada.
   - Lib externa quebrada esperando fix upstream.
   - PR review pendente.

6. **Listar hurdles novos descobertos** (candidatos a `/p8-master:hurdle`):
   - Comportamento surpreendente de lib.
   - Constraint não-documentada do projeto.
   - Anti-padrão evitado.

7. **Gerar `thoughts/handoffs/YYYY-MM-DD-<slug>.md`** seguindo [templates/handoff.md](../../templates/handoff.md):

```yaml
---
data: <YYYY-MM-DD>
tipo: handoff
topico: <slug>
autor: <user email>
projeto: P8-FigurinhasPro
relacionados: [planos/<arquivo>.md]
status: ativo
sha: <git short SHA>
branch: <branch>
sessao_id: <claude session id, opcional>
---
```

8. **Mostrar caminho** do arquivo gerado.

9. **NÃO commitar** o handoff automaticamente — você decide.

## Restrições

- **Não invento decisões.** Listo só decisões que aconteceram explicitamente na sessão. "Ainda não decidimos X" vai em `## Blockers`, não em `## Decisões tomadas`.
- **Não escondo blocker.** Se há algo travado, registro — handoff existe pra próxima sessão começar lúcido.
- **Não commito o handoff automaticamente.** Salvo em `thoughts/handoffs/`, mostro caminho. Você decide se commita.
- **Não duplico contexto.** Se já existe handoff recente do mesmo tópico, atualizo (incremental) em vez de criar outro.

## Quando usar `/p8-master:handoff`

- **Fim de sessão de trabalho** (próxima sessão será sua ou outra IA/dev).
- **Antes de pausar** (tarefa em andamento, vai parar agora).
- **Antes de mudar de contexto** (vai pular pra outra feature/projeto).
- **Quando atinge limite de contexto** (sessão longa, vai precisar `/compact` ou nova sessão).
- **Antes de PR** (pra próximo dev que vai revisar entender o que foi feito).

## Quando NÃO usar

- Sessão trivial (5 turnos, tarefa fechada): `/p8-master:hurdle` se houve aprendizado, senão nada.
- Tarefa em andamento sem decisões abertas: `/compact` (built-in) basta.

## Modelo recomendado

- **Main session: Opus** — comprimir sessão longa em ~200 linhas preservando decisões sutis é trabalho cognitivo de síntese.
- **Casos triviais** (sessão <20 turnos): `/model sonnet` — handoff vira essencialmente cópia do estado git.

## Ver também

- [templates/handoff.md](../../templates/handoff.md) — template
- [skills/hurdle/SKILL.md](../hurdle/SKILL.md) — pra aprendizados isolados que cabem em CLAUDE.md
