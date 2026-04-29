# AUDIT.md — P8 FigurinhasPro

> Auditoria read-only gerada por `/akita-bootstrap-auto` (Fase B.1) em 2026-04-27. Não altera nada. Compilada por agente Explore + verificações pontuais.

---

## 1. Sinais do projeto (Fase 0)

| Sinal | Valor |
|---|---|
| Commits | 90 |
| Arquivos versionados | 243 |
| `AGENTS.md` | sim (233 linhas) |
| `CLAUDE.md` | sim |
| Pasta de testes | sim (`src/__tests__/`) |
| Arquivos `*.test.ts(x)` reais | **0** |
| CI configurado | sim (`.github/workflows/quality-gate.yml`) |
| Stack | Node + npm |

**Classificação**: HÍBRIDO — AGENTS.md existe mas precisa rede de caracterização (testes vazios apesar de setup pronto). Ver `CHARACTERIZATION_TESTS.md`.

---

## 2. Estrutura (até 2 níveis)

```
src/
├── app/                    ~90 arquivos
│   ├── (auth)/             5 rotas: login, registro, esqueci-senha, reset-senha, verificar-email
│   ├── (marketing)/
│   ├── albuns/[year]/      galeria pública
│   ├── api/                24 rotas: auth, albums, bot, comercial, inventory, orders, prices, seller, stripe
│   ├── loja/[slug]/        storefront vendedor
│   ├── onboarding/         page.tsx (772 LOC)
│   ├── painel/             admin, comercial, estoque, pedidos, precos, planos, loja
│   ├── privacidade/, termos/, teste/
│   └── page.tsx, layout.tsx
├── components/             37 .tsx
│   ├── auth/               10 componentes
│   ├── loja/               5 componentes (store-album-view 1052 LOC, store-hero, store-footer)
│   ├── painel/             15 componentes (inventory-manager 1036 LOC, precos-album-editor 823 LOC)
│   ├── painel/admin/, painel/comercial/
│   └── ui/                 confirm-dialog, empty-state, phone-input
├── lib/                    20 arquivos (albums.ts 44.781 LOC!)
└── __tests__/setup.ts      mocks globais Prisma + Stripe
```

---

## 3. Stack confirmada

| Camada | Tecnologia | Onde |
|---|---|---|
| Linguagem | TypeScript 5 (strict, `noImplicitAny: false`) | `tsconfig.json` |
| Framework | Next.js 16.2.4 (App Router, React 19.2.5) | `package.json` + `next.config.ts` |
| React Compiler | habilitado | `babel-plugin-react-compiler@1.0.0` + `reactCompiler: true` |
| ORM | Prisma 7.7 (`prisma-client` generator novo) | `prisma/schema.prisma` |
| DB prod | Neon Postgres via `@prisma/adapter-neon` (WebSocket Pool) | `src/lib/db.ts` |
| DB dev | Better SQLite3 via `@prisma/adapter-better-sqlite3` | mesmo |
| Auth | iron-session 8 + bcryptjs 3 | `src/lib/auth.ts` |
| Validação | Zod 4.3.6 | `src/lib/env.ts`, schemas em rotas POST |
| Pagamento | Stripe 22.0.2 | `src/lib/stripe.ts`, `src/app/api/stripe/*` |
| Monitoramento | Sentry 10.49 (instalado, **NÃO chamado em código** — 0 `Sentry.captureException`) | `next.config.ts`, `instrumentation.ts` |
| Lint/Format | Biome 2.4.12 | `biome.json` |
| Testes | Vitest 4.1.4 (esqueleto sem suite) | `src/__tests__/setup.ts` |
| Deploy | Vercel (auto-deploy desativado, manual `vercel deploy --prod`) | `vercel.json` |
| Analytics | Vercel Analytics + Speed Insights | layout |

---

## 4. Convenções e inconsistências

| Aspecto | Padrão observado | Inconsistência? |
|---|---|---|
| Naming TS | camelCase (`resolveUnitPrice`, `createSession`) | ✅ Consistente |
| Naming DB | camelCase no Prisma (`stickerType`, `albumSlug`) | ✅ Consistente |
| Server vs Client Components | **0 ocorrências de `'use client'` em código fonte** (mas há providers Client em `layout.tsx`) | ✅ Quase 100% Server Components |
| Server Actions vs API routes | **Misto**: `/painel/comercial/actions.ts` (Server Actions) + 24 rotas em `/api/*` | ⚠️ Sem regra clara de "quando uma vs outra" |
| Error handling | try/catch com Zod validation; `NextResponse.json` com status; `console.error` em fallback | ⚠️ **Sentry nunca chamado** apesar de instalado |
| `// @ts-ignore` / `any` solto | 0 ocorrências em `src/` | ✅ Disciplina TS |
| Senhas | bcrypt + fallback plaintext em login (linha 31) | ⚠️ Sellers legados podem ter plaintext no DB |

---

## 5. Testes

- Arquivos `*.test.ts` ou `*.spec.ts` em `src/`: **0**
- `src/__tests__/setup.ts`: 175 linhas, mocks completos pra 18 modelos Prisma + Stripe SDK (`checkout.sessions`, `customers`, `products`, `prices`)
- Cobertura estimada (sem rodar coverage): **0%**
- ADR 0005 declara intenção de TDD layer-by-layer; piloto P3 já rodou (37 testes), mas em P8 a suíte está **vazia** apesar do CLAUDE.md afirmar "Fase 5c rollout"

**Conclusão**: o projeto está pronto pra TDD (mocks prontos, deps instaladas, padrão definido). Falta a primeira leva de testes.

---

## 6. CI

`.github/workflows/quality-gate.yml`:

```yaml
on: [pull_request, push: master]
job quality:
  - actions/checkout@v4
  - actions/setup-node@v4 (node 22, cache npm)
  - npm ci
  - npm run build  # roda prisma generate + next build
```

**Gates**: apenas `build`. **Não roda** `lint`, `test`, type-check separado, security audit, coverage gate.

**Não bloqueia merge** — workflow é informativo. Branch protection rules do GitHub não foram inspecionadas (não há acesso via filesystem).

---

## 7. Top 10 arquivos grandes (LOC)

| # | Arquivo | LOC |
|---|---|---|
| 1 | `src/lib/albums.ts` | **44.781** |
| 2 | `src/components/loja/store-album-view.tsx` | 1.052 |
| 3 | `src/components/painel/inventory-manager.tsx` | 1.036 |
| 4 | `src/app/albuns/[year]/album-viewer.tsx` | 914 |
| 5 | `src/app/page.tsx` | 859 |
| 6 | `src/components/painel/precos-album-editor.tsx` | 823 |
| 7 | `src/lib/albums-data.ts` | 812 |
| 8 | `src/app/onboarding/page.tsx` | 772 |
| 9 | `src/app/teste/page.tsx` | 659 |
| 10 | `src/app/api/comercial/seed/route.ts` | 599 |

**Outliers**:
- `albums.ts` (44k LOC) é dado hardcoded — não é código. Migração pra DB resolve sem refactor de lógica. Top prioridade em `CIRURGIA_CANDIDATES.md`.
- 4 dos 9 restantes são >800 LOC e fazem **renderização + lógica de negócio** misturadas. Quebra natural por sub-componente.

---

## 8. Duplicações suspeitas

| Padrão | Arquivos | Sintoma |
|---|---|---|
| Editores de preço | `precos-editor.tsx` (456) + `precos-album-editor.tsx` (823) + `precos-global-editor.tsx` | 3 UIs paralelas para o mesmo `price-resolver` |
| Visualização de álbum | `store-album-view.tsx` (1.052) + `album-viewer.tsx` (914) | Loja vs galeria — provavelmente compartilham 60-80% de layout |
| Mock data | `painel/admin/revendedores/mock-data.ts` (373) | Dado estático em arquivo separado, candidato a seed/fixture |

Ver `CIRURGIA_CANDIDATES.md` pra prioridade.

---

## 9. Código legado e tech debt

| Item | Onde | Severidade |
|---|---|---|
| Fallback senha plaintext → bcrypt no login | `src/app/api/auth/login/route.ts:25-37` | ⚠️ Sellers antigos podem ter senha em texto puro no DB |
| Sentry instalado mas nunca chamado | `src/**` | ⚠️ Erros server-side passam despercebidos em prod |
| 0 testes apesar de setup completo | `src/__tests__/` | ⚠️ "ADR 0005 rollout" só na doc |
| TODOs no módulo comercial | `src/app/painel/comercial/{tarefas,page.tsx,actions.ts}`, `src/app/api/comercial/seed/route.ts` | 🟡 Backlog conhecido |
| Pasta `src/app/teste/` em produção (659 LOC) | `src/app/teste/page.tsx` | 🟡 Página de debug — vale verificar se está exposta |
| `albums.ts` 44k LOC hardcoded | `src/lib/albums.ts` | 🟡 Dado, não código — migração DB |
| CLAUDE.md afirma `plan-limits` retorna `true` cego | `CLAUDE.md` vs `src/lib/plan-limits.ts` | ⚠️ Doc divergente do código |

**Não há** pastas `legacy/`, `old/`, `_archive/`. Não há `// @ts-ignore` solto em `src/`.

---

## 10. Pastas inchadas

| Pasta | Arquivos | Observação |
|---|---|---|
| `src/lib/` | 20 | Inchada por `albums.ts` (44k LOC). Resto saudável. |
| `src/components/` | 37 | Bem organizada em subpastas; 3 componentes >800 LOC |
| `src/app/api/` | 24 rotas | Naming claro; rota `comercial/seed` é a maior (599 LOC) |
| `src/app/painel/comercial/` | 7 sub-módulos | Cockpit recente, ainda em rollout |

---

## Resumo executivo

Projeto em produção, arquitetura clara, stack moderna. Três tech debts dominantes:

1. **Dado hardcoded gigante** — `src/lib/albums.ts` (44k LOC). Não é refactor de código, é migração de dado.
2. **Observabilidade meia-boca** — Sentry instalado, nunca chamado.
3. **Suite de testes vazia** — esqueleto pronto, zero asserts.

Fora isso, o repo é "saudável o bastante" pra fluxo Akita ongoing (regra do escoteiro + TDD em código novo) sem precisar de cirurgia urgente.
