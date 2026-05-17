---
name: plano
description: Cria plano detalhado em thoughts/planos/ baseado em pesquisa anterior. Espera aprovação humana antes de executar.
argument-hint: <descrição da tarefa>
---

Vou propor plano para a tarefa: $ARGUMENTS

**Pré-requisito:** preciso de pesquisa sobre essa área em `thoughts/pesquisas/`. Se não existir, vou parar e sugerir rodar `/pesquisa <tópico>` antes.

Sequência:

0. **Verificar IN-FLIGHT.** Leio `thoughts/IN-FLIGHT.md`. Se já existe plano `ativo` cobrindo o tema, paro e proponho `/itera`. Anoto arquivos-alvo conflitantes pra incluir na seção **Risks** do plano.

1. **Verificar pesquisa.** Procuro em `thoughts/pesquisas/` por artefatos relevantes ao tópico. Se nenhum, paro e sugiro `/pesquisa`.

2. **Ler pesquisa(s).** Carrego os artefatos encontrados como contexto.

3. **Estruturar plano** com:
   - **Goal**: 1 frase do objetivo
   - **Architecture**: 2-3 frases sobre abordagem
   - **Files affected**: criar/modificar/deletar com path exato
   - **Phases verifiable**: cada fase com critério de validação automatizado
   - **Risks**: o que pode dar errado
   - **Out of scope (YAGNI)**: o que NÃO entra
   - **Open questions**: o que precisa decisão humana

4. **Salvar em `thoughts/planos/YYYY-MM-DD-<slug>.md`** com frontmatter:

```yaml
---
data: <YYYY-MM-DD>
tipo: plano
topico: <slug>
autor: <user>
relacionados: [pesquisas/<arquivo-relevante>.md]
status: rascunho
branch: <branch>  # obrigatório — sem isso o IN-FLIGHT não consegue prevenir conflito
---
```

5. **Mostrar o caminho do plano** e os principais pontos.

6. **Atualizar `thoughts/IN-FLIGHT.md`.** Adiciono linha em **🟡 Planos em rascunho** com nome, branch, arquivos-alvo, data. Se algum arquivo-alvo aparece em outro plano `ativo`/`rascunho`, alimento a seção **⚠️ CONFLITOS** com coordenação sugerida.

7. **PARAR.** Espero aprovação humana explícita antes de qualquer ação. Não escrevo código.

8. **Após aprovação:** atualizo o frontmatter de `status: rascunho` → `status: ativo` E movo a linha no IN-FLIGHT de **🟡** para **🟢 Planos ativos**. Esse upgrade é o gate que `/implementa` checa antes de executar — sem ele, plano fica como rascunho e implementação não roda.

## Modelo recomendado

- **Main session: Opus** (default do SMA) — decompor em fases/tasks com trade-offs explícitos é cognitivo cross-cutting, justifica Opus.
- **Sub-agent delegado** (`historiador` se houver): Sonnet pelo frontmatter — busca/síntese de pesquisas e planos anteriores em `thoughts/`.
- **Casos triviais** (mudança em 1 arquivo, sem trade-offs): `/model sonnet` antes de invocar; o plano sai mecânico sem perda.

## Restrições adicionais

- **Não escrevo código.** Plano é estrutura + decisões, não implementação. Próxima fase é `/implementa`.
- **Não pulo o gate de pesquisa.** Se não há artefato em `thoughts/pesquisas/` cobrindo o tópico, paro e sugiro `/pesquisa` antes — mesmo se "eu acho que sei". Sem pesquisa, plano é cego.
- **Não inflo Out of scope.** Listar 20 coisas que não vão entrar transforma o plano em wishlist negativa. 3–5 itens chave bastam.

## Ver também

- Manual 2 §3 (Os 4 elementos da comunicação efetiva) — estrutura O QUE / COMO / NÃO / VALIDAR que orienta o plano.
- Manual 4 §6.5 (Intentional compaction) — por que o plano vira artefato durável em `thoughts/planos/`.
