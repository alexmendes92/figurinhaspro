# Neon + Prisma Adapter — referência P8-FigurinhasPro

> P8 usa Neon Postgres em produção via `@prisma/adapter-neon` (WebSocket Pool). Esta doc cobre quirks e gotchas.

---

## Stack

- **DB:** Neon Postgres (serverless, scale-to-zero)
- **ORM:** Prisma 7.7
- **Adapter:** `@prisma/adapter-neon` v6+ (WebSocket Pool, não HTTP)
- **Generator:** `prisma-client` (Prisma 7.5+ — novo, mais rápido)

---

## Por que WebSocket Pool e não HTTP

Prisma 7 oferece 2 adapters Neon:

| Adapter | Conexão | Transações? | Performance |
|---|---|---|---|
| **PrismaNeon** | WebSocket Pool | ✅ Sim | Excelente |
| **PrismaNeonHttp** | HTTP | ❌ Não | Boa, mas sem `createMany`, `$transaction` |

**P8 usa PrismaNeon** porque:
- `createMany` é usado em sync de inventário em batch
- `$transaction` necessário em workflow Order → OrderItem
- WebSocket suporta queries paralelas no mesmo pool

`PrismaNeonHttp` seria atraente pra Edge Runtime, mas P8 roda Node.js (Vercel Functions, não Edge).

---

## Configuração em P8

### 1. `prisma/schema.prisma`

```prisma
generator client {
  provider     = "prisma-client"           // novo Prisma 7.5+
  output       = "../src/generated/prisma"
  runtime      = "nodejs"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. `prisma.config.ts`

```ts
import { defineConfig } from "prisma/config"
import "dotenv/config"  // CRÍTICO: Prisma 7 não carrega .env automaticamente

export default defineConfig({
  schema: "prisma/schema.prisma",
})
```

### 3. `src/lib/db.ts` (Lazy Proxy)

```ts
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

let _prisma: PrismaClient | null = null

function init() {
  if (_prisma) return _prisma
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL não configurada")

  const adapter = new PrismaNeon({ connectionString: url }, {})
  _prisma = new PrismaClient({ adapter })
  return _prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(init(), prop)
  },
})
```

**Por que Proxy?**
- `next build` chama `prisma.X` mas DATABASE_URL pode não estar setado em build-time
- Proxy lazy inicializa na primeira chamada real
- Build pode rodar sem DATABASE_URL ativo (Vercel build runner separa de runtime)

### 4. Cliente importado

```ts
import { prisma } from "@/lib/db"
import type { Seller, Order } from "@/generated/prisma/client"
```

Path `@/generated/prisma/client` (NÃO `@prisma/client`).

---

## Quirks importantes

### 1. `.env` NÃO carrega automaticamente em Prisma 7

```ts
// prisma.config.ts
import "dotenv/config"  // OBRIGATÓRIO
```

Sem isso, `npx prisma migrate dev` não acha DATABASE_URL.

### 2. `.env.local` (Next.js convention) também não

Next.js 16 carrega `.env.local` automaticamente em dev, mas Prisma CLI **não**. Soluções:

**Opção A:** duplicar em `.env`:
```bash
cp .env.local .env  # Prisma usa .env por padrão
```

**Opção B:** wrapper script:
```bash
npx dotenv -e .env.local -- prisma migrate dev
```

**Opção C (P8 atual):** `prisma.config.ts` com `dotenv/config` carrega `.env` (não `.env.local`).

### 3. Generator novo `prisma-client` (não `prisma-client-js`)

```prisma
generator client {
  provider = "prisma-client"  // NOVO em Prisma 7.5+
  // NÃO: provider = "prisma-client-js"
}
```

Diferenças:
- Output customizável (`output = "../src/generated/prisma"`)
- Mais rápido em runtime
- ESM-friendly (`moduleFormat = "esm"`)
- Tipos exportados de `@/generated/prisma/client`

Migração de `prisma-client-js` → `prisma-client` (já feita em P8 em 2026-04-20).

### 4. Enums com `@map`

```prisma
enum OrderStatus {
  QUOTE     @map("quote")
  CONFIRMED @map("confirmed")
  PAID      @map("paid")
  // ...
}
```

**Bug Prisma 7.0-7.2:** valores em TS usam o `@map` em vez do nome. Verificar se foi corrigido em 7.7. Se ainda quebra, usar `@@map` em vez de `@map` por valor.

### 5. WebSocket Pool — Connection limits

Neon free tier:
- **3 active connections** simultâneas
- Pool reuse aggressive (connection sharing)

Em P8, isso significa:
- Build paralelo pode bater limite (várias instances Vercel)
- `npm run dev` + tests rodando simultâneo pode bater limite
- Solução: Neon Pooler URL (`?pgbouncer=true&connection_limit=1` na DATABASE_URL)

Em prod, Neon scales automaticamente acima do free tier (paid).

### 6. Cold start

Neon scale-to-zero significa:
- DB hiberna após ~5min sem queries
- Primeira query após hibernação: 200-800ms cold start
- Subsequentes: <50ms

Em P8, problema em:
- Stripe webhook (precisa responder <10s pra Stripe não retry — ok)
- Cron jobs (primeiro request lento)

Mitigação: Vercel Crons mantém DB warm com health checks (não implementado em P8 ainda).

---

## Migrations

### Dev (rapid prototyping)
```bash
npx prisma db push       # Aplica schema sem migration formal
```

### Prod (always migration)
```bash
npx prisma migrate dev --name add-stripe-event-id  # Cria migration
git add prisma/migrations/
git commit -m "feat(db): add stripe event id"
git push
# Vercel build roda `prisma migrate deploy` automaticamente em build (se configurado)
```

P8 atualmente roda `prisma generate && next build` em build, **não** `prisma migrate deploy`. Migrations prod precisam ser aplicadas manualmente:

```bash
DATABASE_URL=<prod-url> npx prisma migrate deploy
```

Ou via wrapper: `pwsh -File scripts/prisma-diff-guard.ps1 -Mode migrate -Env prod`.

### Reset (PROIBIDO em prod)

```bash
npx prisma migrate reset  # Apaga TUDO. Bloqueado por hook em P8.
```

`hooks/precommit-router.ps1` bloqueia HARD.

---

## Performance tips

### 1. Use `select` ou `include` explícito

```ts
// ❌ Pior — busca todas as colunas
const seller = await prisma.seller.findUnique({ where: { id } })

// ✅ Melhor — busca só o necessário
const seller = await prisma.seller.findUnique({
  where: { id },
  select: { id: true, plan: true, stripeCustomerId: true },
})
```

### 2. Batch via `createMany` ou `$transaction`

```ts
// ✅ 1 query
await prisma.inventory.createMany({
  data: items.map(i => ({ sellerId, ...i })),
  skipDuplicates: true,
})

// ❌ N queries
for (const item of items) {
  await prisma.inventory.create({ data: { sellerId, ...item } })
}
```

### 3. Indexes

`@@index([campo])` em colunas de filtro frequente:
```prisma
model Inventory {
  // ...
  @@unique([sellerId, albumSlug, stickerCode])
  @@index([sellerId])         // queries "todos do vendedor"
  @@index([albumSlug])        // queries "todos do album"
}
```

### 4. Lazy load via Proxy

Já implementado em P8 (`src/lib/db.ts`). Permite build sem DATABASE_URL.

---

## Versão

`@prisma/client` e `prisma` devem **sempre** match em versão:
```json
{
  "dependencies": {
    "@prisma/client": "7.7.0"
  },
  "devDependencies": {
    "prisma": "7.7.0"
  }
}
```

Mismatch causa erro `Mismatched Prisma versions`. Verificar com `/p8-master:stay-current prisma`.

---

## Ver também

- [skills/p8-prisma-migrate/SKILL.md](../skills/p8-prisma-migrate/SKILL.md)
- [scripts/prisma-diff-guard.ps1](../scripts/prisma-diff-guard.ps1)
- [P8-FigurinhasPro/prisma/schema.prisma](../../../prisma/schema.prisma)
- [P8-FigurinhasPro/src/lib/db.ts](../../../src/lib/db.ts)
- [P8-FigurinhasPro/AGENTS.md](../../../AGENTS.md) — seção Prisma 7
