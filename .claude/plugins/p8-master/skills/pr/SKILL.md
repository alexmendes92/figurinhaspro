---
name: p8-master:pr
description: Auto-ativa quando o usuário pedir pra abrir PR (pull request) com os commits do branch atual em P8-FigurinhasPro. Gera título + corpo no padrão Problema/Abordagem/Test plan/Rollback. NÃO abre PR automaticamente — só prepara material.
disable-model-invocation: false
---

Vou preparar PR a partir dos commits do branch atual.

## Sequência

1. **Identificar base branch:** geralmente `master` (P8 usa `master`, não `main`). Confirmo se ambíguo via `git remote show origin | grep "HEAD branch"`.

2. **Listar commits do branch:**
   ```bash
   git log --oneline master..HEAD
   git diff master...HEAD --stat
   ```

3. **Analisar commits:** agrupo por intenção (feature principal, refactors de suporte, testes adicionais, bug fixes encontrados).

4. **Gerar título** (≤ 70 caracteres, descritivo, imperativo, captura a feature principal):
   - ✅ `feat(stripe): add idempotent webhook with event tracking`
   - ✅ `fix(auth): prevent session leak across requests`
   - ❌ `email validation + tests + minor fixes` (junta 3 coisas)

5. **Gerar corpo estruturado:**

```markdown
## Problema

<1-3 frases descrevendo o problema/oportunidade que motivou o PR. Cita gap conhecido se aplicável (plan-limits, rate-limit, Sentry, etc.).>

## Abordagem

<1-3 frases sobre como resolvi. Mencionar arquivos-chave: src/lib/X.ts, prisma/schema.prisma, src/app/api/Y/route.ts.>

## Test plan

- [ ] `npm run test` (Vitest) — passa em local
- [ ] `npx tsc --noEmit` — passa
- [ ] `npm run build` — passa
- [ ] Cenário manual: <ex: "stripe trigger checkout.session.completed → email chega">
- [ ] Smoke em preview Vercel: <URL preview>

## Schema/migration impact

- [ ] Schema Prisma mudou? (sim/não)
- [ ] Se sim: `npx prisma db push` rodou em prod com aprovação humana? (sim/não)

## Rollback plan

<como reverter se algo der errado em produção. Ex: `git revert <SHA>` + `vercel rollback`.>

## Out of scope

<o que NÃO está incluído neste PR (se relevante). Ex: "Não migra Stripe SDK 22→23 (PR separado).">

## Specs evolved (ADR 0005)

- [ ] CLAUDE.md atualizado (se mudou convenção)
- [ ] AGENTS.md atualizado (se mudou breaking change da stack)
- [ ] ADR criado em `thoughts/decisoes/` (se decisão arquitetural)
- [ ] Comentário `// @spec:` no código (se gotcha técnico)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

6. **Mostrar título + corpo.** Você aprova ou ajusta.

7. **NÃO abro o PR automaticamente** — só preparo material. Você decide quando rodar:
   ```bash
   gh pr create --title "<titulo>" --body "$(cat <<'EOF'
   <corpo>
   EOF
   )"
   ```

## Restrições

- **Não abro o PR automaticamente.** Material pronto, comando proposto, você executa.
- **Não invento test plan.** Se não rodei o teste, listo como `[ ]` a rodar.
- **Não escondo Out of scope.** Se cortei algo, registro.
- **Não misturo PRs.** Branch tem 2 features distintas? Paro e sugiro split antes.
- **Não esqueço o ADR 0005.** Em P8 (revisão de testing-rollout), specs DEVEM evoluir com código. Se PR não atualiza nada disso, é red flag — considero se de fato não é necessário.

## Modelo recomendado

- **`/model sonnet`** — agrupar commits + escrever Problem/Approach/Testing/Rollback é texto curto estruturado.
- **Opus** se PR cobre 20+ commits com decisões cruzadas — raro.

## Ver também

- [skills/commit/SKILL.md](../commit/SKILL.md) — disciplina de cada commit que entra no PR
- [P8-FigurinhasPro/CLAUDE.md](../../../../CLAUDE.md) — regras XP do projeto
- [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) — ADR 0005 (Specs evolved)
