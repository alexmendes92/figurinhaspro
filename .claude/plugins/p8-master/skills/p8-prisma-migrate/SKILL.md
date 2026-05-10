---
name: p8-master:p8-prisma-migrate
description: Auto-ativa quando o usuário mexe em `prisma/schema.prisma` ou pede pra "alterar schema", "rodar migration", "prisma push", "prisma migrate". Mostra diff entre schema atual e DB, exige confirmação humana antes de aplicar (nunca aplica em prod sem aprovação dupla), suporta dev (push) e prod (migrate deploy).
argument-hint: "<--push|--migrate|--diff-only> [--prod]"
---

Vou gerenciar migration Prisma em P8-FigurinhasPro: $ARGUMENTS

## Pré-condições

- `DATABASE_URL` configurada (se `--dev` lê de `.env.local`; se `--prod` lê de Vercel env scope Production).
- Schema válido em [prisma/schema.prisma](../../../../prisma/schema.prisma).

## Modos

### `--diff-only` (default seguro)

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

Output: SQL que seria aplicado. **NÃO aplica nada.**

### `--push` (dev only por default)

Mostra diff via [scripts/prisma-diff-guard.ps1](../../scripts/prisma-diff-guard.ps1) → pergunta confirmação → roda `npx prisma db push`.

```bash
pwsh -File .claude/plugins/p8-master/scripts/prisma-diff-guard.ps1 -Mode push -Env dev
```

`db push` é OK em dev (rapid prototyping). NUNCA em prod sem `--migrate`.

### `--migrate` (formal)

Cria migration formal em `prisma/migrations/`:

```bash
npx prisma migrate dev --name <slug-descritivo>
```

Para prod:
```bash
npx prisma migrate deploy  # GATE HUMANO obrigatorio
```

### `--prod` (sempre exige aprovação dupla)

1. Roda `--diff-only` primeiro.
2. Pergunta: "Aplicar em PROD? Database: <NEON_URL_PROD>. Confirmar `s` 2x:"
3. Se aprovado: `npx prisma migrate deploy` ou `npx prisma db push` (segundo o flag).
4. Se cancelado: aborta limpo.

## Sequência completa

1. **Pre-check.** Se há mudanças não-stagged em `prisma/schema.prisma`, pergunto se quer commitar primeiro.

2. **Mostra diff** (sempre, mesmo em `--diff-only`).

3. **Decisão por modo:**
   - `--diff-only`: para aqui.
   - `--push --dev`: confirmação simples.
   - `--push --prod`: BLOQUEIO HARD (migrate é melhor).
   - `--migrate --dev`: confirmação simples.
   - `--migrate --prod`: confirmação dupla.

4. **Antes de aplicar prod:**
   - Lembra `npx prisma generate` (regenera client após schema mudar).
   - Lembra que mudança de schema sem migrar prod ANTES de deploy QUEBRA o app.
   - Recomenda rodar `npx prisma migrate status` pra ver se há drift.

5. **Após aplicar:** roda `npx prisma generate` + sugere `/p8-master:p8-deploy` (se já commitou código consumidor).

6. **Hook integration:** se o gate `precommit-router.ps1` detectou mudança em `prisma/schema.prisma`, sugere automaticamente esta skill.

## Restrições

- **NUNCA `prisma migrate reset`** sem confirmação dupla — apaga TODOS os dados.
- **NUNCA `prisma migrate reset --skip-seed`** em prod — bloqueio HARD em [hooks/precommit-router.ps1](../../hooks/precommit-router.ps1).
- **NUNCA aplica migration sem mostrar diff.**
- **NUNCA roda em prod sem `--prod` explícito + confirmação dupla.**
- **Mudança em schema ANTES de deploy:** plan deve incluir migration prod ANTES do deploy ou fix vai quebrar app em prod.

## Bug conhecido em P8 (Prisma 7)

Em [src/lib/db.ts](../../../../src/lib/db.ts), Lazy Proxy evita conexão durante build. Após `npx prisma db push`, **rode `npx prisma generate`** ou Prisma Client fica desatualizado em runtime (erro `unknown field`).

Em P8: `npm run build` faz `prisma generate && next build` automaticamente. Mas em workflow manual, lembre-se.

## Modelo recomendado

- **Main session: Sonnet** — orquestra CLI + parse output.
- **Confirmação:** humano sempre (`s/n` em modo `--push --dev`, dupla em `--prod`).

## Ver também

- [scripts/prisma-diff-guard.ps1](../../scripts/prisma-diff-guard.ps1)
- [references/neon-prisma-adapter.md](../../references/neon-prisma-adapter.md)
- [P8-FigurinhasPro/prisma/schema.prisma](../../../../prisma/schema.prisma)
- [P8-FigurinhasPro/prisma.config.ts](../../../../prisma.config.ts)
- [P8-FigurinhasPro/src/lib/db.ts](../../../../src/lib/db.ts)
