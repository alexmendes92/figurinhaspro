# Auto-login dev-only (`/api/dev/auto-login`)

Endpoint para bootstrap de sessão `iron-session` em **preview** e **dev local**, usado pela skill `p8-master:p8-auth` para validação visual automatizada (`/p8-master:ui-review`) sem exigir login manual a cada sessão.

## Triple-guard de segurança

O endpoint só responde quando **todas** as três condições batem:

1. `process.env.VERCEL_ENV !== "production"` (Vercel envs preview/development ou local).
2. `process.env.DEV_AUTO_LOGIN_TOKEN` setado e com ≥32 caracteres.
3. Query `?token=` bate exatamente com o valor da env var.

Falha em qualquer guard → **404** silencioso (preserva indistinguibilidade entre "rota não existe" e "auth falhou"). Token enviado mas errado → **401**.

## Configuração

### Local (`.env.local`)

Adicionar (manualmente — `.env*` é sensível):

```bash
# Gerar com: openssl rand -hex 32
DEV_AUTO_LOGIN_TOKEN=COLE_AQUI_O_HEX_DE_32_BYTES
```

### Preview (Vercel project `album-digital`)

```bash
npx vercel env add DEV_AUTO_LOGIN_TOKEN preview
# cole o valor quando perguntado
```

**Nunca adicionar em `production`.** O endpoint já bloqueia via `VERCEL_ENV`, mas o token na env de prod expande superfície de ataque sem ganho.

### `.env.example`

Adicionar para documentar o opt-in (sem valor real):

```bash
# Auto-login dev-only — gere com: openssl rand -hex 32
# DEV_AUTO_LOGIN_TOKEN=
```

## Uso

```
GET /api/dev/auto-login?token=<token>&email=<seller>&next=<path>
```

- `token` (obrigatório): valor de `DEV_AUTO_LOGIN_TOKEN`.
- `email` (opcional): seller alvo. Default: primeiro Seller por `createdAt asc`.
- `next` (opcional): path interno para redirect pós-login. Default: `/painel`. Open-redirect bloqueado — só aceita paths que começam com `/` e não `//`.

Resposta:
- **302** `Location: <next>` + `Set-Cookie: fp_session=...` quando autorizado.
- **404** se algum guard falhar (prod, env var ausente, seller não encontrado).
- **401** se token enviado mas incorreto.

## Auditoria

Toda chamada bem-sucedida loga em stdout (capturado por Vercel Logs):

```
[dev-auto-login] vercelEnv=preview sellerId=clxxx email=x@y.com next=/painel/estoque
```

## Implementação

- Lógica pura: `src/app/api/dev/auto-login/handler.ts` (`evaluateAutoLogin()`).
- Wrapper Next 16: `src/app/api/dev/auto-login/route.ts` (GET).
- Testes: `src/app/api/dev/auto-login/handler.test.ts` (8 casos).
- Env schema: `src/lib/env.ts` — `DEV_AUTO_LOGIN_TOKEN` z.string().min(32).optional().

## Quando NÃO usar

- **Produção**: nunca. Endpoint retorna 404 mesmo se chamado.
- **Testes automatizados de auth**: use o flow real (`/api/auth/login` com bcrypt) — esse endpoint pula validação, então mascara bugs do login real.
- **Compartilhar token com terceiros**: o token concede acesso total ao painel admin via redirect. Trate como password.
