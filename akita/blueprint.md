# Blueprint Estratégico — FigurinhasPro (album-digital)

> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28
> Doc de partida pra discussão estratégica. Revise antes de comprometer recursos.

## TL;DR

- **O projeto atual é:** SaaS B2B Next.js 16 + Prisma 7 + Neon + Stripe deployado no Vercel; vende vitrine digital de figurinhas para revendedores. 18 entidades, 33 páginas, 24 endpoints. Stack moderna, código testado (Vitest 4 com mocks Prisma+Stripe), hook pré-commit completo, deploy manual por escolha.
- **Proposta:** **manter stack** (não há razão técnica pra port) + **enxugar v0** drasticamente (remover cockpit comercial admin, bot WhatsApp, preços por seção, quantity tiers, multi-álbum, plano UNLIMITED) deixando apenas o fluxo cliente→loja→carrinho→Stripe e seller→estoque→pedido como núcleo.
- **Duração estimada do bootstrap (revisão das 5 etapas + cortes de v0):** 1–2 dias de revisão humana + 1 sprint de execução se a v0 for aprovada como reset.
- **Risco principal:** **a frase da dor não foi inferida com confiança.** O snapshot mostra o que o produto faz, não qual dor justifica reescrever. Sem isso firmado, a v0 proposta é palpite. Esse é o gargalo.

## Estado atual

FigurinhasPro é uma plataforma SaaS pra revendedores brasileiros de figurinhas (Panini, Copa, Champions) montarem vitrine digital com estoque, preços e pedidos. Tem auth próprio (iron-session + bcrypt), checkout Stripe (Starter R$0 / Pro R$29 / Ilimitado R$59), cockpit admin pra gerir o próprio negócio FigurinhasPro como produto (leads, ofertas, experimentos, KPIs) e integração com bot WhatsApp via VPS externa. Stack está em versões recentes (React 19, Next 16, Prisma 7, Tailwind 4, Zod 4) e o repo segue disciplina XP: hook pré-commit roda `test → tsc → build`, ADR 0005 institui TDD com spec evolution, deploy é manual por decisão.

📄 **Snapshot completo:** [`../product-snapshot.md`](../product-snapshot.md)

| Dimensão | Síntese |
|---|---|
| Stack | Next 16 + React 19 + Prisma 7 + Neon Postgres + Tailwind 4 + Zod 4 + Stripe 22 + iron-session + Sentry — Vercel |
| Entidades | 18 modelos (9 núcleo + 9 família `Biz*` cockpit comercial) |
| Páginas | 33 (auth, painel logado, cockpit admin, loja pública, legais) |
| API | 24 endpoints em 8 namespaces (auth, albums, inventory, orders, prices, comercial, stripe, bot) |
| Modelo de negócio | Freemium real com Stripe; planos PRO/UNLIMITED com gates "temporariamente liberados" no código |
| Eventos custom | Sem instrumentação detectada (só Vercel Analytics + Speed Insights automáticos) |

## Estado proposto (5 etapas)

| # | Etapa | Síntese | Arquivo |
|---|---|---|---|
| 1 | Escopo | v0 = 7 fluxos: signup → 1 álbum customizado → estoque mínimo → vitrine pública → carrinho → Stripe checkout → painel pedidos. **Frase da dor pendente de validação humana.** | [etapa-1-escopo.md](etapa-1-escopo.md) |
| 2 | Stack | Manter Next 16 + Prisma 7 + Neon + Vercel. Adicionar shadcn/ui incremental + Umami custom events (pós-v0). Documentar desvio frente ao default Akita (Rails 8 + Hetzner) com justificativa. | [etapa-2-stack.md](etapa-2-stack.md) |
| 3 | Ambiente | Win11 + Git Bash + VS Code. CLAUDE.md/AGENTS.md + hook pré-commit + Vitest setup já prontos. MCPs Context7/Playwright/Vercel ativos. Variáveis críticas auditadas. | [etapa-3-ambiente.md](etapa-3-ambiente.md) |
| 4 | Implementação | Loop SMA: pesquisa → plano → TDD red→green→refactor → implementa → spec evolution → commit → deploy. Restrições: ≤5 arquivos / ≤100 linhas por feature. Deletar Biz* + bot + features avançadas exige backup. | [etapa-4-implementacao.md](etapa-4-implementacao.md) |
| 5 | Deploy | Manter Vercel manual + Neon + Stripe webhook idempotente. Adicionar funil de eventos Umami pós-v0. Rollback via `vercel rollback`. Migrations destrutivas exigem confirmação humana. | [etapa-5-deploy.md](etapa-5-deploy.md) |

## Diff: atual → proposto

| Camada | Atual | Proposto | Mudança |
|---|---|---|---|
| Linguagem | TypeScript 5 | TypeScript 5 | mantido |
| Framework | Next.js 16 | Next.js 16 | mantido |
| DB prod | Neon Postgres | Neon Postgres | mantido |
| ORM | Prisma 7.7 (generator novo) | Prisma 7.7 | mantido |
| Auth | iron-session + bcryptjs | iron-session + bcryptjs | mantido |
| UI | React 19 + Tailwind 4 | React 19 + Tailwind 4 | mantido |
| Componentes | Ad-hoc (3 primitives próprios) | + shadcn/ui (incremental, pós-v0) | adicionado |
| Pagamentos | Stripe SDK 22 | Stripe SDK 22 | mantido |
| Analytics custom | Nenhum | Umami (eventos de funil, pós-v0) | adicionado |
| Hospedagem | Vercel manual deploy | Vercel manual deploy | mantido |
| **Schema** | 18 modelos | **9 modelos núcleo** (remove família Biz* na v0) | **reduzido** |
| **Páginas** | 33 | **~9 páginas no v0** (corta `/painel/comercial/*` admin + `/painel/admin/*` + `/teste` + `/privacidade`/`/termos` + `/onboarding` multi-passo + `/painel/planos`/`/painel/loja` separados) | **reduzido** |
| **API** | 24 endpoints | **~13 endpoints no v0** (remove `/api/bot/*` + `/api/comercial/*` + `/api/prices/sections` + `/api/prices/tiers` + reset/forgot password) | **reduzido** |
| Plano UNLIMITED | Existe (R$59) | **Removido na v0** — só FREE + PRO | reduzido |
| Multi-álbum | Limit 13 | **1 álbum por seller na v0** | reduzido |
| Cockpit comercial | Ativo (`/painel/comercial`) | **Removido na v0**, reintroduzir quando ≥3 vendedores PRO ativos | reduzido |
| Bot WhatsApp | `/api/bot/*` ativo | **Removido na v0**, reintroduzir quando demanda explícita aparecer | reduzido |

## Plano de migração

Não é Port (categoria P) — é uma re-arquitetura/redução **dentro da mesma stack/host**, então o plano não é shadow→canary→cutover. É:

1. **Backup completo do banco** (Neon snapshot + dump SQL local)
2. **Branch `v0-reset`** a partir de `master`
3. **Identificar dados em prod das tabelas Biz*** — exportar como CSV/JSON pra arquivar
4. **Remover (em commits atômicos separados):**
   - Família `Biz*` do schema + Server Actions + páginas `/painel/comercial/*` + componentes
   - Endpoints `/api/bot/*`
   - Endpoints `/api/prices/sections` e `/api/prices/tiers` + componentes editor relacionados
   - Reset/forgot password endpoints + páginas
   - Plano UNLIMITED de `PLAN_LIMITS` e `PLANS`
5. **Migration destrutiva:** `npx prisma migrate dev --create-only` → revisar SQL → aplicar com confirmação humana
6. **Smoke test E2E** (Playwright): signup → criar álbum → adicionar estoque → publicar loja → cliente compra → seller vê pedido
7. **Deploy v0** em URL temporária (Vercel preview) primeiro
8. **Cutover:** promover preview a prod, manter o `master` antigo na branch `pre-v0-archive` por 30 dias
9. **Métrica de sucesso v0:** primeira conversão FREE→PRO em vendedor que entrou pós-cutover

## Riscos e perguntas abertas

1. **Frase da dor não foi inferida com confiança.** O snapshot mostra o produto, não a justificativa pra reescrever. Sem essa frase firmada, a v0 proposta é chute. **Humano deve responder antes de mexer:** qual é a dor que motiva esta re-arquitetura — *adoção/conversão de vendedor*, *time gastando muito tempo mantendo cockpit*, *cockpit não está dando insight*, *outra*?
2. **Cockpit comercial tem dados em produção** (seed populado em algum momento). Removê-lo na v0 implica em decidir se os dados (BizLead, BizActivity, BizExperiment) viram CSV arquivado, migram pra tracker externo, ou ficam offline mas no DB.
3. **Bot WhatsApp tem integração HMAC com VPS externa do workspace.** Removê-lo do P8 não derruba a VPS, mas deixa o n8n VPS chamando endpoint que não existe. Coordenar com o owner do workflow n8n antes de cortar.
4. **Plan gates "temporariamente liberados"** (`plan-limits.ts:74`) — se restaurar gates como parte do v0, **alguns vendedores existentes podem perder acesso a features** que estão usando. Verificar quem está hoje em FREE com >100 stickers, >10 orders/mês ou >1 álbum.
5. **`UNLIMITED` removido da v0** mas há `STRIPE_PRICE_UNLIMITED` configurado em prod. Se algum cliente já assinou esse plano, precisa de plano de migração específico.
6. **Categoria** confirmada como W, mas o método Akita default pra W é Rails 8.1 + Hetzner. **Decisão consciente:** rejeitar default por ROI (equipe TS, infra Vercel paga, 12 outros projetos workspace na mesma stack). Documentar como ADR pra evitar revisitação futura.
7. **`onboardingStep`** no `Seller` é Int (não enum) — qualquer mudança no fluxo de onboarding pode silenciosamente bagunçar usuários existentes em estados intermediários. Inventariar antes de mexer.

## Próximo passo

1. **Revisar `product-snapshot.md`** (estado atual factual — 5 min)
2. **Revisar `akita/etapa-1-escopo.md`** — gastar tempo aqui. **Definir a frase da dor.** Sem isso firmado, etapas 2–5 não são acionáveis.
3. **Decidir se a v0 enxuta proposta é o caminho** ou se é só refactor incremental sem cortes drásticos. Se for incremental, a Etapa 4 muda: ordem técnica de melhoria contínua em vez de reset.
4. **Editar etapas 2–5** conforme decisão da etapa 1. Específico:
   - Etapa 2: confirma decisão de manter stack + adições (shadcn, Umami)
   - Etapa 3: confirma se vale enxugar CLAUDE.md ou manter rico
   - Etapa 4: ordem das features depende da dor
   - Etapa 5: confirma manter Vercel manual deploy
5. **Quando todos artefatos estiverem revisados/editados, remover os headers `⚠ AUTO-GERADO`** — esse é o sinal explícito de que o doc agora tem aval humano.
6. **Iniciar implementação** com `/akita-bootstrap:akita-etapa-4-implementacao` no modo interativo, validando o draft passo-a-passo.

---

_Blueprint v1, gerado em 2026-04-28. Re-rode `/akita-bootstrap:akita-blueprint` se o projeto-fonte mudou substancialmente._
