---
name: p8-master:itera
description: Auto-ativa quando o usuário pedir pra iterar, refinar ou ajustar um plano existente em P8-FigurinhasPro após feedback ou descoberta nova durante implementação. Mantém histórico de mudanças preservando checkbox state das tasks completadas.
argument-hint: <caminho do plano>
---

Vou iterar sobre o plano: $ARGUMENTS

(Argumento esperado: caminho do plano em `thoughts/planos/`)

Contexto: você descobriu algo durante implementação que muda o plano original — uma constraint nova, uma task ficou maior/menor, ou apareceu corte de escopo (YAGNI). Não quero perder a versão anterior, mas precisa atualizar.

## Sequência

1. **Ler o plano atual** (incluindo `## Histórico de iterações` se existir).

2. **Perguntar o que mudou** (se não estiver claro):
   - O que descobriu que o plano não previa?
   - Uma task ficou maior/menor que esperado?
   - Apareceu uma constraint nova (env var, lib que falta, breaking change)?
   - Decidiu cortar escopo (YAGNI)?
   - Gate vermelho persistente em alguma fase?

3. **Propor diff do plano:**
   - Tasks afetadas (qual movimentação, qual remoção, qual adição)
   - Atualização de `Architecture` / `Out of scope` / `Risks`
   - Atualização de `Files affected` se mudou
   - Nota no topo: `## Histórico de iterações` com data + sumário da mudança + razão

4. **Mostrar o diff antes de aplicar.** Espero aprovação humana.

5. **Aplicar a mudança** preservando checkbox state das tasks já completadas (`- [x]` continua `- [x]`).

6. **Atualizar frontmatter** com:
   ```yaml
   iteracoes: <N+1>
   data_ultima_iteracao: <YYYY-MM-DD>
   ```

7. **Commitar** mudança com mensagem `Iterar plano: <razão da iteração>`.

8. **Sugerir continuação:** "Plano iterado. Continuar `/p8-master:implementa <path>`?"

## Restrições

- **Não perco histórico.** `## Histórico de iterações` no topo do plano cresce a cada `/p8-master:itera` — não sobrescrevo, só adiciono.
- **Não toco em checkbox de tasks completadas.** O que foi feito ficou feito; iteração só re-organiza o que falta.
- **Não inicio nova fase sem aprovação humana do diff.** Mostro, espero OK, aplico.
- **Não confundo iteração com replano.** Mudança de architecture grande ou corte forte de escopo → paro e sugiro `/p8-master:plano` novo (esse fica como `relacionados:` do anterior).

## Quando iterar vs replanejar

| Sintoma | Ação |
|---|---|
| Uma task vira duas (decomposição) | `/p8-master:itera` |
| Apareceu env var nova obrigatória | `/p8-master:itera` |
| Lib X foi descontinuada, troca pra Y | `/p8-master:itera` (se Y tem API similar) |
| Architecture muda substancialmente | `/p8-master:plano` novo |
| Escopo dobrou de tamanho | `/p8-master:plano` novo (e fechar este como `arquivado`) |
| Gate vermelho em 1 fase, fix conhecido | `/p8-master:itera` (split em 2 tasks) |
| Gate vermelho persistente em 3+ fases | parar, perguntar ao humano |

## Modelo recomendado

- **Main session: Opus** — preservar histórico e propor diff coerente é médio peso cognitivo.
- **Casos triviais** (uma task vira duas): `/model sonnet`.

## Ver também

- [skills/plano/SKILL.md](../plano/SKILL.md) — quando iteração não basta
- [skills/implementa/SKILL.md](../implementa/SKILL.md) — quem retoma após iteração
