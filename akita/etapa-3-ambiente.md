> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28

# Etapa 3 — Ambiente e Harness (DRAFT)

## Sistema base proposto

**Windows 11** (atual) — `C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro` em Git Bash. Mantém o que está rodando. Akita 2026 default seria Linux nativo / OrbStack (Mac), mas trocar SO no meio do projeto custa caro e o stack é cross-platform.

**Atenção a gotchas Windows-específicos** já documentados no global (`~/.claude/ANTIPATTERNS.md`):
- `cd` relativo em Bash não persiste entre chamadas → sempre path absoluto
- `echo "$SECRET" | vercel env add` corrompe com CRLF → usar `printf '%s'`
- Ripgrep workspace inteiro estoura timeout → `path` + `glob` restritos

## Editor

VS Code com extensões já instaladas (presume-se):
- Biome (lint/format) — substitui ESLint + Prettier
- Prisma (highlight + format `schema.prisma`)
- Tailwind CSS IntelliSense (Tailwind 4 — versão recente)
- Error Lens (inline diagnostics)

## Claude Code CLI

- ✅ Instalado e autenticado (sessão atual)
- ✅ `~/.claude/CLAUDE.md` global presente (princípios operacionais + LESSONS + ANTIPATTERNS)
- ✅ `CLAUDE.md` + `AGENTS.md` do projeto presentes (regras XP, hooks, breaking changes Next 16/Prisma 7)
- ✅ Hook pré-commit ativo: `npm run test → npx tsc --noEmit → npm run build`
- ⏳ SMA (system-master-ace) — checar se vale instalar via `/akita-bootstrap:akita-install-sma` (skills `/pesquisa`, `/plano`, `/implementa`, `/itera`, `/valida` já existem nas skills do plugin akita-bootstrap)

## CLAUDE.md inicial — proposta de slim-down (v0)

CLAUDE.md atual tem ~150 linhas. Pra v0 enxuta sugere-se redução:

```markdown
@AGENTS.md

# FigurinhasPro

Repo: `github.com/alexmendes92/figurinhaspro` | Branch: `master`

## Stack
Next.js 16 + React 19 + Prisma 7 + Neon Postgres + Tailwind 4 + Zod 4 + iron-session + Stripe + Sentry + Biome + Vitest

## Comandos
- `npm run dev` — porta 3009 (Turbopack)
- `npm run build` — `prisma generate && next build`
- `npm run test` — Vitest
- `npx vercel deploy --prod` — deploy manual

## Convenções
- TDD: RED→GREEN→REFACTOR (ADR 0005)
- Hook pré-commit roda test + tsc + build
- Commit atômico: 1 commit = 1 unidade funcional
- Specs evoluem com código (CLAUDE.md / ADR / comentário inline)

## Domínios
- Núcleo: Seller / Inventory / PriceRule / Order / CustomAlbum
- Cockpit comercial admin (`/painel/comercial`): família Biz* (não-core)
- Bot WhatsApp (`/api/bot/*`): integração externa (HMAC + n8n)

## Específicos críticos (não óbvios)
- `src/lib/db.ts` usa Lazy Proxy — não conecta no build
- Generator Prisma novo (`prisma-client`) → import de `@/generated/prisma/client`
- `proxy.ts` substitui `middleware.ts` (Next 16) — projeto NÃO usa atualmente
- APIs request assíncronas: `await params`, `await cookies()`, `await headers()`
- ADMIN_EMAIL gate em `src/lib/admin.ts` (cockpit comercial só pra admin)
- Plan gates em `src/lib/plan-limits.ts` estão "temporariamente liberados"
```

> Decisão postergada: manter o CLAUDE.md atual rico ou enxugar pra esta versão. Atual já cobre o suficiente — enxugar é cosmético.

## MCPs essenciais (sugeridos para o caso W + Next.js + Prisma + Stripe)

| MCP | Função | Já habilitado? |
|---|---|---|
| `context7` | Docs versionadas Next/Prisma/Stripe/Zod | ✅ Global |
| `claude.ai DocFork` | Fallback de docs | ✅ Global |
| `playwright` | E2E + screenshots (regra "Review de UI" workspace) | ✅ Global |
| `chrome-devtools` | Performance/LCP/console em prod | ✅ Global |
| `vercel` | `vercel env`, `vercel deploy`, logs | ✅ Global |
| `linear` (opcional) | Sync com tracker de tasks (BizTask reside no DB) | ⏳ Avaliar |

## Variáveis de ambiente (mínimo viável)

Confirme presença no Vercel (`vercel env ls`) e local (`.env.local`):

| Var | Onde | Crítica? |
|---|---|---|
| `DATABASE_URL` | Neon (prod) ou SQLite path (dev) | ✅ |
| `SESSION_SECRET` | iron-session (>=32 chars) | ✅ |
| `STRIPE_SECRET_KEY` | Stripe SDK | ✅ p/ checkout |
| `STRIPE_WEBHOOK_SECRET` | webhook signature | ✅ p/ webhook |
| `STRIPE_PRICE_PRO` | price ID Stripe | ✅ p/ upgrade |
| `STRIPE_PRICE_UNLIMITED` | price ID Stripe | (postergada na v0 — ver Etapa 1) |
| `ADMIN_EMAIL` | guard cockpit comercial | ✅ p/ admin |
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Sentry | (não-bloqueante) |
| `RESEND_API_KEY` ou similar | reset password / verify email | (não-bloqueante na v0) |

Validação rigorosa em `src/lib/env.ts` via Zod (já existe).

## Banco de testes

`vitest` em env `node` com `setup.ts` global mockando Prisma (18 modelos) + Stripe — já configurado em `src/__tests__/setup.ts`. Layer testing pattern (utils/services/api/components) replicado de P3 piloto.

## Higiene de repo

- ✅ `.gitignore` cobre `node_modules`, `.next`, `src/generated/prisma`, `.env.local`
- ✅ `.claude/settings.json` com hooks pré-commit
- ⏳ Considerar adicionar pasta `akita/` em `.gitignore` se os DRAFTs **não** devem ir pro repo (ou commitar deliberadamente após revisão humana — header AUTO-GERADO sinaliza estado)

---

**Próxima etapa:** `/akita-bootstrap:akita-etapa-4-implementacao`
