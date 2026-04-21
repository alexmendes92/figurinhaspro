# Domínio e Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar domínio customizado para o FigurinhasPro (sair de `album-digital-ashen.vercel.app`), adicionar `vercel.ts` com security headers e redirect de `www`, propagar a URL nova para `NEXT_PUBLIC_APP_URL` e validar integrações (Stripe webhook, Umami hostname).

**Architecture:** Configuração declarativa em `vercel.ts` (substitui `vercel.json`) com headers de segurança, cache estático e redirect `www` → apex. Domínio adicionado via Vercel CLI ou dashboard. DNS apontado para Vercel (CNAME/A records). Propagação do novo host em variáveis de ambiente (`NEXT_PUBLIC_APP_URL`) e dependências externas (Stripe webhook endpoint, Umami).

**Tech Stack:** Vercel CLI, `@vercel/config` (provê tipos do `vercel.ts`), DNS provider (Cloudflare/Registro.br/etc).

**Prerequisitos bloqueantes (ações humanas):**

1. **Decisão do domínio final** — product owner precisa confirmar. Sugestões:
   - `figurinhaspro.com.br` (alinhado com nome do produto, mercado BR)
   - `figurinhas.pro` (curto, internacional, mas gTLD menos familiar no BR)
   - `figurinhaspro.arenacards.com.br` (subdomínio da marca-mãe — mais barato, menos branding)
2. **Compra do domínio** — se ainda não comprado (Registro.br, GoDaddy, Cloudflare Registrar).
3. **Acesso ao DNS** do domínio (dashboard do registrador OU migrado pra Cloudflare).
4. **Permissão de admin no projeto Vercel** `album-digital`.

**Sem essas 4 premissas, o plano não pode rodar.** Task 1 Step 1 é o gate de confirmação.

**Project rules:** Após cada commit, rodar `npx vercel deploy --prod`. Mudanças de DNS têm propagação (5min a algumas horas) — reservar janela de baixo tráfego.

---

### Task 1: Confirmar premissas e registrar decisões

**Files:**
- Modify: `CLAUDE.md` (seção Produção — atualizar URL)

**Context:** Gate que trava execução sem decisão humana. Ver "Prerequisitos bloqueantes" acima.

- [ ] **Step 1: Obter decisões do product owner**

Perguntar e registrar:
- Qual é o domínio final? (ex: `figurinhaspro.com.br`)
- O domínio já foi comprado? Se não, PARE — task terminada.
- Onde está o DNS? (Registro.br, Cloudflare, GoDaddy?)
- Quem tem acesso admin na Vercel org? (usuário precisa estar logado via `vercel login`)

Se qualquer resposta for "não sei" ou "ainda não comprei", **PARAR o plano** e retomar quando premissas estiverem prontas.

- [ ] **Step 2: Verificar acesso local ao Vercel CLI**

```bash
vercel --version || npm i -g vercel
vercel whoami
vercel link --project album-digital
```

Esperado: output mostra user logado e link do projeto atual.

- [ ] **Step 3: Atualizar `CLAUDE.md` (seção Produção) com domínio planejado**

Localizar em `CLAUDE.md`:

```
- **URL**: https://album-digital-ashen.vercel.app
```

Alterar para (substituir `<DOMAIN>` pelo domínio final decidido):

```
- **URL**: https://<DOMAIN> (domínio customizado — ver plano 2026-04-21-launch-dominio-deploy.md)
- **URL legada Vercel**: https://album-digital-ashen.vercel.app (mantida como fallback)
```

- [ ] **Step 4: Commit do registro**

```bash
git add CLAUDE.md
git commit -m "docs(claude): registra domínio customizado planejado para launch"
git push
# sem deploy prod — só doc
```

---

### Task 2: Criar `vercel.ts` com security headers e redirects

**Files:**
- Create: `vercel.ts` (raiz do projeto)
- Modify: `package.json` (adicionar `@vercel/config` como devDependency)

**Context:** `vercel.ts` substitui `vercel.json` com typing TypeScript. Configurar: redirect `www.<domain>` → apex, security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP-lite), cache estático agressivo em `/_next/static`.

- [ ] **Step 1: Instalar `@vercel/config`**

```bash
npm i -D @vercel/config
```

- [ ] **Step 2: Criar `vercel.ts` na raiz do projeto**

```ts
import { routes, type VercelConfig } from "@vercel/config/v1";

const APEX_DOMAIN = "figurinhaspro.com.br"; // AJUSTAR para o domínio final
const WWW_DOMAIN = `www.${APEX_DOMAIN}`;

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",

  redirects: [
    {
      source: "/:path*",
      has: [{ type: "host", value: WWW_DOMAIN }],
      destination: `https://${APEX_DOMAIN}/:path*`,
      permanent: true,
    },
  ],

  headers: [
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    routes.cacheControl("/_next/static/(.*)", {
      public: true,
      maxAge: "1 year",
      immutable: true,
    }),
    routes.cacheControl("/favicon.ico", {
      public: true,
      maxAge: "1 day",
    }),
  ],
};

export default config;
```

> **Nota 1:** substituir `figurinhaspro.com.br` pelo domínio real decidido na Task 1.
>
> **Nota 2:** NÃO incluir `Content-Security-Policy` restritivo agora — Sentry, Vercel Analytics, Umami e Stripe exigem várias origens; CSP mal configurado quebra o app. Avaliar em plano separado pós-launch.

- [ ] **Step 3: Remover `vercel.json` se existir (incompatível com `vercel.ts`)**

```bash
ls vercel.json 2>/dev/null && rm vercel.json || echo "sem vercel.json (ok)"
```

- [ ] **Step 4: Validar build local**

```bash
npm run build
```

Esperado: build completa. `vercel.ts` é lido pelo Vercel em deploy, não pelo Next.js em build local — nenhum efeito runtime aqui.

- [ ] **Step 5: Commit**

```bash
git add vercel.ts package.json package-lock.json
git commit -m "chore(vercel): adiciona vercel.ts com security headers, redirect www e cache estático"
git push
npx vercel deploy --prod
```

- [ ] **Step 6: Validar headers em produção (antes do domínio customizado)**

```bash
curl -sI https://album-digital-ashen.vercel.app/ | grep -iE "strict-transport|x-content-type|x-frame|referrer-policy"
```

Esperado: todos os 4 headers presentes no response.

---

### Task 3: Adicionar domínio customizado no projeto Vercel

**Files:** nenhum arquivo alterado neste task — tudo via Vercel CLI / dashboard.

**Context:** Associar `<DOMAIN>` e `www.<DOMAIN>` ao projeto `album-digital`. Vercel gera as instruções de DNS.

- [ ] **Step 1: Adicionar domínios via CLI**

```bash
vercel domains add figurinhaspro.com.br
vercel domains add www.figurinhaspro.com.br
```

(Substituir pelo domínio real da Task 1.)

Esperado: Vercel responde com:
- Para apex: `A record 76.76.21.21` (ou similar)
- Para www: `CNAME cname.vercel-dns.com`

- [ ] **Step 2: Vincular domínios ao projeto**

```bash
vercel alias set https://album-digital-ashen.vercel.app figurinhaspro.com.br
vercel alias set https://album-digital-ashen.vercel.app www.figurinhaspro.com.br
```

OU pelo dashboard: Project Settings → Domains → Add.

- [ ] **Step 3: Configurar DNS no registrador**

**Se DNS for Cloudflare (recomendado — TTL rápido + SSL grátis):**

No dashboard Cloudflare, zona `figurinhaspro.com.br`:
1. Remover registros antigos conflitantes (A/CNAME/ALIAS no root ou www)
2. Adicionar `A` para `@` apontando para IP da Vercel (do Step 1)
3. Adicionar `CNAME` para `www` apontando para `cname.vercel-dns.com`
4. **Proxy status: DNS only (cinza)** — Vercel gerencia SSL, proxy laranja da Cloudflare quebra

**Se DNS for Registro.br:**

Interface → Editar Zona → adicionar:
- `A figurinhaspro.com.br. 76.76.21.21`
- `CNAME www.figurinhaspro.com.br. cname.vercel-dns.com.`

- [ ] **Step 4: Aguardar propagação e validar**

```bash
dig +short figurinhaspro.com.br
dig +short www.figurinhaspro.com.br
```

Esperado: retornar IP Vercel e `cname.vercel-dns.com` respectivamente. Propagação pode levar 5-60 min.

Se não propagou em 1h, verificar `dig @8.8.8.8 figurinhaspro.com.br` — se Google DNS responde, é cache local.

- [ ] **Step 5: Validar SSL e resposta HTTP**

```bash
curl -sI https://figurinhaspro.com.br/
curl -sI https://www.figurinhaspro.com.br/
```

Esperado:
- Apex: `HTTP/2 200` + security headers (da Task 2)
- www: `HTTP/2 308 Permanent Redirect` + `Location: https://figurinhaspro.com.br/...`

---

### Task 4: Atualizar `NEXT_PUBLIC_APP_URL` e dependências externas

**Files:** nenhum arquivo alterado direto — configuração via Vercel CLI + dashboards externos.

**Context:** `NEXT_PUBLIC_APP_URL` é usada em `robots.ts`, `sitemap.ts`, metadata, Stripe redirect URLs. Stripe webhook endpoint e Umami hostname também precisam refletir o domínio novo.

- [ ] **Step 1: Atualizar env var no Vercel**

```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# quando solicitar valor, digitar: https://figurinhaspro.com.br
```

- [ ] **Step 2: Redeploy para pegar env nova**

```bash
npx vercel deploy --prod
```

- [ ] **Step 3: Validar que sitemap e robots refletem o domínio novo**

```bash
curl -s https://figurinhaspro.com.br/robots.txt | grep Sitemap
curl -s https://figurinhaspro.com.br/sitemap.xml | head -20
```

Esperado: URLs com `figurinhaspro.com.br`, não mais `album-digital-ashen.vercel.app`.

- [ ] **Step 4: Atualizar endpoint do webhook Stripe**

Dashboard Stripe → Developers → Webhooks → endpoint atual (`https://album-digital-ashen.vercel.app/api/stripe/webhook`) → Update endpoint URL → `https://figurinhaspro.com.br/api/stripe/webhook`.

**Importante:** não deletar e recriar — isso gera novo `whsec_` e quebra prod. Usar "Update endpoint URL".

Se for criar novo: copiar o novo `whsec_` e atualizar `STRIPE_WEBHOOK_SECRET` no Vercel:

```bash
vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production
# colar o novo whsec_...
npx vercel deploy --prod
```

- [ ] **Step 5: Atualizar Umami hostname (analytics)**

Dashboard Umami em `analytics.arenacards.com.br` → Website (ID `946ed723-8d29-41c5-84a1-49fdcc13d0c0`) → Settings → Domain: adicionar `figurinhaspro.com.br` à lista de domínios permitidos.

Umami usa hostname segregation — se não adicionar, eventos de `figurinhaspro.com.br` ficam no grupo errado ou descartados.

- [ ] **Step 6: Atualizar URL de produção no `CLAUDE.md`**

Remover a linha `URL legada Vercel...` da Task 1 Step 3 (mantida só durante transição). Após confirmar que tudo funciona no domínio novo:

```markdown
- **URL**: https://figurinhaspro.com.br
- **Vercel project:** `album-digital`
```

- [ ] **Step 7: Validar fluxo ponta-a-ponta em produção**

Playwright no domínio novo:

1. `browser_navigate` → `https://figurinhaspro.com.br/` → screenshot
2. `browser_navigate` → `https://www.figurinhaspro.com.br/` → deve redirecionar para apex → screenshot + verificar URL final
3. `browser_navigate` → `https://figurinhaspro.com.br/sobre` → screenshot
4. `browser_navigate` → `https://figurinhaspro.com.br/registro` → fazer signup teste → screenshot
5. `browser_console_messages` em cada página — zero erros (exceto warnings esperados de Umami se config em propagação)

Validar Stripe via evento de teste:

Dashboard Stripe → Webhooks → endpoint novo → "Send test event" → `checkout.session.completed`. Verificar no Sentry ou logs Vercel:

```bash
vercel logs album-digital --prod --since 5m | grep -i "stripe\|webhook"
```

Esperado: webhook recebido e processado com sucesso.

- [ ] **Step 8: Commit final**

```bash
git add CLAUDE.md
git commit -m "docs(claude): promove figurinhaspro.com.br como URL oficial de produção"
git push
# sem redeploy — só doc
```

---

### Task 5: Desativar URL legada (opcional)

**Files:** nenhum.

**Context:** Após domínio novo estável por alguns dias, pode-se deprecar `album-digital-ashen.vercel.app`. Vercel permite remover o alias gerado automaticamente. **Não recomendado nos primeiros 7 dias** — mantém fallback se DNS apresentar problema.

- [ ] **Step 1: Aguardar 7 dias de estabilidade no domínio novo**

Monitorar:
- Sentry: taxa de erros em `figurinhaspro.com.br` ≤ taxa anterior
- Vercel Analytics: tráfego migrando para domínio novo
- Stripe: webhooks processando sem falha

- [ ] **Step 2: Decidir manter ou deprecar URL Vercel**

Opção A (manter): zero ação — `.vercel.app` URLs sempre funcionam em projetos Vercel.

Opção B (redirecionar para domínio novo): adicionar em `vercel.ts`:

```ts
redirects: [
  // ... redirect www
  {
    source: "/:path*",
    has: [{ type: "host", value: "album-digital-ashen.vercel.app" }],
    destination: "https://figurinhaspro.com.br/:path*",
    permanent: true,
  },
],
```

Commit e deploy.

---

## Critérios de conclusão do plano

- [ ] `vercel.ts` publicado com security headers e redirect `www` → apex
- [ ] Domínio final apontado corretamente (apex + www) com SSL ativo
- [ ] `NEXT_PUBLIC_APP_URL` no Vercel atualizado
- [ ] `robots.txt` e `sitemap.xml` retornando URLs do domínio novo
- [ ] Stripe webhook apontado para domínio novo, teste `checkout.session.completed` passando
- [ ] Umami com domínio novo registrado
- [ ] Playwright valida landing, `www` redirect, institucionais e fluxo de signup no domínio novo
- [ ] `CLAUDE.md` com URL oficial atualizada
- [ ] 2 commits em `master` (vercel.ts + CLAUDE.md), 1+ deploy em produção
