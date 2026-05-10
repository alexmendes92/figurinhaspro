# Stack cheatsheet — P8-FigurinhasPro

> Breaking changes e armadilhas das libs principais. Consulte antes de escrever código novo.

---

## Next.js 16

### APIs de Request — agora ASYNC (obrigatório)

Sync foi removido. Sempre `await`:

```tsx
// CORRETO
const cookieStore = await cookies()
const headersList = await headers()
const { slug } = await params
const query = await searchParams
const { isEnabled } = await draftMode()

// ERRADO (vai dar erro em runtime)
const cookieStore = cookies()  // sync removido
```

### `proxy.ts` substitui `middleware.ts`

- `middleware.ts` foi deprecado.
- Renomear para `proxy.ts`.
- Runtime: Node.js (não Edge).
- Localização: `src/proxy.ts` (mesmo nível que `src/app/`).
- **P8 não usa proxy/middleware** atualmente. Se for adicionar, usar `proxy.ts`.

### Turbopack — config top-level

```ts
// next.config.ts — Next.js 16
const nextConfig: NextConfig = {
  turbopack: { /* opcoes */ },  // top-level
}
// NAO usar: experimental: { turbopack: { ... } }  (era Next 15)
```

### Cache Components (`'use cache'`)

Substitui PPR. Permite misturar conteúdo estático e dinâmico:

```tsx
'use cache'
export default async function Page() { ... }
```

### Navegação Instantânea

Para client-side navigations rápidas:

```tsx
export const unstable_instant = true
```

### React Compiler ativado

- `babel-plugin-react-compiler` + `reactCompiler: true` no `next.config.ts`.
- `useMemo`, `useCallback`, `React.memo` são DESNECESSÁRIOS — Compiler otimiza.
- Anti-padrão: usar esses hooks em P8 (Sonar/revisor flagga).

### Viewport em layout.tsx

```tsx
// CORRETO
export const viewport: Viewport = { ... }

// ERRADO (Next 15)
export const metadata: Metadata = { viewport: { ... } }  // viewport removido de metadata
```

---

## Prisma 7.7

### `prisma.config.ts` (centralizado)

- Toda config em `prisma.config.ts` (já configurado em P8).
- `.env` **NÃO carrega automaticamente** — usar `import "dotenv/config"` se script standalone precisa.
- Flags `--schema` e `--url` removidos dos comandos CLI.
- URLs SQLite resolvem relativo ao `prisma.config.ts`, não ao `schema.prisma`.

### Driver Adapters obrigatórios

Em P8, usa **PrismaNeon** (WebSocket Pool):

```ts
import { PrismaNeon } from "@prisma/adapter-neon";
const adapter = new PrismaNeon({ connectionString: url }, {});
const prisma = new PrismaClient({ adapter });
```

- **PrismaNeon** (WebSocket Pool) — suporta transações (`createMany`, `$transaction`).
- **PrismaNeonHttp** (HTTP) — NÃO suporta transações; não usar.
- [src/lib/db.ts](../../../src/lib/db.ts) usa Lazy Proxy: conexão só no primeiro acesso, evita conectar durante build.

### Generator novo (`prisma-client`)

```prisma
generator client {
  provider     = "prisma-client"          // novo
  output       = "../src/generated/prisma"
  runtime      = "nodejs"
  moduleFormat = "esm"
}
```

- Cliente em `src/generated/prisma/` (gitignored).
- Import: `import { PrismaClient } from '@/generated/prisma/client'`.
- Types reexportados: `import type { CustomAlbum } from '@/generated/prisma/client'`.

### Enums com `@map`

Bug conhecido até v7.2: valores gerados em TS usam os valores mapeados, não os nomes do schema. Verificar se ainda existe na 7.7.

### Comandos comuns

```bash
npx prisma generate              # após mudar schema
npx prisma db push               # sync schema → DB (dev)
npx prisma migrate dev --name X  # migration formal (dev)
npx prisma migrate deploy        # aplicar migrations em prod
npx prisma migrate status        # checar drift
```

**Em P8:** após mudar `prisma/schema.prisma`, sempre `npx prisma generate` antes de `npm run build`.

---

## Tailwind CSS 4

- **NÃO existe** `tailwind.config.js` ou `tailwind.config.ts`.
- Config via CSS em `globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-background: #0b0e14;
  --color-foreground: #e8eaed;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

- Usa `@tailwindcss/postcss` (não `tailwindcss` como plugin PostCSS).
- Classes utilitárias funcionam igual.
- Customizações: `@theme inline { --color-X: ... }`.

---

## Zod 4

- Reescrita completa, performance 2-7x melhor.
- `z.interface()` disponível além de `z.object()`.
- Mensagens de erro reestruturadas.
- Algumas APIs de Zod 3 podem não existir ou ter assinatura diferente.
- **Sempre consultar docs atuais** antes de usar APIs Zod.

---

## React 19

- Server Components default. `'use client'` SÓ quando necessário.
- Layout raiz usa `CartProvider` e `ToastProvider` como Client Components.
- `useActionState`, `useFormStatus`, `use` (hook) disponíveis.
- Forms com Server Actions são primeira-classe.

---

## iron-session 8

```ts
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

const session = await getIronSession<SessionData>(
  await cookies(),  // NEXT 16: await
  {
    password: process.env.SESSION_PASSWORD!,  // ≥ 32 chars
    cookieName: 'p8-session',
    cookieOptions: { secure: process.env.NODE_ENV === 'production' }
  }
)
```

- **NÃO** hardcode `password`.
- **NÃO** logue `session.password`.

---

## Stripe SDK 22

### Webhook signature (CRÍTICO)

```ts
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Invalid signature', { status: 400 })
  }

  // processar event...
}
```

**Sem `constructEvent`, qualquer atacante pode forjar webhook.**

### Idempotência

- Stripe envia retries em não-200.
- Tracking de `event.id` em DB previne duplicação.
- Em P8 atual, **não há tracking** — gap conhecido.

---

## Sentry 10.49

- 3 configs: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- `instrumentation.ts` é o entry point.
- DSN em `SENTRY_DSN` env var.
- **Em P8 atual: inativo** (DSN não configurado).

---

## Vitest 4

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "node",  // P8 usa node (Prisma + Stripe), não jsdom
    setupFiles: ["./src/__tests__/setup.ts"],
  }
})
```

- `setup.ts` exporta mocks globais Prisma (18 modelos) + Stripe.
- Adicionar mock se touch em modelo novo.

---

## Comandos comuns P8

```bash
npm run dev          # Turbopack porta 3009
npm run build        # prisma generate && next build
npm run test         # Vitest
npm run lint         # Biome check
npm run lint:fix     # Biome check --write
npm run format       # Biome format --write

# Stripe CLI (testar webhooks localmente)
stripe listen --forward-to localhost:3009/api/stripe/webhook
stripe trigger checkout.session.completed
stripe logs tail

# Deploy
git add <arquivos> && git commit -m "tipo(escopo): descricao"
git push
npx vercel deploy --prod  # GATE HUMANO em P8-MASTER (Akita override)
```
