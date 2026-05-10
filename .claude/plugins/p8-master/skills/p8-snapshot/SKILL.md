---
name: p8-master:p8-snapshot
description: Auto-ativa quando o usuário pedir "snapshot do produto", "estado atual de P8-FigurinhasPro", "resumo técnico", ou "documentação consolidada". Extrai 6 seções fixas (Modelo de Negócio, Entidades, Stack, Custom Events, Páginas e Design) do P8-FigurinhasPro e gera `product-snapshot.md` no projeto. Útil pra onboarding, código review, briefing executivo.
argument-hint: "[--output path/para/snapshot.md, default: product-snapshot.md na raiz]"
---

Vou gerar snapshot do produto P8-FigurinhasPro.

## Sequência

1. **Spawn `extrator` (Haiku)** com `scripts/inventory.py` no projeto P8.

2. **Para cada seção, spawn `analista-gerador` (Sonnet)** ou usar inline:

### Seção 1: Modelo de Negócio
- Extrai de [package.json](../../../../package.json) (dependências relevantes: stripe, iron-session, etc.)
- Extrai de [docs/PLANO_SAAS_V2.md](../../../../docs/PLANO_SAAS_V2.md) e [docs/DOCUMENTACAO_NEGOCIO_MONETIZACAO.md](../../../../docs/DOCUMENTACAO_NEGOCIO_MONETIZACAO.md)
- Síntese: SaaS de revendedoras de figurinhas, planos FREE/PRO/UNLIMITED, 7.122 cards em 13 Copas

### Seção 2: Entidades (Schema Prisma)
- Lê [prisma/schema.prisma](../../../../prisma/schema.prisma)
- Lista 18 modelos com função:
  - `Seller`, `CustomAlbum`, `Inventory`, `Order`, `OrderItem`
  - `PriceRule`, `SectionPriceRule`, `QuantityTier`, `SubscriptionEvent`
  - `BizLead`, `BizActivity`, `BizOffer`, `BizExperiment`
  - `BizInitiative`, `BizMilestone`, `BizTask`, `BizKpi`, `BizKpiSnapshot`
- Para cada: campos chave + relacionamentos + função

### Seção 3: Stack
- Lista de [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) (já consolidado)
- Versões atuais lidas de package.json
- Breaking changes notáveis (Next 16 async APIs, Prisma 7 driver adapter, Tailwind 4 CSS-first, Zod 4 reescrita, React 19 Compiler)

### Seção 4: Custom Events
- Webhooks Stripe (`/api/stripe/webhook`)
- Server Actions cockpit comercial (`src/app/painel/comercial/actions.ts`)
- Cron jobs Vercel (se houver)
- Hooks de Server Components

### Seção 5: Páginas
Lista rotas em [src/app/](../../../../src/app/) agrupadas:
- Públicas: `/`, `/loja/[slug]`, `/loja/[slug]/[albumSlug]`, `/(auth)/*`
- Vendedor (autenticado): `/painel`, `/painel/estoque`, `/painel/precos`, `/painel/pedidos`, `/painel/loja`, `/painel/planos`
- Admin (cockpit comercial, gate `ADMIN_EMAIL`): `/painel/comercial/*` (7 sub-módulos)
- API: `/api/auth/*`, `/api/stripe/*`, `/api/inventory/*`, `/api/orders/*`, `/api/prices/*`, `/api/comercial/*`, `/api/bot/*`, `/api/albums/*`

### Seção 6: Design
- Tailwind 4 CSS-first via `@theme inline` em [src/app/globals.css](../../../../src/app/globals.css)
- Mobile-first (`viewportFit: "cover"`, safe-area-bottom, bottom nav, touch targets ≥44px)
- Geist fonts (Geist Sans + Geist Mono)
- Dark mode default

3. **Compila em `product-snapshot.md`** (default na raiz P8) com frontmatter:

```yaml
---
data: <currentDate>
tipo: snapshot
projeto: P8-FigurinhasPro
versao: <git short SHA>
gerado-por: /p8-master:p8-snapshot
secoes: 6
---
```

4. **Sumário curto no final** — 5-7 frases CEO-level.

5. **Mostra caminho** do snapshot gerado.

## Restrições

- **Não modifica código.** Só extrai + redige.
- **Não inventa números.** Quantidades vêm de inventário ou de docs vivas (PLANO_SAAS_V2 etc.).
- **Não inclui secrets** mesmo se aparecem em env.ts (mascara `STRIPE_SECRET_KEY=***`).
- **Output é relatório vivo** — pode ser regenerado a qualquer momento. Se já existir snapshot, faz backup em `product-snapshot.bak.<data>.md`.

## Modelo recomendado

- **Main session: Sonnet** — extração + redação estruturada.
- **Sub-agents:** `extrator` (Haiku) + `analista-gerador` (Sonnet).

## Quando usar

- Onboarding de novo dev (consultor lê snapshot em 5min).
- Briefing executivo (status/ownership do produto).
- Antes de Oracle (snapshot leve, depois decide se Oracle vale a pena).
- Pré-PR grande (consolidar mudanças contra estado atual).

## Ver também

- [agents/extrator.md](../../agents/extrator.md), [agents/analista-gerador.md](../../agents/analista-gerador.md)
- [scripts/inventory.py](../../scripts/inventory.py)
- [P8-FigurinhasPro/docs/INDEX.md](../../../../docs/INDEX.md) — outras docs vivas
