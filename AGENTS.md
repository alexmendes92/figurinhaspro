<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FigurinhasPro — Guia para Agentes IA

> Atualizado via Context7 em 2026-04-03. Versoes verificadas:
> Next.js 16.2.1 | React 19.2.4 | Prisma 7.5.0 | Tailwind CSS 4 | Zod 4.3.6

---

## Next.js 16 — Breaking Changes

### APIs de Request Assincronas (OBRIGATORIO)
Acesso sincrono a request APIs foi **removido** no Next.js 16. Sempre usar `await`:
```tsx
// CORRETO
const cookieStore = await cookies()
const headersList = await headers()
const { slug } = await params
const query = await searchParams
const { isEnabled } = await draftMode()

// ERRADO (vai dar erro)
const cookieStore = cookies()  // sync removido
```

### PageProps Helper
Next.js 16 oferece `PageProps` com tipagem automatica. Requer `npx next typegen`:
```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>{slug}</h1>
}
```

### proxy.ts substitui middleware.ts
O arquivo `middleware.ts` foi **deprecado**. Renomear para `proxy.ts`:
- Runtime: Node.js (nao Edge)
- Localizacao: mesmo nivel que `app/` (raiz do projeto)
- Este projeto **nao usa** proxy/middleware atualmente

### Turbopack — Config Top-Level
```ts
// next.config.ts — Next.js 16
const nextConfig: NextConfig = {
  turbopack: { /* opcoes */ },  // top-level
}
// NAO usar: experimental: { turbopack: { ... } }  (Next.js 15)
```

### Cache Components (`'use cache'`)
Substitui PPR. Permite misturar conteudo estatico e dinamico:
```tsx
'use cache'
export default async function Page() { ... }
```

### Navegacao Instantanea
Para client-side navigations rapidas, exportar `unstable_instant` da rota:
```tsx
export const unstable_instant = true
```
Consultar `node_modules/next/dist/docs/` para detalhes.

---

## Prisma 7.5 — Breaking Changes

### prisma.config.ts (centralizado)
Toda config agora fica em `prisma.config.ts` (ja configurado neste projeto):
- `.env` **NAO carrega automaticamente** — usar `import "dotenv/config"`
- Flags `--schema` e `--url` removidos dos comandos CLI
- URLs SQLite resolvem relativo ao config file, nao ao schema

### Driver Adapters (obrigatorio)
Prisma 7 exige driver adapter explicito. Este projeto usa:
```ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })
```

### Generator Provider
O nome do provider mudou em Prisma 7:
- Novo: `provider = "prisma-client"` (recomendado)
- Legacy: `provider = "prisma-client-js"` (ainda funciona — usado neste projeto)

### Enums Mapeados (CUIDADO)
Se usar `@map` em enums, os valores gerados em TS usam os valores mapeados, nao os nomes do schema. Bug conhecido ate v7.2 — verificar se corrigido.

### Import Path
```ts
// Padrao (sem output customizado):
import { PrismaClient } from '@prisma/client'

// Com output customizado no generator:
import { PrismaClient } from './generated/prisma/client'
```

---

## Tailwind CSS 4 — Nova Arquitetura

### Config via CSS (sem tailwind.config.js)
```css
@import "tailwindcss";

@theme inline {
  --color-background: #0b0e14;
  --color-foreground: #e8eaed;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```
- **NAO existe** `tailwind.config.js` ou `tailwind.config.ts`
- Temas e customizacoes ficam em `globals.css` via `@theme inline`
- Usa `@tailwindcss/postcss` (nao `tailwindcss` como plugin PostCSS)
- Classes utilitarias funcionam igual, mas config e diferente

---

## Zod 4 — Reescrita Completa

Zod 4 (`zod@4.3.6`) e uma reescrita do zero. Mudancas principais:
- Performance 2-7x melhor que Zod 3
- `z.interface()` disponivel alem de `z.object()`
- Mensagens de erro reestruturadas
- Algumas APIs de Zod 3 podem nao existir ou ter assinatura diferente
- **Sempre consultar docs atuais** antes de usar APIs Zod neste projeto

---

## React 19 + React Compiler

- React Compiler ativado via `babel-plugin-react-compiler` + `reactCompiler: true` no next.config.ts
- `useMemo`, `useCallback`, `React.memo` sao **desnecessarios** — o compiler otimiza automaticamente
- Server Components sao o padrao. `'use client'` so quando necessario
- Este projeto usa `CartProvider` e `ToastProvider` como Client Components no layout raiz

---

## Arquitetura deste Projeto

| Camada | Detalhes |
|--------|----------|
| DB | SQLite local (`dev.db`) via `@prisma/adapter-better-sqlite3` |
| ORM | Prisma 7.5 com `prisma.config.ts` centralizado |
| Auth | Custom (cookie-based em `lib/auth.ts`) |
| Estilo | Tailwind CSS 4 (CSS-first), dark mode, Geist fonts |
| Imagens | Sharp para processamento, `images.unoptimized: true` |
| Build | Turbopack (default Next.js 16), React Compiler ativado |

### Alias de Imports
```json
"paths": { "@/*": ["./*"] }
```
Usar `@/lib/db`, `@/components/...`, `@/app/...`, etc.
