# Launch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Endurecer configuração de produção do FigurinhasPro para que o boot em Vercel falhe explicitamente quando variáveis críticas (Stripe, Sentry, Admin) estiverem ausentes, e adicionar SEO técnico mínimo (robots, sitemap, ícones, OG image).

**Architecture:** Centraliza validação de env vars em `src/lib/env.ts` usando Zod com `superRefine` condicional a `NODE_ENV === "production"`. Refatora consumidores (`src/lib/admin.ts`) para lerem do módulo validado em vez de `process.env` cru. Adiciona `robots.ts` e `sitemap.ts` como route handlers do App Router (Next.js 16). Gera favicon/OG estáticos servidos como `icon.png`, `apple-icon.png`, `opengraph-image.png` em `src/app/`.

**Tech Stack:** Next.js 16.2.4 App Router, Zod 4.3, TypeScript strict, Vercel deploy.

**Project rules:** Após cada commit, rodar `npx vercel deploy --prod` (regra inviolável do `CLAUDE.md`). Deploy faz parte da task.

---

### Task 1: Endurecer `src/lib/env.ts` com vars de produção obrigatórias

**Files:**
- Modify: `src/lib/env.ts`

**Context:** Hoje `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` são `.optional()` e `SENTRY_DSN` + `ADMIN_EMAIL` nem aparecem no schema. Risco: app sobe em prod sem Stripe/Sentry/admin e falha silencioso.

- [ ] **Step 1: Substituir o conteúdo de `src/lib/env.ts`**

Substituir o arquivo inteiro pelo código abaixo:

```ts
import { z } from "zod";

const baseSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatório")
    .startsWith("postgres", "DATABASE_URL deve começar com 'postgres'"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter pelo menos 32 caracteres"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMAGES_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const prodSchema = baseSchema.extend({
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY deve começar com 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET deve começar com 'whsec_'"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL obrigatório em produção"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL obrigatório em produção"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url("NEXT_PUBLIC_SENTRY_DSN obrigatório em produção"),
});

type Env = z.infer<typeof baseSchema>;

function validateEnv(): Env {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    return {
      DATABASE_URL: process.env.DATABASE_URL || "",
      SESSION_SECRET:
        process.env.SESSION_SECRET || "dev-secret-must-be-at-least-32-characters-long!",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_IMAGES_BASE_URL: process.env.NEXT_PUBLIC_IMAGES_BASE_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    };
  }

  const result = prodSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`\n⚠️  Variáveis de ambiente inválidas:\n${errors}\n`);
  }

  return result.data;
}

export const env = validateEnv();
```

- [ ] **Step 2: Validar tipos e build**

Executar em sequência:

```bash
npx tsc --noEmit
npm run build
```

Esperado: zero erros de tipo. Build completa com sucesso (porque estamos em dev local, `isDev === true`, schema permissivo).

- [ ] **Step 3: Validar comportamento do schema prod localmente**

Criar temporariamente `scripts/test-prod-env.mjs` com:

```js
process.env.NODE_ENV = "production";
process.env.DATABASE_URL = "postgres://user:pass@host/db";
process.env.SESSION_SECRET = "abcdefghijklmnopqrstuvwxyz123456";
// Propositalmente SEM Stripe/Sentry/Admin
try {
  await import("../src/lib/env.ts");
  console.log("ERRO: schema não validou prod corretamente");
  process.exit(1);
} catch (e) {
  console.log("OK: schema bloqueou boot. Mensagem:\n", e.message);
}
```

Executar:

```bash
npx tsx scripts/test-prod-env.mjs
```

Esperado: saída inclui "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "ADMIN_EMAIL", "NEXT_PUBLIC_SENTRY_DSN" como `Required`.

- [ ] **Step 4: Remover script de validação temporária**

```bash
rm scripts/test-prod-env.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts
git commit -m "feat(env): valida STRIPE_*, ADMIN_EMAIL, SENTRY_DSN como obrigatórios em prod"
git push
npx vercel deploy --prod
```

Esperado: deploy completa. Se vars não estiverem setadas no Vercel, deploy falha — nesse caso configurar via `vercel env add` e redeployar.

---

### Task 2: Refatorar `src/lib/admin.ts` para consumir `env.ts`

**Files:**
- Modify: `src/lib/admin.ts`

**Context:** Hoje lê `process.env.ADMIN_EMAIL` direto. Depois da Task 1, a fonte de verdade é `env.ADMIN_EMAIL`.

- [ ] **Step 1: Substituir conteúdo de `src/lib/admin.ts`**

```ts
import { env } from "@/lib/env";

export function isAdmin(email: string): boolean {
  const adminEmail = env.ADMIN_EMAIL?.trim();
  if (!adminEmail && process.env.NODE_ENV !== "production") return true;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}
```

- [ ] **Step 2: Buscar outros consumidores de `process.env.ADMIN_EMAIL`**

```bash
grep -rn "process.env.ADMIN_EMAIL" src/
```

Esperado: nenhum resultado fora de `admin.ts`. Se aparecer, refatorar cada um para usar `env.ADMIN_EMAIL`.

- [ ] **Step 3: Validar build**

```bash
npm run build
```

Esperado: build completa.

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin.ts
git commit -m "refactor(admin): lê ADMIN_EMAIL do schema Zod validado"
git push
npx vercel deploy --prod
```

---

### Task 3: Criar `src/app/robots.ts` e `src/app/sitemap.ts`

**Files:**
- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`

**Context:** Next.js 16 permite route handlers metadata-style pra gerar `/robots.txt` e `/sitemap.xml`. Bloquear indexação de `/painel/*`, `/api/*`, `/onboarding`, rotas auth. Liberar public + institutional.

- [ ] **Step 1: Criar `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://album-digital-ashen.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/loja", "/privacidade", "/termos"],
        disallow: ["/painel", "/api", "/onboarding", "/login", "/registro", "/reset-senha", "/verificar-email"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Criar `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://album-digital-ashen.vercel.app";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/termos`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
```

> **Nota:** quando o Plano B (conteúdo institucional) incluir `/sobre`, `/contato`, `/faq`, este arquivo deve ser atualizado para incluí-los. Marcar como follow-up no Plano B Task 4.

- [ ] **Step 3: Validar build**

```bash
npm run build
```

Esperado: build completa sem erro de tipo.

- [ ] **Step 4: Validar rotas em dev**

```bash
npm run dev
```

Em outro terminal:

```bash
curl -s http://localhost:3009/robots.txt
curl -s http://localhost:3009/sitemap.xml
```

Esperado:
- robots.txt contém `User-Agent: *`, `Disallow: /painel`, `Sitemap: https://...`
- sitemap.xml é XML válido com 3 URLs

Parar o dev server (Ctrl+C) após validar.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts src/app/sitemap.ts
git commit -m "feat(seo): adiciona robots.ts e sitemap.ts bloqueando /painel e /api"
git push
npx vercel deploy --prod
```

- [ ] **Step 6: Validar em produção**

```bash
curl -s https://album-digital-ashen.vercel.app/robots.txt
curl -s https://album-digital-ashen.vercel.app/sitemap.xml
```

Esperado: mesma resposta do dev, com `NEXT_PUBLIC_APP_URL` resolvido.

---

### Task 4: Adicionar ícones e OG image estáticos

**Files:**
- Create: `src/app/icon.png` (512x512)
- Create: `src/app/apple-icon.png` (180x180)
- Create: `src/app/opengraph-image.png` (1200x630)
- Create: `src/app/twitter-image.png` (1200x630 — pode ser o mesmo arquivo)

**Context:** Next.js 16 serve esses arquivos automaticamente em rotas `/icon.png`, `/apple-icon.png`, `/opengraph-image.png`. Não requer import — basta estar em `src/app/` na raiz.

- [ ] **Step 1: Verificar assets de design existentes**

```bash
ls docs/design-handoff-2026-04-19-v2/ 2>/dev/null || echo "sem handoff"
ls docs/design-handoff-2026-04-19/ 2>/dev/null || echo "sem handoff"
ls public/ 2>/dev/null || echo "sem public/"
```

Esperado: localizar logo atual ou decidir gerar via template.

- [ ] **Step 2: Gerar OG image programaticamente usando `opengraph-image.tsx`**

Se não houver asset visual pronto, criar `src/app/opengraph-image.tsx` (não `.png`) que gera dinamicamente via `ImageResponse`. Em Next.js 16:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FigurinhasPro — Plataforma #1 para revendedores de figurinhas";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0b0e14 0%, #1a1f2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "sans-serif",
        padding: 80,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
          fontWeight: 900,
          color: "#0b0e14",
          marginBottom: 40,
        }}
      >
        F
      </div>
      <div style={{ fontSize: 64, fontWeight: 900, textAlign: "center", marginBottom: 20 }}>
        FigurinhasPro
      </div>
      <div style={{ fontSize: 28, color: "#94a3b8", textAlign: "center", maxWidth: 900 }}>
        Plataforma #1 para revendedores de figurinhas
      </div>
    </div>,
    size,
  );
}
```

- [ ] **Step 3: Criar `src/app/twitter-image.tsx` reutilizando o mesmo design**

```tsx
export { default, size, contentType, alt } from "./opengraph-image";
```

- [ ] **Step 4: Criar `src/app/icon.tsx` (favicon 32x32)**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0b0e14",
        fontSize: 22,
        fontWeight: 900,
      }}
    >
      F
    </div>,
    size,
  );
}
```

- [ ] **Step 5: Criar `src/app/apple-icon.tsx` (180x180)**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0b0e14",
        fontSize: 120,
        fontWeight: 900,
        borderRadius: 40,
      }}
    >
      F
    </div>,
    size,
  );
}
```

- [ ] **Step 6: Remover `src/app/favicon.ico` antigo (substituído por `icon.tsx`)**

```bash
ls src/app/favicon.ico 2>/dev/null && rm src/app/favicon.ico || echo "sem favicon.ico"
```

- [ ] **Step 7: Validar build**

```bash
npm run build
```

Esperado: build completa. Next.js registra rotas `/icon`, `/apple-icon`, `/opengraph-image`, `/twitter-image`.

- [ ] **Step 8: Validar visualmente em dev**

```bash
npm run dev
```

Usar Playwright (obrigatório pelo workspace ArenaCards) para verificar:

1. `mcp__plugin_playwright_playwright__browser_navigate` → `http://localhost:3009/opengraph-image`
2. `browser_take_screenshot` → salvar como `/tmp/og.png`
3. `mcp__plugin_playwright_playwright__browser_navigate` → `http://localhost:3009/icon`
4. `browser_take_screenshot`
5. `browser_console_messages` — nenhum erro

Parar dev após validar.

- [ ] **Step 9: Commit**

```bash
git add src/app/opengraph-image.tsx src/app/twitter-image.tsx src/app/icon.tsx src/app/apple-icon.tsx
git add -u src/app/favicon.ico 2>/dev/null || true
git commit -m "feat(seo): adiciona OG image, twitter image, icon e apple-icon dinâmicos"
git push
npx vercel deploy --prod
```

- [ ] **Step 10: Validar compartilhamento em produção**

Abrir no navegador `https://www.opengraph.xyz` e testar URL `https://album-digital-ashen.vercel.app`. Esperado: preview com logo "F" dourado e título "FigurinhasPro".

---

### Task 5: Reavaliar `images.unoptimized: true` em `next.config.ts`

**Files:**
- Modify: `next.config.ts`

**Context:** `unoptimized: true` desliga Vercel Image Optimization. Precisa entender POR QUÊ foi setado antes de remover cegamente.

- [ ] **Step 1: Investigar motivo da flag**

```bash
git log -p next.config.ts | head -100
grep -rn "next/image" src/
```

Decidir:
- Se `next/image` é usado com URLs externas não cadastradas em `images.remotePatterns`, manter `unoptimized: true` OU adicionar `remotePatterns`.
- Se todo uso de imagem é `<img>` tag ou local via `public/`, remover a flag.

- [ ] **Step 2A: Se removível, atualizar `next.config.ts`**

```ts
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
```

- [ ] **Step 2B: Se não removível, configurar `remotePatterns` em vez de `unoptimized`**

Exemplo (ajustar hostnames ao uso real):

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "files.stripe.com" },
      // adicionar outros hosts usados em <Image src="..." />
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
};
```

- [ ] **Step 3: Validar build**

```bash
npm run build
```

Esperado: build completa. Zero warnings sobre `Image` com `remotePatterns` faltando.

- [ ] **Step 4: Validar visualmente em dev**

```bash
npm run dev
```

Usar Playwright:
1. `browser_navigate` → `http://localhost:3009/` (landing)
2. `browser_take_screenshot` — confirmar que imagens carregam
3. `browser_console_messages` — procurar erros "hostname not configured"

Parar dev.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts
git commit -m "perf(next): remove images.unoptimized e configura remotePatterns"
# (ou "chore(next): documenta images.unoptimized intencional — motivo X")
git push
npx vercel deploy --prod
```

- [ ] **Step 6: Validar em produção**

Abrir `https://album-digital-ashen.vercel.app/` no navegador e inspecionar requisições de imagem. Esperado: URLs passam por `/_next/image?url=...` (otimizado) ou continuam como originais (caso `unoptimized` tenha sido mantido intencionalmente).

---

## Critérios de conclusão do plano

- [ ] `src/lib/env.ts` bloqueia boot de produção sem Stripe/Sentry/Admin
- [ ] `src/lib/admin.ts` consome `env` validado
- [ ] `robots.txt` e `sitemap.xml` disponíveis em produção, com `/painel` e `/api` bloqueados
- [ ] `/opengraph-image`, `/icon`, `/apple-icon` retornam PNGs válidos
- [ ] Preview social (Open Graph validator externo) mostra logo e título corretos
- [ ] `next.config.ts` com decisão documentada sobre `images.unoptimized`
- [ ] 5 commits em `master`, 5 deploys em produção
