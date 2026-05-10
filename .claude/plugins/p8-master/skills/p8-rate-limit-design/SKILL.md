---
name: p8-master:p8-rate-limit-design
description: Auto-ativa quando o usuário pedir "rate limit", "proteção contra brute force", "limite de requests", ou mencionar abuso em rotas públicas. Pesquisa libs disponíveis (upstash/redis, custom in-memory, Vercel WAF), gera `/p8-master:plano` em `thoughts/planos/` para implementação.
argument-hint: "[escopo: api | webhook | public-loja | login-auth, default: api+login-auth]"
---

Vou desenhar rate limit pra P8-FigurinhasPro: $ARGUMENTS

## Contexto (gap conhecido)

P8 atualmente **não tem rate limiting**. Riscos:
- Login brute force em `/api/auth/login`
- Spam de pedidos em `/loja/[slug]` (criação de Orders sem captcha)
- Webhook Stripe spam (mas Stripe limita do lado deles)
- API enumeration em `/api/inventory`, `/api/albums`

## Sequência

1. **Pré-check pesquisa.** Procuro em `thoughts/pesquisas/` por artefato sobre rate limit nos últimos 30 dias. Sem hits, dispara `/p8-master:pesquisa "rate limit Vercel Next 16 best practice 2026"`.

2. **Spawn `pesquisador` (Sonnet)** pra pesquisa de libs:
   - `@upstash/ratelimit` + Upstash Redis (serverless-friendly, Vercel official)
   - `next-rate-limit` (in-memory LRU, sem persistência)
   - Vercel WAF (firewall paid feature)
   - Custom Edge Middleware com KV
   - `iron-session` rate limit por session (limitado mas não-zero)

3. **Avalia trade-offs:**

| Solução | Pros | Cons | Custo | Implementação |
|---|---|---|---|---|
| Upstash + @upstash/ratelimit | Recomendação Vercel oficial, persistência cross-region | $/mês (free tier 10k req/dia) | $0-30/mês | proxy.ts + lib/rate-limit.ts |
| In-memory LRU | Zero config, $0 | Reset a cada deploy, não compartilha entre regiões | $0 | proxy.ts simples |
| Vercel WAF | Sem código, gerenciado | Pro plan ($20/dev) + custom rules | $20+ | Dashboard Vercel |
| Custom KV | Controle total | Manutenção | $0-baixo | Mais código |

4. **Recomendação default** (baseada em P8 hoje):
   - Tier 1: **Upstash + @upstash/ratelimit** para `/api/auth/login` (10 req / 15 min por IP) e `/api/auth/register` (3 req / hora).
   - Tier 2: **In-memory LRU** para `/loja/[slug]` (1 Order / minuto / IP) — basta porque cada deploy reseta e ataque demora.
   - Sem rate limit em `/api/stripe/webhook` (Stripe controla).
   - Sem rate limit em rotas autenticadas de vendedor (sessão limita).

5. **Gera `/p8-master:plano`** com a recomendação:
   ```
   /p8-master:plano "implementar rate limit em /api/auth/login e /loja/[slug] usando Upstash"
   ```

   Plano gerado tem fases:
   - Fase 1: criar conta Upstash (gate humano)
   - Fase 2: adicionar `RATE_LIMIT_REDIS_URL` em `src/lib/env.ts` (Zod schema strict prod)
   - Fase 3: implementar `src/lib/rate-limit.ts` com TDD (RED → GREEN)
   - Fase 4: integrar em `src/proxy.ts` (Next 16) ou middleware nas rotas
   - Fase 5: testes E2E (forçar excesso, confirmar 429)
   - Fase 6: deploy + smoke

6. **Mostra plano** + sugere `/p8-master:plano` aprovação humana.

## Restrições

- **Não implementa código.** Só desenha.
- **Não escolhe lib sem justificativa** — sempre apresenta trade-offs.
- **Não recomenda Upstash se P8 já usa outra KV** (verifica primeiro).
- **Não esquece test plan** — rate limit sem teste é apenas teatro.

## Modelo recomendado

- **Main session: Sonnet** — pesquisa de libs + estruturação de plano.
- **Sub-agent: `pesquisador`** (Sonnet, com WebFetch).

## Considerações P8-específicas

- **Next 16 + proxy.ts:** ainda não há `proxy.ts` em P8 (`src/proxy.ts` não existe). Adicionar é trivial.
- **iron-session já em uso:** rate limit por session é complementar (proteção contra abuse autenticado), mas insuficiente sozinho.
- **Vercel Edge:** P8 roda em Node.js runtime padrão, não Edge. Isso afeta latência e provider de KV.

## Ver também

- [skills/pesquisa/SKILL.md](../pesquisa/SKILL.md) — pré-requisito
- [skills/plano/SKILL.md](../plano/SKILL.md) — produto final desta skill
- [P8-FigurinhasPro/src/app/api/auth/](../../../../src/app/api/auth/) — destino primário do rate limit
- [references/stack-cheatsheet.md](../../references/stack-cheatsheet.md) — Next 16 proxy.ts
