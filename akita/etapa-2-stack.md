> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28

# Etapa 2 — Stack mínima (DRAFT)

## Categoria confirmada

**W** (Web app) — SaaS B2B com vitrine pública + painel logado + checkout Stripe.

## Stack atual (do snapshot)

| Camada | Tecnologia |
|--------|------------|
| Linguagem | TypeScript 5 |
| Framework | Next.js 16.2.4 (App Router, Turbopack, React Compiler) |
| Database | PostgreSQL — Neon (prod) / SQLite (dev) |
| ORM | Prisma 7.7 com adapter Neon WebSocket Pool |
| Auth | iron-session 8 + bcryptjs 3 |
| UI | React 19.2 + Tailwind 4 + Geist fonts |
| Validação | Zod 4.3 |
| Pagamentos | Stripe SDK 22 |
| Monitoring | Sentry 10.49 + Vercel Analytics + Speed Insights |
| Lint/format | Biome 2.4 |
| Testes | Vitest 4 |
| Hospedagem | Vercel |

## Stack proposta (modo "manter, com revisão crítica")

A stack atual é moderna e bem-escolhida pra categoria W. Não há razão técnica pra port. **Mas** há 2 desvios do default Akita 2026 (Rails 8 + SQLite + Hotwire + Kamal + Hetzner) que merecem registro consciente.

| Camada | Tech atual | Tech proposta | Justificativa |
|---|---|---|---|
| Linguagem | TypeScript 5 | TypeScript 5 | mantém — equipe já fluente, codebase grande |
| Framework | Next.js 16 | Next.js 16 | mantém — App Router + Server Actions resolvem o caso |
| DB prod | Neon Postgres | Neon Postgres | mantém — pooling WebSocket + serverless casa com Vercel |
| DB dev | SQLite via better-sqlite3 | SQLite | mantém — paridade sufficiently próxima pro caso |
| ORM | Prisma 7.7 (generator novo) | Prisma 7.7 | mantém — schema migrado pro generator novo, gen em `src/generated/prisma/` |
| Auth | iron-session + bcryptjs | iron-session + bcryptjs | mantém — sem necessidade de Clerk/NextAuth pro v0 |
| UI | React 19 + Tailwind 4 | React 19 + Tailwind 4 | mantém — CSS-first via `@theme inline` é convenção Tailwind 4 atual |
| Componentes | Ad-hoc (sem shadcn) | **adicionar shadcn/ui** | revisar — 3 primitives próprios viraram débito. shadcn dá Dialog/Sheet/Toast/Form prontos com Radix + a11y. Migra incremental. |
| Pagamentos | Stripe SDK 22 | Stripe SDK 22 | mantém — Stripe é default global pra SaaS BR |
| Estado client | Context (`cart-context.tsx`) | mantém | OK pro carrinho. Se complexidade subir, considerar Zustand. |
| Background jobs | Não existe | **avaliar Vercel Queues** | revisar — `wa-outbound`, `email transactional`, `webhook retry` hoje são sync. Vercel Queues (beta) é nativo do platform. |
| Analytics | Vercel Analytics | **adicionar Umami** | revisar — Umami já está rodando na VPS Hetzner do workspace; basta instrumentar. Custom events = 0 hoje. |
| Hospedagem | Vercel | Vercel | mantém — auto-deploy desativado no `album-digital`, `vercel deploy --prod` manual já é o padrão |

**Justificativa do desvio frente ao default Akita (Rails 8 + Hetzner + Kamal):**

1. **Por que não Rails:** equipe já mantém 13+ projetos no workspace ArenaCards majoritariamente em Next.js + Prisma. Reescrever em Rails seria port (categoria P), não reorganização (W). Custo de aprendizado + perda de produtividade não compensam o ganho de "convention over configuration" pro caso atual.
2. **Por que não Kamal+Hetzner:** Vercel já está pago, integrado com Neon, Stripe webhooks, e é onde os outros 12 projetos do workspace deployam. VPS Hetzner do workspace serve infra paralela (37 containers Docker — n8n, Chatwoot, Twenty, Umami) — não compete com o app Next.

**Em uma frase:** mantém a stack porque o projeto está em fase de *busca de fit* (cockpit comercial validando canal/oferta), não em fase de *escala que paga reescrever*.

## Defaults Akita 2026 (referência)

- **W**: Rails 8.1 + SQLite + Hotwire + Kamal + Hetzner — não adotado, justificativa acima
- **C**: Crystal (preferido) ou Rust — irrelevante (não é C)
- **P**: C/C++→Rust, Python→Crystal — irrelevante (não é P)

## Decisões de stack postergadas (revisitar pós-v0)

- Adicionar shadcn/ui incremental (componentes novos via shadcn, primitives próprios migram aos poucos)
- Instrumentar Umami para custom events de funil (signup → onboarding → primeiro pedido → upgrade)
- Avaliar Vercel Queues quando primeiro job assíncrono virar gargalo

---

**Próxima etapa:** `/akita-bootstrap:akita-etapa-3-ambiente`
