> ⚠ AUTO-GERADO via /akita-bootstrap:akita-blueprint em 2026-04-28
> Revise e edite antes de tratar como decisão. O método Akita exige disciplina humana.

# Etapa 1 — Escopo e Filosofia (DRAFT)

## A dor concreta (inferida)

Vendedor de figurinhas (revendedor brasileiro de álbuns Panini/Copa/Champions) gasta horas atualizando estoque em planilha + respondendo cliente no WhatsApp item-por-item ("tem a 234?", "quanto a brilhante 12?"), sem vitrine pública pra cliente consultar sozinho. O sistema atual já resolve a vitrine + estoque + preços + Stripe, mas a feature crítica `BizLead`/cockpit comercial mostra que a dor *real do dono do produto* hoje é **conversão de revendedor pra plano pago** — não retenção de revendedor existente.

> Frase candidata pra v0 de re-arquitetura:
> "Revendedor que assina o FREE não passa pra PRO porque os limites (100 stickers, 1 álbum) são vagos quando ele instala — ele não sente a dor antes de bater no teto, e quando bate, já abandonou."

`<NÃO INFERIDO COM CERTEZA — humano deve confirmar/refinar a dor>` — o snapshot mostra **o que o produto faz**, não **qual dor justifica reescrever**. Se a re-arquitetura é só técnica (limpar débito, trocar stack), a frase da dor é outra: "time gasta X horas/semana mantendo Y".

## Critério de v0 (inferido)

A menor parte funcional do produto atual capaz de demonstrar valor end-to-end:

> **Vendedor cria conta → adiciona 1 álbum customizado → cadastra estoque de 10 figurinhas → publica vitrine pública → cliente vê vitrine, monta lista, recebe link de pagamento Stripe → vendedor vê pedido no painel.**

Tudo o resto (regras de preço por seção, quantity tiers, cockpit comercial admin, bot WhatsApp, multi-álbum, plano PRO/UNLIMITED) está fora dessa v0.

## Fora do escopo desta v0

- **Cockpit comercial admin** (`/painel/comercial/*`, 7 sub-módulos, família `Biz*` de 9 modelos) — é gestão interna do FigurinhasPro como produto, não core do que o revendedor compra. Vista em `prisma/schema.prisma:155-295` e `src/app/painel/comercial/`.
- **API bot WhatsApp** (`/api/bot/stickers`, `/api/bot/quote`, `/api/bot/quote/[ref]`) — integração com VPS n8n + Chatwoot, depende de secret HMAC e infra externa. Vista em `src/app/api/bot/*`.
- **Sistema de preços por seção/país** (`SectionPriceRule`, FLAT/OFFSET) — feature avançada que poucos vendedores usam no início. Vista em `prisma/schema.prisma:115` e `src/components/painel/precos-album-editor.tsx`.
- **Quantity tiers** (descontos progressivos por volume) — idem, feature avançada. Vista em `prisma/schema.prisma:128`.
- **Onboarding multi-passo + checklist visual** (`Seller.onboardingStep`, `components/painel/onboarding-checklist.tsx`) — pode ser substituído por fluxo linear na v0.
- **Reset de senha + verificação de email** (`/esqueci-senha`, `/reset-senha`, `/verificar-email`) — auth básica sem recuperação serve pro v0.
- **Páginas legais** (`/privacidade`, `/termos`) — adicionar quando sair do v0.
- **Plano UNLIMITED + features `reports`/`priority_support`** (`PLAN_LIMITS.UNLIMITED` em `src/lib/plan-limits.ts:16`) — manter só FREE + PRO no v0.
- **Sentry + Vercel Speed Insights** — observability fica pra fase posterior.
- **Multi-álbum (`maxAlbums: 13`)** — começar com 1 álbum por seller no v0.

## Categoria provisória

**W** (Web app)

Inferência:
- Snapshot tem 33 páginas Next.js + 24 endpoints API + DB Postgres com 18 entidades → claramente W.
- Não é P (Port), porque a stack-alvo default é "manter" — Next 16 + Prisma 7 + Postgres é stack moderna e adequada ao caso (e-commerce SaaS B2B).
- Não é C (CLI), porque o produto inteiro vive em UI/loja pública.

(Confirmada na Etapa 2.)

## Filosofia aceita

- **Software é argila, não LEGO.** O cockpit comercial (`Biz*`) foi acrescentado depois — não tinha nas primeiras versões. Próxima fatia muda forma de novo.
- **Vibe coding com disciplina, não sem.** Hook pré-commit já roda `test → tsc --noEmit → build`. Disciplina enforced.
- **Software nunca está pronto.** PLANS estão "temporariamente liberados" (gates retornam allowed:true) — sinal claro de que o produto navega adaptando-se ao mercado.
- **Validar antes de codar.** Cockpit comercial existe pra validar canal/oferta/preço *antes* de mexer no produto core.

## Sinais de alerta para o método

- Se estou pesquisando frameworks antes de saber o que vai construir → estou pulando esta etapa
- Se acho que "começar pequeno" tem 8 páginas de escopo → não cortei suficiente (snapshot atual = 33 páginas; v0 proposta acima = ~7)
- Se penso "depois eu defino o escopo certo, agora quero codar" → estou em Frank Yomik mode

---

**Próxima etapa:** `/akita-bootstrap:akita-etapa-2-stack` (ou continue revisando este draft)

**Fontes do auto-preenchimento:**
- `product-snapshot.md` seções: Modelo de Negócio, Páginas, Entidades
- `prisma/schema.prisma:12-295` — modelos Seller + Biz*
- `src/lib/plan-limits.ts:3` — PLAN_LIMITS
- `src/lib/stripe.ts:19` — PLANS
- `src/app/api/bot/*` — integração externa
- `CLAUDE.md` (FigurinhasPro) — estado declarado de gates "temporariamente desabilitados"
