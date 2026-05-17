---
data: 2026-05-17
tipo: plano
topico: auth-onboarding-fechar-bugs-bloqueantes
autor: contato@arenacards.com.br
relacionados:
  - thoughts/pesquisas/2026-05-17-auth-onboarding-status.md
  - thoughts/pesquisas/2026-05-10-caminho-usuario.md
  - output/99-oracle-master.md
  - .claude/plugins/p8-master/references/auth-strategy.md
status: ativo
branch: feat/auth-hardening  # @verificar — sinal forte pelo nome da branch, mas confirmar com o autor
---

# Plano — Auth/Onboarding: fechar bugs bloqueantes

Pesquisa-base: [`thoughts/pesquisas/2026-05-17-auth-onboarding-status.md`](../pesquisas/2026-05-17-auth-onboarding-status.md).
Pesquisa identifica 3 bugs funcionalmente bloqueantes + lacuna de testes nos handlers existentes + tokens plaintext no DB. Este plano fecha **exatamente esse escopo** — nada além.

## Goal

Tornar o fluxo auth/onboarding funcional ponta-a-ponta: forgot-password manda email real, verificação de email deixa de ser stub, tokens de reset não ficam plaintext no DB, e os 5 handlers de auth ganham cobertura de testes que ancoram comportamento atual.

## Architecture

Adicionar lib `src/lib/email.ts` (cliente do provider escolhido na Fase 0) + `src/lib/tokens.ts` (gerar token aleatório retornando `{ raw, hash }`, comparação via `sha256`). Migração Prisma adiciona campos `emailVerifiedAt`, `emailVerificationToken`, `emailVerificationExpiry` em `Seller`, e troca `resetToken` (plaintext) por `resetTokenHash`. Handlers existentes consomem essas libs. Backfill da migração: `emailVerifiedAt = createdAt` em todas as contas pré-feature (grandfathering — não trancar usuários existentes). Templates de email ficam em `src/emails/` como funções TS que retornam HTML+texto (sem framework de templates novo).

**Princípio:** cada fase tem critério verificável + commit atômico. TDD não-negociável — RED retroativo dos handlers existentes (Fase 1) ancora comportamento antes de mexer.

## Files affected

### Criar
- `src/lib/email.ts` — cliente abstrato + send transacional
- `src/lib/tokens.ts` — gerar/hashear tokens (`crypto.randomBytes` + `sha256`)
- `src/emails/reset-password.ts` — template HTML+texto
- `src/emails/verify-email.ts` — template HTML+texto
- `src/app/api/auth/verify-email/route.ts` — GET com `?token=` consome verificação
- `src/app/api/auth/login/route.test.ts` — testes do handler atual (Fase 1)
- `src/app/api/auth/register/route.test.ts` — idem
- `src/app/api/auth/forgot-password/route.test.ts` — idem (testa estado atual antes da Fase 3)
- `src/app/api/auth/reset-password/route.test.ts` — idem
- `src/app/api/auth/logout/route.test.ts` — idem
- `src/lib/email.test.ts` — testa que o cliente foi chamado com payload certo (mock do provider)
- `src/lib/tokens.test.ts` — testa simetria gerar/verificar + resistência (hash != raw)
- `prisma/migrations/<timestamp>_auth_hardening/migration.sql` — gerada por `prisma migrate dev`

### Modificar
- `prisma/schema.prisma` — `Seller`: adicionar `emailVerifiedAt`, `emailVerificationToken`, `emailVerificationExpiry`; renomear `resetToken` → `resetTokenHash`
- `src/lib/env.ts` — Zod schema: adicionar `EMAIL_PROVIDER_API_KEY` (obrigatória em prod, opcional em dev), `EMAIL_FROM`
- `src/app/api/auth/forgot-password/route.ts` — usar `generateToken()` + `sendResetEmail()`; armazenar `resetTokenHash` em vez de raw
- `src/app/api/auth/reset-password/route.ts` — hashear token recebido + comparar contra `resetTokenHash`
- `src/app/api/auth/register/route.ts` — após criar seller, gerar token de verificação + enviar email; NÃO bloqueia sessão (continua redirecionando pra `/onboarding`)
- `src/app/(auth)/verificar-email/page.tsx` — remover stub `setTimeout`, integrar com POST `/api/auth/resend-verification` (cria-se a rota) e GET `/api/auth/verify-email`
- `src/app/api/auth/resend-verification/route.ts` — novo, throttle de 60s server-side
- `.env.example` — documentar `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`
- `docs/dev-auto-login.md` — adicionar nota sobre `emailVerifiedAt` em dev (auto-login bypassa verificação)

### Deletar
Nenhum.

### Fora do diff (deploy)
- Configurar `EMAIL_PROVIDER_API_KEY` em `vercel env` para preview + production (manual, antes do deploy da Fase 3).

## Phases (verificáveis)

### Fase 0 — Decidir provider de email + scaffold lib

**O que:**
1. Rodar `/p8-master:stay-current` para validar status 2026 de: Resend, SendGrid, AWS SES, Listmonk (último já está no VPS Hetzner). Cravar free tier, latência, DX em Next.js 16. **Não usar memória — knowledge cutoff é jan/2026, hoje é mai/2026.**
2. Apresentar decisão ao humano (`AskUserQuestion`) com 2-3 candidatos finalistas. Default recomendado: **Resend** (DX Next.js + free tier conhecido) — sujeito a confirmação pela pesquisa.
3. Criar `src/lib/email.ts` com interface mínima: `sendEmail({ to, subject, html, text }): Promise<{ id: string }>`. Implementação chama o provider escolhido. Em dev sem `EMAIL_PROVIDER_API_KEY`, faz `console.log` (mantém o comportamento atual pra não quebrar dev local).
4. Criar `src/lib/tokens.ts` com `generateToken()` que retorna `{ raw: string, hash: string }` (raw vai pro email/URL, hash vai pro DB). Hash via `crypto.createHash('sha256').update(raw).digest('hex')`.
5. Criar `src/lib/email.test.ts` + `src/lib/tokens.test.ts` (TDD: testes primeiro, implementação depois).
6. Atualizar `src/lib/env.ts` com `EMAIL_PROVIDER_API_KEY` (optional em dev, obrigatório em prod) + `EMAIL_FROM`.
7. Atualizar `.env.example`.

**Validação:**
- `npm run test -- email.test.ts tokens.test.ts` verde.
- `npx tsc --noEmit` verde.
- `npm run build` verde.
- Dev local sem `EMAIL_PROVIDER_API_KEY`: `import { sendEmail } from "@/lib/email"; await sendEmail(...)` → faz console.log com warn (smoke manual).

**Commit:** `feat(auth): add email transacional lib + tokens helpers`

---

### Fase 1 — Cobertura retroativa dos 5 handlers existentes

**O que:** Antes de mudar qualquer handler, escrever testes que **assertam comportamento atual**. Não é TDD red→green (não há feature nova). É **snapshot** do que existe pra detectar regressão nas fases seguintes.

1. `login/route.test.ts` — casos:
   - email inexistente → 401
   - senha errada → 401
   - senha plaintext legacy bate → 200 + re-hash (anti-regressão do fallback G1 enquanto não removemos)
   - bcrypt hash bate → 200
   - Zod fail → 400
2. `register/route.test.ts` — casos: válido, email duplicado, slug duplicado, Zod fail, criação de 3 PriceRule defaults.
3. `forgot-password/route.test.ts` — casos: email existe → 200 + token gerado (lê DB), email inexistente → 200 sem token, Zod fail → 400.
4. `reset-password/route.test.ts` — casos: token válido → 200 + token limpo, token expirado → 400, token inexistente → 400, Zod fail → 400.
5. `logout/route.test.ts` — caso: sessão existente → destruída.

Mocks via `src/__tests__/setup.ts` (já existe para Prisma + Stripe).

**Validação:**
- `npm run test` verde — 5 arquivos novos, ≥20 casos.
- Coverage report mostra os 5 handlers cobertos (linha por linha visível).

**Commit:** `test(auth): cobertura retroativa dos 5 handlers (login/register/forgot/reset/logout)`

---

### Fase 2 — Migrar tokens reset para hash + grandfathering

**O que:**
1. Editar `prisma/schema.prisma`:
   - Renomear `Seller.resetToken` → `Seller.resetTokenHash` (mesmo tipo `String?`).
   - Adicionar `emailVerifiedAt DateTime?`, `emailVerificationToken String?`, `emailVerificationExpiry DateTime?`.
2. Gerar migration: `npx prisma migrate dev --name auth_hardening`.
3. Editar migration manualmente para grandfathering: `UPDATE "Seller" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;` (executa antes do schema novo virar autoritativo).
4. Atualizar `forgot-password/route.ts` para gravar `resetTokenHash = sha256(raw)` em vez de raw.
5. Atualizar `reset-password/route.ts` para hashear `token` recebido + comparar contra `resetTokenHash`.
6. Atualizar `forgot-password.test.ts` + `reset-password.test.ts` (Fase 1) para assertar hash.

**Validação:**
- `npm run test` verde (incluindo tests da Fase 1 atualizados).
- `npx prisma migrate dev` aplica limpo em dev DB.
- `npx prisma db push` (validação dry-run contra schema atual).
- Smoke manual: criar token via API, ler DB → não é o mesmo valor da URL.
- Verificar via SQL: `SELECT COUNT(*) FROM "Seller" WHERE "emailVerifiedAt" IS NULL` → **0** após backfill (grandfathering funcionou).

**Commit:** `feat(auth): hash reset tokens no DB + grandfathering emailVerifiedAt`

---

### Fase 3 — Email real em forgot-password

**O que:**
1. Criar `src/emails/reset-password.ts` exportando `resetPasswordEmail({ name, resetUrl }): { subject, html, text }`.
2. Editar `forgot-password/route.ts` para chamar `sendEmail()` com o template (em vez de console.log).
3. **Manter** o console.log atual como fallback quando `EMAIL_PROVIDER_API_KEY` não está setada (= modo dev).
4. Atualizar `forgot-password.test.ts` para mockar `sendEmail` e assertar payload (to, subject contém "Redefinir", html contém resetUrl).

**Validação:**
- `npm run test` verde.
- Configurar `EMAIL_PROVIDER_API_KEY` em preview Vercel.
- Smoke E2E em preview: cadastrar conta com email descartável (Mailinator/temp-mail), pedir reset, receber email em ≤30s, clicar link, reset funciona, login com nova senha funciona.
- Console preview: log do `id` retornado pelo provider.

**Commit:** `feat(auth): forgot-password envia email real via provider transacional`

---

### Fase 4 — Email verification ponta-a-ponta

**O que:**
1. Criar `src/emails/verify-email.ts` exportando `verifyEmailEmail({ name, verifyUrl }): { subject, html, text }`.
2. Editar `register/route.ts`: após criar seller, gerar token + gravar `emailVerificationToken` (hash) + `emailVerificationExpiry` (24h) + enviar email. **Não bloqueia sessão** — continua criando sessão + redirecionando `/onboarding` (decisão consciente, ver Open Questions).
3. Criar `src/app/api/auth/verify-email/route.ts` (GET): recebe `?token=`, hashea, `findFirst` com expiry > now, marca `emailVerifiedAt = now`, limpa token, redirect para `/painel?verified=1`.
4. Criar `src/app/api/auth/resend-verification/route.ts` (POST): require sessão, throttle 60s (verifica `emailVerificationExpiry` recente), gera novo token + envia.
5. Editar `src/app/(auth)/verificar-email/page.tsx`: remover `setTimeout` stub, chamar `POST /api/auth/resend-verification`, mostrar erro/sucesso real.
6. Adicionar testes: `register.test.ts` (Fase 1) atualizado para assertar `sendEmail` chamado + `emailVerificationToken` no DB; novo `verify-email.test.ts`; novo `resend-verification.test.ts`.
7. `register/page.tsx` (UI): após cadastro, mostrar toast "Enviamos email de verificação para X" antes de redirect.

**Validação:**
- `npm run test` verde.
- Smoke E2E preview: registrar conta, receber email de verificação, clicar link, ver `?verified=1` no painel, conferir DB `emailVerifiedAt` populado.
- `/p8-master:ui-review verificar-email` em preview: golden path (registrar → ver toast → email chega → clicar) + breakpoints + console limpo.
- Conta antiga (grandfathered): login normal sem trigger de re-verificação.

**Commit:** `feat(auth): email verification ponta-a-ponta + página verificar-email funcional`

---

### Fase 5 — QA final + deploy

**O que:**
1. Rodar suite completa: `npm run test` (gate pre-commit já roda + `tsc --noEmit` + `next build`).
2. `/p8-master:ui-review auth-completo` cobrindo `/registro` → `/onboarding` → `/verificar-email` → `/login` → `/esqueci-senha` → `/reset-senha` em 3 breakpoints (375/768/1280).
3. Pesquisa Sentry/console preview por erros depois de 30min de tráfego sintético (cadastros + resets via Mailinator).
4. Aprovação humana explícita para `npx vercel deploy --prod`.
5. Pós-deploy: monitorar Sentry por 1h, conferir 1 cadastro real → email recebido → verificação clicada.

**Validação:**
- Smoke prod: 1 cadastro real (email pessoal), email chega, link funciona.
- Sentry: zero erros novos em rotas `/api/auth/**` na 1h após deploy.

**Commit:** já entrou em fases anteriores. Esta fase só roda checks + deploy.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Provider escolhido na Fase 0 muda pricing/free tier (knowledge cutoff jan/2026, hoje mai/2026) | Média | Médio | `/p8-master:stay-current` na Fase 0 é obrigatório. Decisão fica no plano com data + fonte. |
| Migration de schema com rename `resetToken` → `resetTokenHash` invalida tokens em voo | Baixa | Baixo | Tokens TTL = 1h. Deploy em janela baixa de tráfego invalida zero tokens reais (forgot-password está quebrado hoje — ninguém tem token ativo). |
| Grandfathering `emailVerifiedAt = createdAt` em conta sem email válido permite continuar com email errado | Baixa | Baixo | Decisão consciente. Backfill assume "estado existente é o estado verdadeiro". Reverificação manual disponível via resend. |
| Email vai pra spam (DKIM/SPF/DMARC não configurados) | Alta | Médio | Mitigação fora do código: configurar DNS no domínio que o provider exigir. Documentar em `.env.example`. Fase 3 testa com Mailinator (não filtra spam) — antes de prod, smoke com Gmail/Outlook. |
| Cobertura retroativa (Fase 1) "fossiliza" o fallback plaintext de G1 | Baixa | Baixo | Comentário inline `// @temp: fallback plaintext, remover quando G1 force-reset rodar (Oracle Etapa 1)`. Esse teste será removido junto com o branch quando G1 fechar. |
| `EMAIL_PROVIDER_API_KEY` não configurada em prod → registro/forgot quebram silenciosamente | Média | Alto | `src/lib/env.ts` valida como **obrigatória em `NODE_ENV=production`**. Build/start quebra se faltar. |

## Out of scope (YAGNI)

- **G1 force-reset job** (remover fallback plaintext em `login/route.ts:25-37`) — depende deste plano (precisa de email funcionando), mas executa em plano próprio. Razão: campanha de force-reset é trabalho operacional (comunicar usuários + janela de manutenção), não código.
- **Rate-limit em login/register/forgot/reset** — registrado como gap na pesquisa, mas é trabalho transversal que envolve escolher backend (Upstash, Vercel KV, in-memory). Plano próprio.
- **CSRF/origin check global** — idem, escopo de proxy/middleware.
- **CAPTCHA em registro/forgot** — registrado, mas decisão de UX (hCaptcha vs Turnstile vs nada) é plano próprio.
- **Tela branca sem sessão no painel** (Achado #5 pesquisa `2026-05-10-caminho-usuario.md`) — escopo de `/painel`, não auth puro.
- **Onboarding steps 2-3 decorativos** (Achado #11) — rewrite do `onboarding/page.tsx` é Etapa 4 do roteiro Oracle, plano próprio.

## Decisões (cravadas pelo humano em 2026-05-17 — "default em todos")

1. **Provider de email transacional:** **Resend**.
   - Fase 0 ainda roda `/p8-master:stay-current` para confirmar pricing/free tier/API atual (cutoff jan/2026 vs hoje mai/2026). Se confirmar saúde, segue. Se Resend tiver degradado (free tier cortado, API breaking change, descontinuado), Fase 0 volta com alternativa antes de codar.
   - Listmonk no Hetzner VPS rejeitado: adicionaria SMTP relay externo (Resend/SES por baixo) sem ganho.

2. **Email verification: NÃO BLOQUEIA (Opção A).**
   - Conta recebe sessão imediatamente após registro.
   - Verificação aparece como pendente (badge no painel) mas não impede uso.
   - Features que exigirão verificação no futuro (ex: receber pedido pago, exibir loja pública) ficam por conta de plano próprio. Este plano só pavimenta o gate — não o ativa em nenhum lugar.

3. **Grandfathering: AUTOMÁTICO.**
   - Migration faz `UPDATE "Seller" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;` no SQL da migration.
   - Nenhum seller existente recebe email de verificação retroativa.

4. **Domínio de envio (`EMAIL_FROM`):** `no-reply@figurinhaspro.com.br` (preliminar).
   - Marca do produto P8 é "FigurinhasPro" — `figurinhaspro.com.br` é coerente.
   - **Pré-condição operacional para Fase 3** (fora do diff): confirmar que `figurinhaspro.com.br` está registrado e o DNS é editável; configurar SPF + DKIM + DMARC conforme o provider (Resend) exigir. Se o domínio não estiver no controle do user, Fase 3 pausa e pergunta.

5. **G1 follow-up: SIM.**
   - Após Fase 5 deste plano (auth ponta-a-ponta verde), abrir plano próprio para G1 (force-reset campaign + remoção do branch plaintext em `login/route.ts:25-37`).
   - Pré-requisito do G1: email transacional funcionando em prod — exatamente o que este plano entrega.

## Critério global de pronto

- Os 6 fluxos de auth/onboarding (registro, login, logout, forgot, reset, verificar-email) funcionam ponta-a-ponta em produção, validados por smoke E2E real (não só CI).
- `npm run test` ≥ 20 casos cobrindo handlers de auth.
- `prisma migrate status` limpo, sem schema drift.
- Sentry zero erros em `/api/auth/**` durante 1h pós-deploy.
- `thoughts/handoffs/` documenta o que ficou (G1 ainda em aberto, CAPTCHA/rate-limit/CSRF pendentes em planos próprios).

## Aprovação

Aguarda OK explícito do humano para virar `status: ativo`. Sem aprovação, `/p8-master:implementa` não roda.
