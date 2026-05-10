---
name: p8-master:p8-deploy
description: Auto-ativa quando o usuário pedir pra "deploy", "publicar", "vercel deploy --prod", ou completou pipeline de feature/bug com gate verde. Wrapper obrigatório do CLAUDE.md de P8 — roda pré-checks (gate completo, schema sync, env vars), pede aprovação humana SEMPRE (Akita override), executa `npx vercel deploy --prod`, monitora deploy + smoke test.
argument-hint: "[--skip-smoke pra pular smoke pos-deploy, --force-deploy pra ignorar drift de schema]"
---

Vou orquestrar deploy de P8-FigurinhasPro pra prod (Vercel projeto `album-digital`).

## Pré-checks (sempre rodam, abort se vermelho)

1. **Working tree limpo:** `git status` não pode ter mudanças não-commitadas.
2. **Build verde local:** `npm run build` retorna sucesso.
3. **Tests verdes:** `npm run test` passa.
4. **TypeScript verde:** `npx tsc --noEmit` passa.
5. **Schema Prisma sincronizado:** `npx prisma migrate status` não reporta drift.
   - Se reportar drift: bloqueia, pede `/p8-master:p8-prisma-migrate --prod` antes.
   - Override com `--force-deploy` (RISCO: app quebra se schema desatualizado).
6. **Branch correta:** push deve ser pra `master` (P8 usa `master`).
7. **Env vars críticas configuradas em Vercel scope Production:**
   - `DATABASE_URL`, `SESSION_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `ADMIN_EMAIL`
   - Verificação leve: `vercel env ls production` (não vaza valores).

## Sequência

1. **Roda pré-checks acima.** Se algum vermelho, aborta + mostra detalhes.

2. **Mostra resumo do deploy:**
   ```
   Deploy proposto:
     Commit: <SHA + mensagem>
     Files changed: <N>
     Test results: PASS
     Build size: <MB>
     Schema diff: nenhum / N statements pendentes
     Env vars: <N> configuradas em prod
   ```

3. **GATE HUMANO** (Akita-style override do "deploy automático" do CLAUDE.md de P8):
   ```
   Aprovar deploy prod? [s/n]
   ```

   **Importante:** CLAUDE.md de P8 diz "NUNCA perguntar deploy". Plugin P8-MASTER **sobrescreve** essa regra para gate Akita-style. Se quiser pular gate, set `P8_AUTO_DEPLOY=true` em env (não recomendado).

4. **Se aprovado, push (se ainda não pushou):**
   ```bash
   git push origin master
   ```

5. **Deploy via [scripts/vercel-deploy-prod.ps1](../../scripts/vercel-deploy-prod.ps1):**
   ```bash
   pwsh -File .claude/plugins/p8-master/scripts/vercel-deploy-prod.ps1
   ```

   Wrapper executa `npx vercel deploy --prod` capturando output.

6. **Aguarda deploy completar** (5-15 min típico). Captura URL do deploy:
   ```
   ✅ Production: https://album-digital-ashen.vercel.app [<deployment-id>]
   ```

7. **Spawn `deploy-watcher` (Sonnet)** em paralelo:
   - Monitora `vercel logs <deployment-id>` por 2 min após deploy.
   - Reporta erros runtime imediatos.
   - Verifica que home `/` retorna 200.

8. **Smoke test pos-deploy** (a menos que `--skip-smoke`):
   - GET `/` (loja/landing) — esperado 200
   - GET `/loja/<slug-de-teste>` — esperado 200 ou 404 (se slug não existir)
   - GET `/api/health` se existir, ou `/api/auth/session` (esperado 200/401)
   - Stripe webhook smoke OPCIONAL (`--with-stripe`) — `stripe trigger checkout.session.completed` em modo prod (CUIDADO: cria evento real)

9. **Reporta resultado:**
   ```markdown
   ## Deploy P8-FigurinhasPro — <currentDate>

   **URL:** https://album-digital-ashen.vercel.app
   **Deployment ID:** <id>
   **Build duration:** <Xm Ys>
   **Smoke test:** PASS | FAIL (com detalhes)
   **Errors runtime (2min):** nenhum / lista
   ```

10. **Se smoke FALHOU:** sugere rollback:
    ```
    Rollback proposto: vercel rollback <previous-deployment-id>
    ```

11. **Atualiza `state/deploys.jsonl`** com entrada `{timestamp, sha, url, deployment_id, smoke_status}`.

## Restrições

- **NUNCA pula pré-checks.** Force só com `--force-deploy` E confirmação dupla.
- **NUNCA roda sem gate humano** (default Akita override).
- **NUNCA expõe env vars** em log.
- **NUNCA usa `vercel --prod`** sem o wrapper (perde os pré-checks).
- **Bloqueio HARD em deploy --force se há drift Prisma:** plugin recusa, exige `--migrate --prod` antes.

## Variáveis de ambiente Vercel (referência)

Lista lida via `vercel env ls production` (sem valores):
- `DATABASE_URL` — Neon Postgres connection string
- `SESSION_PASSWORD` — iron-session, ≥32 chars
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL` — gate cockpit comercial
- `SENTRY_DSN` (opcional) — atualmente inativo
- `BOT_HMAC_SECRET` — integração WhatsApp via n8n (Arena Growth Hub)

## Modelo recomendado

- **Main session: Sonnet** — orquestra CLI + parse + smoke.
- **Sub-agent: `deploy-watcher`** (Sonnet) — monitora logs runtime via WebFetch + Bash.

## Quando NÃO usar

- Deploy preview (não-prod): use `vercel deploy` sem `--prod` direto, sem gate.
- Local dev: `npm run dev` em vez de deploy.
- Branch que não é `master`: deploy preview gera URL temporário automaticamente.

## Ver também

- [scripts/vercel-deploy-prod.ps1](../../scripts/vercel-deploy-prod.ps1)
- [agents/deploy-watcher.md](../../agents/deploy-watcher.md)
- [P8-FigurinhasPro/CLAUDE.md](../../../../CLAUDE.md) — regra "deploy automático" (sobrescrita por este plugin)
- [P8-FigurinhasPro/.vercel/project.json](../../../../.vercel/project.json) — projeto Vercel `album-digital`
