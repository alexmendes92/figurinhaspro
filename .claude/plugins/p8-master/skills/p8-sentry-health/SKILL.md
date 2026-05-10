---
name: p8-master:p8-sentry-health
description: Auto-ativa quando o usuário pedir pra ativar/validar Sentry no P8-FigurinhasPro (gap conhecido — instrumentation existe mas DSN é opcional, não testado). Lê `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. Dispara erro de teste, confere captura. Reporta dashboard URL.
argument-hint: "[--smoke pra disparar erro de teste, --report pra só auditar]"
---

Vou auditar saúde do Sentry em P8-FigurinhasPro: $ARGUMENTS

**Contexto:** Sentry está configurado mas inativo:
- 4 arquivos existem: `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- DSN é **opcional** em `src/lib/env.ts` — sem DSN, Sentry não captura nada
- Endpoint de webhook do Sentry **não foi testado em prod**

## Modos

### Mode 1: `--report` (default)

Audita instalação sem disparar erro real.

1. **Spawn `extrator` (Haiku)** pra ler:
   - `instrumentation.ts` — registra integrations
   - `sentry.client.config.ts` — config browser
   - `sentry.server.config.ts` — config server
   - `sentry.edge.config.ts` — config edge runtime
   - `src/lib/env.ts` — schema do `SENTRY_DSN`

2. **Validar estrutura:**
   - `instrumentation.ts` exporta `register()` corretamente?
   - DSN é lido de env? `Sentry.init({ dsn: process.env.SENTRY_DSN })`
   - `tracesSampleRate` configurado?
   - `replaysOnErrorSampleRate` (client) configurado?
   - Source maps upload configurado em `next.config.ts` via `withSentryConfig`?

3. **Validar env vars:**
   - `SENTRY_DSN` presente? (mascarado)
   - Em scope `Production` na Vercel?
   - DSN apontando pra projeto Sentry correto?
   - `SENTRY_AUTH_TOKEN` (build-time, source maps upload) presente?

4. **Relatório:**

| Componente | Status |
|---|---|
| `instrumentation.ts` | ✅ presente / ❌ ausente |
| `sentry.client.config.ts` | ... |
| `sentry.server.config.ts` | ... |
| `sentry.edge.config.ts` | ... |
| `SENTRY_DSN` em prod | ✅ definido / ⚠️ ausente / 🔴 mock |
| `SENTRY_AUTH_TOKEN` build | ✅ / ❌ |
| `withSentryConfig` em next.config.ts | ✅ / ❌ |
| `tracesSampleRate` | 0.1 / 0.0 / undefined |
| `replaysOnErrorSampleRate` | ... |

5. **Gaps detectados:**
   - "DSN ausente em prod → erros não capturados"
   - "tracesSampleRate=0.0 → performance não monitorada"
   - "Source maps não uploaded → stack trace minificado"
   - etc.

6. **Recomendação:**
   - Se DSN falta: "Setup conta Sentry → adicionar `SENTRY_DSN` em prod"
   - Se setup OK mas não testado: "Rodar `--smoke` pra disparar erro de teste"
   - Se tudo OK: "Sentry ativo. Próximo: revisar dashboard + alertas"

### Mode 2: `--smoke`

Dispara erro de teste e valida captura.

**Pré-condição:** `--report` retornou tudo verde.

1. **Cria endpoint de teste** (se ainda não existir):
   ```ts
   // src/app/api/sentry-test/route.ts
   import * as Sentry from "@sentry/nextjs"
   export async function GET() {
     try { throw new Error("Sentry smoke test — pode ignorar") }
     catch (e) { Sentry.captureException(e); throw e }
   }
   ```

2. **Dispara via curl:**
   ```bash
   curl https://album-digital-ashen.vercel.app/api/sentry-test
   ```

3. **Aguarda 30s** (Sentry tem latência de ingestão).

4. **Verifica captura via Sentry API:**
   ```bash
   curl https://sentry.io/api/0/projects/<org>/<project>/events/ \
        -H "Authorization: Bearer $SENTRY_API_TOKEN"
   ```
   - Procura evento com `message: "Sentry smoke test"` nos últimos 5min
   - Confere stack trace presente
   - Confere release tag bate com SHA do commit

5. **Reportar:**
   - ✅ "Erro capturado em Sentry. Dashboard: https://sentry.io/.../events/<id>/"
   - ❌ "Erro NÃO capturado. Possíveis causas: DSN errado, network bloqueado, sample rate=0"

6. **Cleanup (opcional):** remover `/api/sentry-test/route.ts` após smoke (gera diff a aprovar).

## Após smoke verde

Sugerir próximos passos:
1. Configurar alertas no Sentry (P0/P1/P2 → Slack/Email)
2. Adicionar tags úteis: `seller_id`, `plan`, `env`
3. Configurar `tracesSampleRate` apropriado (0.1 para começar)
4. Source maps upload em build (verificar `withSentryConfig`)
5. Integrar com `/p8-master:lessons-audit` — erros recorrentes em Sentry viram propostas

## Restrições

- **Não habilita Sentry em prod sem aprovação humana** (env var DSN é decisão).
- **Smoke test cria endpoint temporário.** Cleanup ofereceria mas humano confirma.
- **Não vaza DSN.** DSN é mascarado em qualquer output (`https://***@o123.ingest.sentry.io/456`).
- **Não captura erros do plugin no Sentry do P8.** Plugin tem state local separado.

## Modelo recomendado

- **Main session: Sonnet** — auditoria estrutural + smoke test.
- **Sub-agent: `extrator`** (Haiku) — leitura dos arquivos de config.

## Ver também

- [references/sentry-setup.md](../../references/sentry-setup.md) — convenções P8
- [P8-FigurinhasPro/instrumentation.ts](../../../../instrumentation.ts) (verificar existência)
- [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) — seção Monitoring
- [skills/lessons-audit/SKILL.md](../lessons-audit/SKILL.md) — integração futura com Sentry
