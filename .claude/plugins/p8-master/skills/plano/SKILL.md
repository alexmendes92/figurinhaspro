---
name: p8-master:plano
description: Auto-ativa quando o usuário pedir pra planejar, desenhar ou propor mudança/feature/refactor em P8-FigurinhasPro antes de codar. Cria plano em `thoughts/planos/` baseado em pesquisa prévia, espera aprovação humana antes de virar `status: ativo`. Use SEMPRE depois de `/p8-master:pesquisa` e antes de `/p8-master:implementa`.
argument-hint: <descrição da tarefa>
---

Vou propor plano para: $ARGUMENTS

**Pré-requisito:** preciso de pesquisa relevante em `thoughts/pesquisas/`. Se não existir, vou parar e sugerir `/p8-master:pesquisa <tópico>` antes. Plano sem pesquisa é cego.

## Sequência

1. **Verificar pesquisa.** Procuro em `thoughts/pesquisas/` por artefatos relevantes ao tópico (últimos 30 dias). Sem hits, paro.

2. **Ler pesquisa(s).** Carrego artefatos como contexto. Se houver mais de 3 relevantes, leio os 2 mais recentes integralmente + síntese dos outros via `historiador`.

3. **Ler convenções P8.**
   - [P8-FigurinhasPro/CLAUDE.md](../../../../CLAUDE.md) — regras XP, gate pre-commit, deploy obrigatório
   - [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) — Next 16 + Prisma 7 + Tailwind 4 + Zod 4 quirks
   - [references/stack-cheatsheet.md](../../references/stack-cheatsheet.md) — checklist de breaking changes

4. **Estruturar plano** com:

   - **Goal**: 1 frase do objetivo
   - **Pesquisa-base**: lista de `thoughts/pesquisas/...` lidas
   - **Architecture**: 2-3 frases sobre abordagem (mencionar camadas afetadas: `src/app/`, `src/lib/`, `prisma/`, `src/components/`)
   - **Files affected**: criar/modificar/deletar com path absoluto
   - **Phases verificáveis**: cada fase com TDD plan (RED → GREEN → REFACTOR) + critério de saída automatizado (`npm run test` verde, `tsc --noEmit` verde, `npm run build` verde)
   - **Risks**: riscos técnicos + de produto (ex: "afeta cockpit comercial admin-only")
   - **Out of scope (YAGNI)**: 3-5 itens que NÃO entram
   - **Open questions**: o que precisa decisão humana (ex: env vars novas, mudança de schema)

5. **Salvar em `thoughts/planos/YYYY-MM-DD-<slug>.md`** com frontmatter:

```yaml
---
data: <YYYY-MM-DD>
tipo: plano
topico: <slug>
autor: <user>
projeto: P8-FigurinhasPro
relacionados: [pesquisas/<arquivo-relevante>.md]
status: rascunho
sha: <git SHA>
branch: <branch>
iteracoes: 0
---
```

6. **Mostrar caminho do plano** e os pontos-chave.

7. **PARAR.** Espero aprovação humana explícita: "aprovar / iterar / rejeitar". Não escrevo código.

8. **Após aprovação:** atualizo o frontmatter de `status: rascunho` → `status: ativo`. Esse upgrade é o gate que `/p8-master:implementa` checa antes de executar.

## Restrições

- **Não escrevo código.** Plano é estrutura + decisões.
- **Não pulo o gate de pesquisa.** Sem pesquisa, paro mesmo se "eu acho que sei".
- **Não inflo Out of scope.** 3-5 itens chave bastam.
- **Não esqueço o Akita Bootstrap.** Se a mudança toca >2 arquivos OU >50 linhas: cada fase do plano precisa cair dentro do limite (TDD + commit atômico).
- **Não esqueço o gate de P8.** O critério de saída de cada fase é `npm run test` verde + `tsc --noEmit` verde + `npm run build` verde. Sem isso, fase não fecha.
- **Para mudanças em schema Prisma:** plano DEVE incluir fase explícita "rodar `npx prisma db push` em prod com aprovação humana" antes do deploy.

## Modelo recomendado

- **Main session: Opus** — decompor em fases/tasks com trade-offs explícitos é cognitivo cross-cutting.
- **Sub-agent `historiador`** se houver: busca síntese cross-fase em `thoughts/`.
- **Casos triviais** (mudança em 1 arquivo): `/model sonnet`.

## Ver também

- [skills/pesquisa/SKILL.md](../pesquisa/SKILL.md) — pré-requisito
- [skills/valida/SKILL.md](../valida/SKILL.md) — passo seguinte
- [templates/plano.md](../../templates/plano.md) — template
