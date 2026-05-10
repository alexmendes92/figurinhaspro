# Sentry Setup — referência P8-FigurinhasPro

> Status atual: Sentry **configurado mas inativo**. DSN é opcional em `src/lib/env.ts`. Esta doc cobre como ativar e validar.

---

## Arquivos atuais

P8 já tem 4 arquivos Sentry pré-configurados (gerados pelo wizard `@sentry/nextjs`):

1. **`instrumentation.ts`** — Next.js 15+ instrumentation hook
   ```ts
   export async function register() {
     if (process.env.NEXT_RUNTIME === "nodejs") {
       await import("./sentry.server.config")
     }
     if (process.env.NEXT_RUNTIME === "edge") {
       await import("./sentry.edge.config")
     }
   }
   ```

2. **`sentry.client.config.ts`** — config browser (Replay, Performance)

3. **`sentry.server.config.ts`** — config server (Node.js runtime)

4. **`sentry.edge.config.ts`** — config edge runtime (proxy.ts, futuro)

5. **`next.config.ts`** wrappa com `withSentryConfig`:
   ```ts
   import { withSentryConfig } from "@sentry/nextjs"
   const nextConfig = { /* ... */ }
   export default withSentryConfig(nextConfig, { /* options */ })
   ```

---

## Env vars

| Var | Obrigatória? | Descrição |
|---|---|---|
| `SENTRY_DSN` | **Opcional hoje, deveria ser obrigatória em prod** | DSN do projeto Sentry |
| `SENTRY_AUTH_TOKEN` | Build-time only | Token pra upload de source maps |
| `SENTRY_ORG` | Build-time | Org slug Sentry |
| `SENTRY_PROJECT` | Build-time | Project slug Sentry |
| `SENTRY_LOG_LEVEL` | Opcional | `debug` em desenvolvimento |

---

## Por que está inativo

`src/lib/env.ts` define `SENTRY_DSN` como opcional:
```ts
// schema atual (deveria ser strict em prod)
SENTRY_DSN: z.string().optional()
```

Sem DSN setada na Vercel, `Sentry.init()` recebe `undefined` e pula tudo silentemente.

---

## Como ativar (passo-a-passo)

### 1. Criar projeto Sentry

- Login em https://sentry.io
- Create Project → Platform: Next.js
- Copiar DSN (formato: `https://abc123@o123456.ingest.sentry.io/789012`)
- Copiar Auth Token (Settings → Auth Tokens)

### 2. Adicionar env vars na Vercel

```bash
vercel env add SENTRY_DSN production
# Cola DSN

vercel env add SENTRY_AUTH_TOKEN production
# Cola token (build-time only, mas Vercel precisa ter)

vercel env add SENTRY_ORG production
# Slug org

vercel env add SENTRY_PROJECT production
# Slug project
```

Para dev local:
```bash
echo "SENTRY_DSN=<dsn>" >> .env.local
```

### 3. Tornar DSN obrigatório em prod

Editar `src/lib/env.ts`:
```ts
SENTRY_DSN: process.env.NODE_ENV === "production"
  ? z.string().url()
  : z.string().url().optional(),
```

Build vai falhar se DSN ausente em prod. Bom — força configuração.

### 4. Configurar tracesSampleRate

Em `sentry.server.config.ts`:
```ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.0,
  // 10% de requests em prod com traces de performance
  // 0% em dev pra não spam
})
```

### 5. Source maps upload

`next.config.ts`:
```ts
withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  hideSourceMaps: true,  // produção não expõe source maps
  disableLogger: true,
})
```

Build-time: Sentry CLI faz upload das source maps pro projeto Sentry. Sem isso, stack traces em prod ficam minificados.

---

## Como validar (smoke test)

Use `/p8-master:p8-sentry-health --smoke` ou manualmente:

### 1. Criar endpoint de teste

```ts
// src/app/api/sentry-test/route.ts
import * as Sentry from "@sentry/nextjs"

export async function GET() {
  try {
    throw new Error("Sentry smoke test — pode ignorar")
  } catch (e) {
    Sentry.captureException(e)
    throw e
  }
}
```

### 2. Disparar erro

```bash
# Local (com SENTRY_DSN em .env.local)
curl http://localhost:3009/api/sentry-test

# Prod (após deploy)
curl https://album-digital-ashen.vercel.app/api/sentry-test
```

### 3. Verificar captura

- Sentry dashboard → Issues → procurar `Error: Sentry smoke test`
- Deve aparecer em < 1 minuto
- Stack trace deve estar legível (não minificado se source maps OK)

### 4. Cleanup (opcional)

Após confirmar captura, remover `/api/sentry-test/route.ts`.

---

## Tags úteis

Adicionar em `sentry.server.config.ts`:
```ts
Sentry.init({
  // ...
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      runtime: process.env.NEXT_RUNTIME,
      vercel_env: process.env.VERCEL_ENV,
    }
    return event
  },
})
```

Depois, em código:
```ts
Sentry.setUser({ id: seller.id })
Sentry.setTag("plan", seller.plan)
Sentry.setTag("seller_email", seller.email)
```

Ajuda a filtrar por usuário/plano em produção.

---

## Performance Monitoring

Tracing automático em Next 16:
- Transactions: cada request HTTP
- Spans: queries Prisma, fetch externos, Stripe API
- Web Vitals: LCP, FID, CLS

Custo: 10% sample em prod = ~10k traces/mês free tier. Subir pra 0.5 ou 1.0 só se necessário (caro).

---

## Replay (Browser only)

`sentry.client.config.ts`:
```ts
Sentry.init({
  // ...
  replaysOnErrorSampleRate: 1.0,  // 100% sessions com erro
  replaysSessionSampleRate: 0.0,  // 0% sessions normais
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
```

Replay grava DOM mutations + network + console. Útil pra debugar UX errors.

---

## Alertas

Configurar em Sentry → Alerts:

| Trigger | Severidade | Notificação |
|---|---|---|
| Error spike (>20 erros/min) | P0 | Email + Slack |
| Performance degradation (P95 > 3s) | P1 | Slack |
| New error type | P2 | Email |

---

## Versão

P8 usa `@sentry/nextjs@^10.49`. Verificar release notes ao bumpar:
https://github.com/getsentry/sentry-javascript/releases

Breaking changes comuns:
- v9 → v10: instrumentation hook obrigatório
- v8 → v9: tracesSampler API mudou

---

## Ver também

- [skills/p8-sentry-health/SKILL.md](../skills/p8-sentry-health/SKILL.md)
- [P8-FigurinhasPro/instrumentation.ts](../../../instrumentation.ts) (verificar existência)
- [P8-FigurinhasPro/sentry.client.config.ts](../../../sentry.client.config.ts)
- [P8-FigurinhasPro/sentry.server.config.ts](../../../sentry.server.config.ts)
