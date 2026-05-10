# Glossário — P8-FigurinhasPro

> Termos do domínio + termos técnicos. Mantido pelo plugin P8-MASTER.

## Domínio de negócio

- **Sticker** — figurinha. Tipos: `regular` (Normal), `foil` (Especial), `shiny` (Brilhante). Config em `src/lib/sticker-types.ts`.
- **Album** — coleção de stickers. Estáticos em `src/lib/albums.ts` (~7.122 cards em 13 Copas) ou customizados (CustomAlbum) em DB.
- **CustomAlbum** — álbum criado por vendedor. Slug com prefixo `custom_`. Schema Prisma `CustomAlbum`. Conversão em `src/lib/custom-albums.ts`.
- **Section** — agrupamento dentro de álbum (ex: "Brasil" numa Copa). Influencia preço (`SectionPriceRule`).
- **Seller** — vendedor (usuário do SaaS). Schema Prisma `Seller`. Identificado por `email`.
- **Inventory** — estoque por sticker. Unique `sellerId+albumSlug+stickerCode`.
- **Order** — pedido. Workflow: `QUOTE → CONFIRMED → PAID → SHIPPED → DELIVERED`.
- **Plan** — FREE / PRO / UNLIMITED. Gates em `src/lib/plan-limits.ts` (atualmente desabilitados).
- **Cockpit Comercial** — admin-only `/painel/comercial`. Gate `ADMIN_EMAIL`. 7 sub-módulos (leads, ofertas, experimentos, iniciativas, tarefas, KPIs).
- **Loja pública** — `/loja/[slug]`. Vitrine sem login. Importação de "lista faltante" filtra por estoque.
- **Price Resolver (3 eixos)** — `src/lib/price-resolver.ts`. Hierarquia: Individual > Seção > Tipo álbum > Tipo global > Padrão.

## Stack técnico

- **Next.js 16** — App Router, Server Components default, Turbopack, React Compiler ativado, APIs async.
- **React 19** — sem `useMemo`/`useCallback` (Compiler otimiza).
- **Prisma 7.7** — `prisma.config.ts`, generator `prisma-client` novo, driver adapter PrismaNeon.
- **Neon Postgres** — produção. Lazy Proxy em `src/lib/db.ts`.
- **Tailwind 4** — CSS-first, `@theme inline` em `globals.css`.
- **Zod 4** — reescrita completa.
- **iron-session 8** — cookies criptografados. Env `SESSION_PASSWORD` (≥32 chars).
- **bcryptjs 3** — hash de senhas.
- **Stripe SDK 22** — checkout, webhook (constructEvent obrigatório), customer portal.
- **Sentry 10.49** — `instrumentation.ts` + 3 configs. Inativo hoje (DSN opcional).
- **Vitest 4** — `environment: "node"`, mocks em `src/__tests__/setup.ts`.

## Termos do plugin P8-MASTER

- **SMA (System Master ACE)** — fusão Akita + ACE. Pipeline `pesquisa → plano → valida → implementa → itera`.
- **Akita Bootstrap** — 5 fases B.1-B.5 + ciclo TDD Red→Green→Refactor.
- **Oracle** — análise estratégica em 6 fases. Outputs em `output/01..06.md` + `99-oracle-master.md`.
- **lessons-audit** — auditoria de sessões pra detectar padrões. Propõe diffs.
- **stay-current** — checa gap de data e busca atualizações em fontes canônicas.
- **gate humano** — aprovação explícita (rascunho → ativo, deploy, edit em SKILL.md).
- **hurdle** — aprendizado novo que vira bullet em CLAUDE.md/AGENTS.md.
- **handoff** — captura de estado pra retomar sessão depois.

## Env vars críticas em prod

- `DATABASE_URL` — Neon
- `SESSION_PASSWORD` — iron-session, ≥32 chars
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL` — gate cockpit comercial
- `SENTRY_DSN` — opcional (inativo)
- `BOT_HMAC_SECRET` — integração WhatsApp bot

Schema validado em `src/lib/env.ts`.

## Gaps conhecidos (2026-05-10)

1. Plan limits desabilitados — TODO restaurar
2. Rate limiting ausente
3. Sentry inativo
4. Stripe webhook sem teste E2E em prod
5. Email Resend não implementado

---

Atualizar este glossário sempre que termo novo de domínio aparecer (via `/p8-master:hurdle`).
