---
name: Next.js 16 + Prisma 7 + React Compiler
description: Breaking changes Next.js 16, Prisma 7 (driver adapters, prisma.config.ts), React Compiler, Tailwind 4 CSS-first, Zod 4
metadata:
  priority: 8
  pathPatterns:
    - '**/app/**'
    - '**/lib/**'
    - '**/prisma/**'
    - '**/components/**'
  bashPatterns:
    - 'npx next'
    - 'prisma'
---

## Next.js 16 Breaking Changes

### APIs Assincronas (OBRIGATORIO)
```tsx
const { slug } = await params
const query = await searchParams
const cookieStore = await cookies()
```
Acesso sincrono REMOVIDO. Sempre usar `await`.

### proxy.ts substitui middleware.ts
Runtime: Node.js. Localizacao: mesmo nivel que `app/`.

### Turbopack: config top-level
```ts
const nextConfig = { turbopack: { /* opcoes */ } }
```

### Cache Components (`'use cache'`)
Substitui PPR para misturar estatico e dinamico.

## Prisma 7.5 Breaking Changes

### prisma.config.ts (centralizado)
- `.env` NAO carrega automaticamente — usar `import "dotenv/config"`
- Flags `--schema` e `--url` removidos da CLI
- URLs SQLite resolvem relativo ao config file

### Driver Adapters (obrigatorio)
```ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })
```

### Generator Provider
- Novo: `provider = "prisma-client"` (recomendado)
- Legacy: `provider = "prisma-client-js"` (ainda funciona)

## React Compiler

Ativado via `reactCompiler: true` no next.config.ts.
- `useMemo`, `useCallback`, `React.memo` sao DESNECESSARIOS
- O compiler otimiza automaticamente

## Tailwind CSS 4

Config via CSS (sem tailwind.config.js):
```css
@import "tailwindcss";
@theme inline { --color-background: #0b0e14; }
```
Usa `@tailwindcss/postcss` como plugin PostCSS.

## Zod 4

Reescrita completa. Performance 2-7x melhor.
- `z.interface()` disponivel alem de `z.object()`
- Mensagens de erro reestruturadas
- Algumas APIs Zod 3 nao existem ou mudaram

## Arquitetura

| Camada | Detalhe |
|--------|---------|
| DB | SQLite local via `@prisma/adapter-better-sqlite3` |
| ORM | Prisma 7.5 com `prisma.config.ts` |
| Auth | Custom cookie-based (`lib/auth.ts`) |
| Estilo | Tailwind 4 CSS-first, dark mode, Geist fonts |
| Build | Turbopack + React Compiler |
