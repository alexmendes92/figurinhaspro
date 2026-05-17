---
name: implementa
description: Executa plano step-by-step, rodando bin/precommit antes de cada commit. Compacta status entre fases.
argument-hint: <caminho do plano>
---

Vou executar o plano: $ARGUMENTS

(Argumento esperado: caminho do plano em `thoughts/planos/`)

**Pré-condições:**
- Plano com `status: ativo` no frontmatter. Se `rascunho`, paro e peço ao humano rodar `/valida` + aprovar (que dispara o upgrade do status via `/plano`).
- **Plano aparece em `thoughts/IN-FLIGHT.md` seção 🟢 Planos ativos.** Sem linha, paro e peço pra adicionar — outras sessões precisam saber que estou nos arquivos deste plano.
- Working tree limpo (`git status` retorna `nothing to commit`)
- `bin/ci` ou `bin/precommit` configurado (se ausente, aviso e pergunto se quer prosseguir)

Sequência:

1. **Ler o plano** + identificar primeira task pendente (checkbox `- [ ]`).

2. **Para cada task:**

   a. Anuncio qual task estou executando.
   b. Executo cada step na ordem (arquivos a criar, código a escrever, testes a rodar).
   c. Após o último step da task: rodo o gate (`bin/precommit` se existir).
   d. Se gate verde: commito com mensagem descritiva (no imperativo).
   e. Se gate vermelho: paro, mostro o erro, espero direcionamento. **Não tento mascarar.**
   f. Atualizo o checkbox no plano (`- [ ]` → `- [x]`).

3. **Ao final de cada FASE** (grupo de tasks relacionadas):
   - Compacto status no plano: progresso, decisões tomadas, blockers.
   - Sugiro `/compact` (built-in do Claude Code) se sessão estiver longa.

4. **Ao final do plano:**
   - Confirmo que a DoD do plano está completa.
   - **Atualizo `thoughts/IN-FLIGHT.md`** — movo linha de **🟢 Planos ativos** pra **Histórico recente** com `status: concluído`. Decremento/removo entradas em **⚠️ CONFLITOS** se este plano era único a tocar o arquivo.
   - Sugiro próximo passo (PR, deploy, próximo plano).

**Restrições:**
- **Nunca** mudo um teste pra ele passar (test-patching silencioso = anti-padrão).
- **Nunca** misturo features no mesmo commit.
- **Nunca** continuo se gate falhou.
- Se descobrir algo no caminho que muda o plano, **paro** e sugiro `/itera <plano>`.

## Modelo recomendado

- **Considere `/model sonnet`** antes de invocar — execução é mecânica: ler step, escrever código conforme plano, rodar gate, commitar. Opus é overkill aqui.
- **Main session em Opus** se o plano tem decisões de implementação ambíguas, ou se gate falhou e precisa diagnóstico — aí o cognitivo volta.
- **Sub-agents** (raros nessa fase): se invocados, rodam em Sonnet pelo frontmatter.

## Restrições adicionais

- **Nunca mudo um teste pra passar.** Test patching silencioso = anti-padrão Akita. Teste vermelho = código errado, até prova em contrário.
- **Nunca misturo features no mesmo commit.** Uma task = um commit. Se aparecerem duas no caminho, paro e separo.
- **Nunca continuo se gate falhou.** `bin/precommit` vermelho = paro, mostro erro, espero direcionamento. Não mascaro.
- **Nunca expando escopo silenciosamente.** Descobri algo que muda o plano? Paro e sugiro `/itera`. Não emendo "já que estou aqui".

## Ver também

- Manual 5 §6 (`bin/ci` e `bin/precommit`) — gates que `/implementa` honra antes de cada commit.
- Manual 4 §4 (O ciclo de uma sessão) — onde a execução cabe no fluxo R-P-I.
