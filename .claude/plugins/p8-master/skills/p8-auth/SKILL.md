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

Skill precisa **duas env vars no shell que rodou `claude`**:

- `P8_DEV_AUTO_LOGIN_TOKEN` — bate com `DEV_AUTO_LOGIN_TOKEN` configurado no app (`.env.local` ou Vercel env preview). Gerado com `openssl rand -hex 32`.
- `P8_DEV_AUTO_LOGIN_EMAIL` (opcional) — email do seller alvo. Default: primeiro Seller do banco.

Verifico via `process.env.P8_DEV_AUTO_LOGIN_TOKEN` (chamada Bash curtíssima: `echo $env:P8_DEV_AUTO_LOGIN_TOKEN | wc -c`, sem ecoar o valor).

Se ausente, **caio pro Caminho B** (pede login manual) e aviso o user como configurar:
> Auto-login indisponível — `P8_DEV_AUTO_LOGIN_TOKEN` não está no shell. Ver `docs/dev-auto-login.md`. Pedindo login manual agora.

### Execução

1. Capturo URL alvo: `$ARGUMENTS` se fornecido, senão a URL pré-redirect (extraio do path do `/login?next=...` se presente, ou uso `/painel`).
2. Monto URL:
   ```
   <base>/api/dev/auto-login?token=<token>&next=<urlEncoded(alvo)>
   ```
   Onde `<base>` é o host atual (mesmo origin onde está logando, pra evitar mismatch de cookie domain).
3. `navigate(url=<URL completa>, tabId=<tab atual>)`.
4. Espero 2s.
5. Confirmo sucesso lendo URL atual — deve estar em `<alvo>` (não em `/login`).
6. Devolvo controle pra skill chamadora.

### Segurança operacional

- **Token aparece na URL no transcript da sessão.** Aceitável porque (a) triple-guard impede uso em prod, (b) skill explicitamente avisa o user pra rotacionar token periodicamente.
- **Não loggo o token em mensagem texto.** Só passo via parâmetro do `navigate`.
- **Não armazeno o token em arquivo.** Lê do env var a cada execução.

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
