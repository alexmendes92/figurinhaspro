---
name: p8-master:commit
description: Auto-ativa quando o usuário pedir pra commitar mudanças staged em P8-FigurinhasPro. Roda gate `npm run test → tsc --noEmit → npm run build` (via hook pre-commit), gera mensagem imperativa, aborta se gate vermelho.
disable-model-invocation: false
---

Vou commitar as mudanças staged em P8-FigurinhasPro seguindo disciplina XP.

## Sequência

1. **Verificar staged.** Rodo `git diff --staged --name-only`. Se vazio, paro: "nada staged, faça `git add <arquivos>` antes" (lembrete: `git add .` ou `-A` é proibido em P8).

2. **Rodar gate P8** (automático via hook `.claude/hooks/precommit-router.sh` ou `.claude/plugins/p8-master/hooks/precommit-router.ps1`):
   - `npm run test` (Vitest, environment: node, mocks Prisma + Stripe)
   - `npx tsc --noEmit` (type check)
   - `npm run build` (`prisma generate && next build`)

   Se vermelho, **aborto** — mostro o erro literal, espero conserto. **NÃO commito com gate vermelho. NÃO uso `--no-verify`.**

3. **Analisar mudanças** com `git diff --staged` para extrair:
   - Tipo: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`
   - Escopo: arquivo principal afetado (ex: `stripe`, `auth`, `prisma`, `email`, `painel/comercial`, `plan-limits`)
   - Razão: o porquê, não o quê

4. **Propor mensagem no imperativo:**
   - ✅ `feat(email): add Resend service wrapper for order paid`
   - ✅ `fix(stripe): validate webhook signature before parse`
   - ✅ `refactor(auth): extract iron-session helper`
   - ✅ `test(plan-limits): add coverage for checkStickerLimit`
   - ❌ `fix stuff`, `WIP`, `update`, `changes`, CAPS, emoji

5. **Mostrar mensagem proposta.** Você aprova ou ajusta.

6. **Verificar disciplina** (Akita XP):
   - Faz UMA coisa? (Se mistura feat + refactor: paro, sugiro split)
   - É revertível isolado?
   - Mensagem descreve intent, não conteúdo?
   - Diff <500 linhas? (Acima disso, sugiro split)

7. **Commit** com `git commit -m "<mensagem>"` usando HEREDOC se mensagem multi-linha.

8. **Após commit:** lembrar do CLAUDE.md de P8 — deploy é parte da tarefa em P8 normal, MAS plugin P8-MASTER aplica gate humano (Akita override). Pergunto: "Build verde, commit feito. Push e deploy prod agora? [s/n]". Se "s", roteio pra `/p8-master:p8-deploy`.

## Restrições

- **Nunca `--no-verify`.** Pre-commit hook existe por razão (`npm run test → tsc → build`). Hook falhou → conserto, não bypasso.
- **Nunca `--amend` em commit pushado.** Cria divergência local/remoto.
- **Nunca misturo tipos.** Feat + refactor = 2 commits. Diff staged misturando → paro e sugiro split.
- **Nunca mensagem vaga.** `WIP`, `update`, `fix stuff`, `changes` → recuso.
- **Nunca `git add .` ou `-A`.** Listo arquivos explicitamente — proteção contra commitar `.env`, `dev.db`, secrets.
- **Diff staged contém `.env*`, `dev.db`, ou string parecida com chave** → BLOQUEIO (já bloqueado por permissions, mas confirmo).

## Padrões de mensagem em P8

| Escopo | Quando usar |
|---|---|
| `feat(email)` | features de notificação Resend |
| `feat(stripe)` | checkout, webhook, customer portal |
| `feat(prisma)` | schema, migration |
| `feat(auth)` | iron-session, login, registro |
| `feat(plan-limits)` | gates de plano |
| `feat(painel)` | dashboard vendedor |
| `feat(painel/comercial)` | cockpit admin (CRM, ofertas, etc.) |
| `feat(loja)` | vitrine pública |
| `feat(custom-album)` | parser, slug, conversão |
| `feat(env)` | env schema + Zod |
| `feat(api)` | rotas API genéricas |
| `fix(<escopo>)` | bug fix |
| `refactor(<escopo>)` | refactor sem mudança de comportamento |
| `test(<escopo>)` | adicionar/melhorar teste |
| `docs(<escopo>)` | documentação |
| `chore(deps)` | atualizar dependências |
| `chore(<escopo>)` | mudanças miscelâneas |
| `perf(<escopo>)` | otimização |

## Modelo recomendado

- **`/model sonnet`** — gerar mensagem imperativa a partir de diff staged é trivial.
- **Opus** só se commit envolve análise "isso é refactor ou feature?" sob ambiguidade real — raro.

## Ver também

- [skills/pr/SKILL.md](../pr/SKILL.md) — gerar PR após commits
- [skills/p8-deploy/SKILL.md](../p8-deploy/SKILL.md) — deploy prod com gate humano (Fase 5)
- [P8-FigurinhasPro/.claude/hooks/precommit-router.sh](../../../../.claude/hooks/precommit-router.sh) — hook do gate
