---
name: p8-master:implementa
description: Auto-ativa quando o usuário pedir pra implementar, executar ou rodar um plano aprovado em P8-FigurinhasPro. Executa step-by-step com TDD (RED → GREEN → REFACTOR), roda gate `npm run test → tsc --noEmit → npm run build` antes de cada commit, aborta no primeiro vermelho. Use SEMPRE depois de `/p8-master:plano` aprovado.
argument-hint: <caminho do plano>
---

Vou executar o plano: $ARGUMENTS

(Argumento esperado: caminho do plano em `thoughts/planos/`)

## Pré-condições

- Plano com `status: ativo` no frontmatter. Se `rascunho`, paro e peço ao humano rodar `/p8-master:valida` + aprovar (que dispara o upgrade do status via `/p8-master:plano`).
- Working tree limpo (`git status` retorna `nothing to commit`).
- Hook pre-commit configurado em `.claude/hooks/precommit-router.sh` (existente em P8). Se ausente, aviso e pergunto se quer prosseguir sem gate.

## Sequência

1. **Ler o plano** + identificar primeira task pendente (checkbox `- [ ]`).

2. **Para cada task:**

   a. **Anuncio** qual task estou executando.

   b. **Akita TDD ciclo:**
      - **RED**: escrevo teste que falha (caso o teste seja relevante — toda mudança de comportamento começa por teste vermelho).
      - **GREEN**: implemento o mínimo pra passar.
      - **REFACTOR**: em micro-passos (<50 linhas, <2 arquivos por extração). Se passar disso, paro e proponho dividir.

   c. **Após o último step da task:** rodo o gate P8:
      ```
      npm run test          # Vitest, environment: node
      npx tsc --noEmit      # type check
      npm run build         # prisma generate && next build
      ```
      Hook `precommit-router.sh` em `.claude/hooks/` faz isso automaticamente — confio no hook.

   d. **Se gate verde:** commito com mensagem descritiva no imperativo:
      ```
      tipo(escopo): descrição curta

      Body opcional referenciando thoughts/planos/<arquivo>.md.
      ```
      Padrão: `feat(stripe): trigger order paid email after payment`, `fix(plan-limits): restore checkStickerLimit guard`, `refactor(auth): extract iron-session helper`.

   e. **Se gate vermelho:** paro, mostro o erro literal, espero direcionamento. **Não tento mascarar. Não altero o teste pra passar.**

   f. **Atualizo o checkbox** no plano (`- [ ]` → `- [x]`).

3. **Ao final de cada FASE** (grupo de tasks):
   - Compacto status no plano: progresso, decisões tomadas, blockers.
   - Sugiro `/compact` (built-in do Claude Code) se sessão estiver longa.

4. **Ao final do plano:**
   - Confirmo que a DoD está completa.
   - **Não faço deploy automático.** Pergunto: "Plano executado, build verde, pronto pra `/p8-master:p8-deploy`? [s/n]". Esta é a regra Akita-style — sobrescreve o "deploy automático" do CLAUDE.md de P8.

## Restrições

- **Nunca mudo um teste pra passar** (test-patching silencioso = anti-padrão Akita). Teste vermelho = código errado, até prova em contrário.
- **Nunca misturo features no mesmo commit.** Uma task = um commit.
- **Nunca continuo se gate falhou.** `npm run test` vermelho = paro, mostro erro, espero direcionamento.
- **Nunca expando escopo silenciosamente.** Descobri algo que muda o plano? Paro e sugiro `/p8-master:itera`.
- **Nunca pulo `npx prisma generate`** se schema mudou (se hook não fizer, eu faço).
- **Nunca commito mock/dados sensíveis.** `.env*`, `dev.db`, credentials são bloqueados pelo hook + permissions.
- **Refactor extrapolando 50 linhas / 2 arquivos:** paro. Sinal de que era cirurgia, não micro-passo.

## Padrões P8-específicos

| Camada | Convenção |
|---|---|
| `src/app/` | Server Components default, `await params`, `await cookies()`, sem `'use client'` desnecessário |
| `src/lib/` | Pure functions ou módulos isolados; `db.ts` é Lazy Proxy; `auth.ts` usa iron-session |
| `src/components/` | Client Components quando precisar (hooks/eventos); Tailwind 4 (sem config.js) |
| `src/__tests__/setup.ts` | Mocks globais Prisma + Stripe — adicionar mock se touch em modelo novo |
| `prisma/schema.prisma` | Generator `prisma-client` novo, output `../src/generated/prisma`; após mudança rodar `npx prisma generate` |
| `src/lib/env.ts` | Adicionar env vars novas com Zod schema (strict prod, fallback dev) |
| `src/app/api/stripe/*` | Validar webhook signature; usar Stripe SDK 22; resposta 200 sempre |
| `src/lib/plan-limits.ts` | Gates desabilitados temporariamente — não habilitar sem aprovação explícita |

## Modelo recomendado

- **Considere `/model sonnet`** antes de invocar — execução é mecânica.
- **Main session em Opus** se gate falhou e precisa diagnóstico.

## Ver também

- [skills/itera/SKILL.md](../itera/SKILL.md) — quando descoberta nova muda o plano
- [skills/commit/SKILL.md](../commit/SKILL.md) — disciplina de mensagem
- [P8-FigurinhasPro/.claude/hooks/precommit-router.sh](../../../../.claude/hooks/precommit-router.sh) — hook do gate (existente)
