---
name: p8-master:valida
description: Auto-ativa quando o usuário pedir pra validar, revisar ou checar um plano antes de implementar em P8-FigurinhasPro. Detecta placeholders, contradições, escopo solto, ambiguidades, e violações de convenções P8 (Next 16 sync APIs, gate pre-commit, deploy gate). Sugere fixes inline.
argument-hint: <caminho do plano>
---

Vou validar o plano: $ARGUMENTS

(Argumento esperado: caminho relativo ao plano, ex: `thoughts/planos/2026-05-10-email-resend.md`)

## Sequência

1. **Ler o plano** completo.

2. **Checklist de validação:**

   ### Checklist universal SMA
   - **Placeholders**: existe "TBD", "TODO", "implement later", "fill in details", seções vazias?
   - **Consistência interna**: alguma seção contradiz outra? Architecture bate com Files affected?
   - **Escopo**: o plano está focado num único deliverable, ou tem 3 sub-projetos misturados?
   - **Ambiguidade**: alguma requirement pode ser interpretada de 2 formas?
   - **Tasks vs Goal**: cada task pode ser apontada para uma seção do goal?
   - **Out of scope explícito**: o que não entra está listado (3-5 itens)?
   - **Critério de pronto**: cada fase tem DoD verificável (gate verde, teste passa)?

   ### Checklist P8-específica
   - **Gate pre-commit**: cada fase declara que `npm run test` + `tsc --noEmit` + `npm run build` precisam ficar verdes antes de commitar?
   - **Schema Prisma**: se mexe em `prisma/schema.prisma`, há fase explícita pra `npx prisma db push` em prod com gate humano?
   - **Stripe webhook**: se toca em `src/app/api/stripe/*` ou `src/lib/stripe.ts`, há plano de teste com `stripe trigger checkout.session.completed`?
   - **Plan limits**: se mexe em `src/lib/plan-limits.ts`, plano lembra que gates estão desabilitados (TODO restaurar)?
   - **Sentry**: se afeta error handling, plano considera `instrumentation.ts` (atualmente inativo)?
   - **iron-session**: mudanças em auth tocam `src/lib/auth.ts` + `SESSION_PASSWORD` env var?
   - **Cockpit comercial**: se rota é `/painel/comercial/*`, plano respeita gate `ADMIN_EMAIL`?
   - **Custom albums**: se toca `src/lib/custom-albums.ts`, plano respeita slug `custom_*` e parser de ranges?
   - **Next 16 async APIs**: plano usa `await params`, `await cookies()`, `await headers()` (não sync)?
   - **Prisma 7 driver adapter**: novo `PrismaClient` usa `adapter: new PrismaNeon(...)`?
   - **Deploy obrigatório**: plano inclui `npx vercel deploy --prod` na fase final (com gate humano)?

3. **Output**: lista de issues por severidade:
   - **Bloqueante** (precisa fix antes de implementar)
   - **Atenção** (vale revisar)
   - **OK** (achei e tá tudo certo)

4. Para cada issue bloqueante, proponho fix concreto inline (cito linha do plano).

5. **Não modifico o plano.** Apenas reporto. Quem aplica é `/p8-master:itera` após aprovação humana.

## Modelo recomendado

- **Main session: Opus** — análise crítica multi-dimensional.
- **Sub-agent `revisor`**: Sonnet, faz checklist de complexidade + segurança em paralelo.

## Restrições

- **Não modifico o plano.**
- **Não invento bloqueante.** "Bloqueante" = contradição/ambiguidade real, não preferência de estilo.
- **Não suavizo achado real.** Contradição entre Architecture e Phases → eu nomeio.
- **Não pulo a checklist P8-específica.** Plano sem fase de gate Prisma quando mexe em schema é bloqueante.

## Ver também

- [agents/revisor.md](../../agents/revisor.md) — sub-agent de complexidade + segurança
- [skills/itera/SKILL.md](../itera/SKILL.md) — quem aplica os fixes
