---
name: p8-master:p8-auth
description: Recupera sessão autenticada do P8-FigurinhasPro quando outra skill (tipicamente ui-review) bate em /login?reason=session-expired ou em rota /painel/* sem cookie válido. Em preview/dev local usa endpoint /api/dev/auto-login (triple-guard, opt-in via env DEV_AUTO_LOGIN_TOKEN). Em produção, pausa o fluxo e pede login manual ao user no Chrome conectado — nunca tenta digitar senha. Auto-ativa quando uma navegação dentro de qualquer skill p8-master retorna 302 para /login, ou quando o user diz "logue antes", "auth primeiro", "sessão expirou", "logue lá", "bootstrap auth", "renove sessão".
argument-hint: "[url alvo] (opcional — se omitida, mantém URL atual após login)"
---

Vou garantir sessão autenticada antes do fluxo da skill chamadora prosseguir.

## Por que essa skill existe

A skill irmã `ui-review` (e qualquer outra que use `/chrome`) trava quando `/painel/*` redireciona pra `/login?reason=session-expired`. Antes, a saída era pedir login manual ao user em toda sessão — fricção alta, especialmente em iteração rápida.

Esta skill resolve isso **sem violar duas regras duras**:
1. **Nunca digito senha em formulário em nome do user** (regra de segurança global).
2. **Nenhuma credencial em chat ou commitada em código** (regra de segurança global).

Em vez disso, em ambientes **não-produção**, uso um endpoint dev-only (`/api/dev/auto-login`) com token opt-in via env var do shell — o token concede sessão por redirect, sem digitar senha. Em produção, o endpoint não existe (triple-guard retorna 404) e eu **pauso e peço login manual**, mantendo a regra.

## Pré-condições

1. **`/chrome` conectado** com tab válido. Se não, falo pra ativar.
2. **Browser está no estado "session expirada"** (URL atual contém `/login` ou `reason=session-expired`). Se já está autenticado em `/painel/*`, **não faço nada** — não invento auth onde não falta.

## Detecção de ambiente

Leio `tabs_context_mcp` e classifico a URL atual:

| Padrão de host | Modo | Estratégia |
|---|---|---|
| `localhost:3009` | local-dev | auto-login via token |
| `*-album-digital-*.vercel.app` (preview Vercel) | preview | auto-login via token |
| `album-digital-ashen.vercel.app` (alias prod) | **prod** | pausa + pede login manual |
| qualquer outro host | prod (assume) | pausa + pede login manual |

A diferenciação preview vs prod é puramente pelo host — não confio em query string nem cookie.

## Caminho A: auto-login (local/preview)

### Requisitos (peço ao user antes de tentar)

Skill precisa **env vars no shell que rodou `claude`**:

- `P8_DEV_AUTO_LOGIN_TOKEN` (obrigatório em qualquer ambiente que não-prod) — bate com `DEV_AUTO_LOGIN_TOKEN` configurado no app (`.env.local` ou Vercel env preview). Gerado com `openssl rand -hex 32`.
- `P8_DEV_AUTO_LOGIN_EMAIL` (opcional) — email do seller alvo. Default: primeiro Seller do banco.
- `P8_VERCEL_BYPASS_TOKEN` (obrigatório SÓ se host é preview Vercel `*-album-digital-*.vercel.app`) — Protection Bypass for Automation gerado no Vercel Dashboard → Project Settings → Deployment Protection. Sem ele, preview retorna 401 antes de chegar no Next.js (Vercel SSO Protection bloqueia).

Verifico via `process.env.*` (chamada Bash curtíssima: `echo ${#P8_DEV_AUTO_LOGIN_TOKEN}` — só comprimento, sem ecoar valor).

Se `P8_DEV_AUTO_LOGIN_TOKEN` ausente, **caio pro Caminho B** (pede login manual) e aviso o user como configurar.

Se host é preview Vercel E `P8_VERCEL_BYPASS_TOKEN` ausente, **também caio pro Caminho B** com mensagem específica:
> Preview Vercel tem SSO Protection ativo. Configure `P8_VERCEL_BYPASS_TOKEN` no shell antes de invocar p8-auth. Ver `docs/dev-auto-login.md` seção "Vercel SSO bypass".

### Execução

1. Capturo URL alvo: `$ARGUMENTS` se fornecido, senão a URL pré-redirect (extraio do path do `/login?next=...` se presente, ou uso `/painel`).
2. Detecto se é preview Vercel pelo host pattern (`*-album-digital-*.vercel.app` mas NÃO `album-digital-ashen.vercel.app` que é prod alias).
3. Monto URL conforme ambiente:
   - **localhost ou preview com bypass:**
     ```
     <base>/api/dev/auto-login?token=<DEV_AUTO_LOGIN_TOKEN>&next=<urlEncoded(alvo)>
     ```
     + acrescento `&x-vercel-protection-bypass=<VERCEL_BYPASS>&x-vercel-set-bypass-cookie=true` SE host é preview Vercel.
   - **localhost** (sem Vercel SSO): só os params base.

   O param `x-vercel-set-bypass-cookie=true` setá cookie persistente — requests subsequentes na mesma sessão browser passam direto sem precisar do bypass query.

4. `navigate(url=<URL completa>, tabId=<tab atual>)`.
5. Espero 2s.
6. Confirmo sucesso lendo URL atual — deve estar em `<alvo>` (não em `/login` nem em página de Vercel SSO).
7. Devolvo controle pra skill chamadora.

### Segurança operacional

- **Tokens aparecem na URL no transcript da sessão.** Aceitável porque (a) triple-guard do endpoint `/api/dev/auto-login` impede uso em prod, (b) Vercel bypass token é per-project e rotacionável, (c) skill explicitamente avisa o user pra rotacionar periodicamente.
- **Não loggo tokens em mensagem texto.** Só passo via parâmetro do `navigate`.
- **Não armazeno tokens em arquivo.** Lê do env var a cada execução.
- **Rotação recomendada**: ambos tokens (DEV_AUTO_LOGIN e VERCEL_BYPASS) a cada 30 dias ou após qualquer suspeita de leak (transcripts compartilhados, screenshots de browser bar).

## Caminho B: pausa + login manual (produção)

1. Anuncio em mensagem clara:
   > Sessão expirou em **produção** (`<host>`). Auto-login só funciona em preview/dev. Logue manualmente no Chrome conectado (P8-PAGE) e me avise com "logado" ou "ok" pra retomar.
2. **NÃO** tento `navigate` pra `/login`, `find` de input, ou `type` de credenciais. Espera é responsabilidade do user.
3. Quando user confirmar, releio `tabs_context_mcp` pra ver URL atual.
4. Se URL bate com alvo (ou `/painel/*`), devolvo controle. Se ainda em `/login`, repito mensagem (max 2 vezes, depois reporto bloqueio).

## Quando NÃO disparar

- Skill chamadora está testando **fluxo de login em si** (`/login`, recuperação de senha, signup) — auto-login mascararia bug.
- Página alvo é pública (`/`, `/loja/[slug]`, `/privacidade`, `/termos`). Sessão não é necessária — pular auth check economiza tempo.
- User explicitamente disse "não autentique", "testa sem login", "como visitante".

## Output

Retorno enxuto pra skill chamadora (não consome contexto desnecessário):

```
[p8-auth] modo=<local|preview|prod> resultado=<ok|manual|bloqueado>
url-pos-auth: <url final>
seller: <email se conhecido>
```

Sem screenshot. Sem accessibility tree. Skill chamadora retoma do estado já autenticado.

## Restrições

- **Não digito senha em formulário.** Nunca.
- **Não armazeno credenciais.** Token vem do shell env var, não de arquivo nem de chat.
- **Não tento auth em produção via código.** Só pauso e peço manual.
- **Não opero sem `/chrome`.** Esta skill depende do tool `mcp__claude-in-chrome__navigate` + `tabs_context_mcp`. Sem `/chrome`, falho com mensagem clara.
- **Não rodo `npm run dev`.** Skill chamadora cuida disso (ui-review já faz). Se localhost:3009 não responde, devolvo erro pra ela decidir.

## Modelo recomendado

- **Haiku é suficiente** — é roteamento determinístico (detecta URL, monta call, espera). Sem síntese cognitiva. Sonnet ok se invocado a partir de sessão Sonnet/Opus.

## Ver também

- [docs/dev-auto-login.md](../../../../../docs/dev-auto-login.md) — implementação do endpoint, env vars, triple-guard
- [skills/ui-review/SKILL.md](../ui-review/SKILL.md) — principal consumidor
- [references/auth-strategy.md](../../references/auth-strategy.md) — fluxo end-to-end + decisão arquitetural
