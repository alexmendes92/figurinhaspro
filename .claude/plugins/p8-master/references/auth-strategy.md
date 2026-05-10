# Auth strategy — p8-master plugin

> Como o plugin lida com sessão autenticada quando skills precisam tocar `/painel/*` do P8-FigurinhasPro via `/chrome` (Claude in Chrome) ou Playwright fallback.

## Decisão arquitetural (2026-05-10)

Pedido original: "todas as skills têm credencial pra acessar o site quando quiser".

Pedido literal não é entregável por **duas regras duras** que não negocio:

1. **Sistema global**: nunca digito senha em formulário em nome do user.
2. **CLAUDE.md global**: nenhuma credencial em chat, env de chat, ou arquivo commitado.

Caminho adotado: **Opção C — auto-login dev + bootstrap manual prod**.

| Ambiente | Estratégia | Skill responsável |
|---|---|---|
| `localhost:3009` (dev local) | Endpoint `/api/dev/auto-login` + token shell-env | `p8-auth` Caminho A |
| Vercel preview (`*-album-digital-*.vercel.app`) | Endpoint `/api/dev/auto-login` + token shell-env | `p8-auth` Caminho A |
| Vercel prod (`album-digital-ashen.vercel.app`, custom domain) | Pausa + login manual do user no Chrome | `p8-auth` Caminho B |

## Componentes

### Lado app (P8-FigurinhasPro)

- **`src/app/api/dev/auto-login/handler.ts`** — função pura `evaluateAutoLogin()` aplica triple-guard.
- **`src/app/api/dev/auto-login/route.ts`** — wrapper Next 16 GET. Resolve seller, chama `createSession`, redirect 302.
- **`src/lib/env.ts`** — campo `DEV_AUTO_LOGIN_TOKEN: z.string().min(32).optional()`.
- **`src/app/api/dev/auto-login/handler.test.ts`** — 8 testes cobrem matriz de guards + open-redirect.
- **`docs/dev-auto-login.md`** — manual de configuração e uso.

### Lado plugin (p8-master)

- **`skills/p8-auth/SKILL.md`** — detecta `/login` ou `reason=session-expired`, escolhe caminho A vs B.
- **`skills/ui-review/SKILL.md`** — invoca `p8-auth` na pré-condição #4 quando rota é `/painel/*` e auth falhou.
- **`references/auth-strategy.md`** — este documento.

## Triple-guard (por que prod fica fora)

O endpoint só responde quando **todas as três** condições batem:

```typescript
// handler.ts evaluateAutoLogin()
if (vercelEnv === "production") return { kind: "not-found" };
if (!expectedToken) return { kind: "not-found" };
if (providedToken !== expectedToken) return { kind: "unauthorized" };
```

Resultado:

- **Vercel prod** (`VERCEL_ENV=production`): retorna 404 mesmo se token correto for enviado. Defense in depth.
- **Vercel preview** sem env var setada: 404. Token precisa ser ativamente provisionado.
- **Local sem `.env.local`** com a var: 404. Default seguro.

Indistinguibilidade entre "endpoint não existe" e "auth falhou" é proposital — não vaza informação sobre o ambiente para um atacante.

## Open-redirect mitigation

`sanitizeNextPath()` em `handler.ts` rejeita:

- `nextPath` que não começa com `/` (URL absoluta).
- `nextPath` que começa com `//` (protocol-relative).

Cobertos por 2 testes específicos. Default: `/painel`.

## Env vars (resumo)

### App (Vercel)

| Var | Onde | Quando |
|---|---|---|
| `DEV_AUTO_LOGIN_TOKEN` | `.env.local` + `vercel env add ... preview` | Sempre que usar auto-login em preview. **Nunca em production.** |

### Shell (cliente que rodou `claude`)

| Var | Default | Quando |
|---|---|---|
| `P8_DEV_AUTO_LOGIN_TOKEN` | nenhum | Sem ela, `p8-auth` cai para Caminho B (manual) |
| `P8_DEV_AUTO_LOGIN_EMAIL` | primeiro Seller por createdAt | Para escolher seller específico em multi-tenant |

Skill **lê do shell, não do chat**. Token nunca passa por mensagem do user.

## Rotação de token

Recomendação operacional:

- Trocar `DEV_AUTO_LOGIN_TOKEN` a cada **30 dias** ou após qualquer suspeita de leak (transcripts compartilhados, screenshots de browser bar, etc.).
- Comando: `openssl rand -hex 32` → atualiza local + `vercel env rm` + `vercel env add`.
- Skill `p8-auth` aceita rotação transparente — usa a var no momento da chamada.

## Por que NÃO outras abordagens

- **Magic link por email**: exige caixa de email integrada com skill, complexidade alta, sem ganho prático.
- **API key custom no header**: `navigate` do `/chrome` não permite headers customizados.
- **Cookie pré-injetado via JS**: contorna iron-session, exige replicar HMAC do `SESSION_SECRET` em código, frágil.
- **Skill que digita senha**: viola regra global, será recusado em runtime mesmo se construído.
- **Login social (Google/GitHub) OAuth**: requer interação manual idêntica ao Caminho B atual.

## Auditoria

Toda chamada bem-sucedida loga em stdout do Vercel:

```
[dev-auto-login] vercelEnv=preview sellerId=clxxx email=x@y.com next=/painel/estoque
```

Filtrável via `vercel logs --output raw | grep dev-auto-login`. Recomendado revisão semanal em preview.

## Quando reabrir essa decisão

- Se Anthropic publicar API oficial para Claude Code injetar cookies pré-existentes no `/chrome` sem navegar — torna endpoint dev-only redundante.
- Se P8 adicionar magic-link nativo — passa a ser preferível em prod.
- Se equipe crescer e múltiplos devs precisarem do token — virar SSO/short-lived JWT pode fazer sentido.
