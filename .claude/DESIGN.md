---
extracted_at: 2026-04-21
confidence: high
stack: Next.js 16 + React 19 + Tailwind v4 + Prisma 7 + Neon + Stripe + iron-session + Sentry
sources:
  - .claude/DESIGN_SYSTEM.md
  - .claude/design-tokens.json
  - app/globals.css
  - CLAUDE.md + AGENTS.md
---

# DESIGN.md — FigurinhasPro (P8)

Álbum digital consumer-facing para colecionadores de figurinhas Copa 2022 + cockpit comercial admin-only embutido. Identidade **cinematic-dark colecionável** — canvas escuro azulado `#0b0e14` que faz os stickers brilharem, amber `#fbbf24` como único sinal de marca, 11 keyframes custom celebrando o hobby (sticker-glow, ticker, float-slow, cart-bounce). **NÃO usa shadcn** — classes utilitárias ad-hoc em `globals.css`.

## §1 Visual Theme

- **Family anchor:** `cinematic-dark` + `colecionavel-editorial`
- **Elevator:** _"Vitrine de colecionáveis premium — cinematic dark com energia de abrir pacotinho."_
- **Mood (3 adjetivos):** editorial · colecionável · cinematográfico
- **Canonical inspiration:** Linear dark mode + vitrines de NBA Top Shot + hero editorial de magazines sports (Panini)
- **Do's:** amber em gradiente é assinatura única; micro-animações celebrando ações (cart-bounce, sticker-glow); hero com H1 gigante (`text-7xl xl:text-[84px] font-black`) e palavra-chave em amber; ticker horizontal logo abaixo do hero; stickers flutuando (`float-slow`); tipografia Geist Mono para métricas/assinaturas
- **Don'ts:** não trazer shadcn — P8 é ad-hoc intencional; não usar light mode (dark-only); não quebrar o fluxo editorial com cards enterprise frios; não usar gold `#d4af37` (P1) — aqui é amber `#fbbf24`; cockpit admin mantém mesma paleta (não virar SaaS neutro)

## §2 Color Palette

Dark-only. Canvas fixo `body { background: #0b0e14 }`. Tokens HEX diretos em CSS custom properties.

### Canvas / Surface
| Token | Valor | Uso |
|---|---|---|
| `background` | `#0b0e14` | canvas escuro azulado (body) |
| `foreground` | `#e8eaed` | texto principal |
| section-alt | `#0d1017` | seções pares (landing) com `border-t` |
| card | `#0f1219` | cards/panels (landing novas, FAQs, pricing) |
| `--card` legacy | `#111318` | substituído por `#0f1219` nas páginas novas |
| elevated | `#1a1f2e` | sticker padrão |

### Primary — Escala Amber (brand Arena Cards)
| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#fbbf24` | amber-400 — brand, eyebrow, CTA text |
| `--accent-hover` | `#f59e0b` | amber-500 — hover CTA |
| `#d97706` | amber-600 | gradient end botão primário |
| `#92400e` | amber-800 | profundidade gradients sticker holo |
| `#78350f` | amber-900 | base gradients sticker legend |

### Feedback
| Token | Valor | Uso |
|---|---|---|
| success | `#34d399` | emerald — confirmação |
| warning | `#fbbf24` | amber (= accent) — avisos |
| error | `#f87171` | rose — erros, delete |
| info | `#60a5fa` | blue — informacional |

### Border
- border-subtle: `rgba(255,255,255,0.08)` — divisores padrão
- border-strong: `rgba(255,255,255,0.14)` — destaques, card ativo

## §3 Typography

| Token | Valor | Uso |
|---|---|---|
| `--font-sans` | `var(--font-geist-sans)` | UI, body |
| `--font-mono` | `var(--font-geist-mono)` | métricas, assinaturas, código |

### Escala Tailwind + custom hero
`text-sm` `0.875rem` · `base` `1rem` · `lg` `1.125rem` · `xl` `1.25rem` · `2xl` `1.5rem` · `3xl` `1.875rem` · `4xl` `2.25rem` · `5xl` `3rem` · `6xl` `3.75rem` · `7xl` `4.5rem` · **`text-[84px]`** (hero xl+)

### Weights
`400` regular · `500` medium · `700` bold · **`900` black** (hero H1)

### Padrões canônicos
- **Hero H1:** `text-7xl xl:text-[84px] font-black leading-[0.95] tracking-tight` — palavra-chave em `text-amber-400`
- **Eyebrow:** `text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em]` acima de cada headline de seção
- **Ticker:** métricas em `font-mono` looping infinito (42s linear)
- **Pain:** `line-through text-gray-500` · **Fix:** `text-gray-100`
- **Final CTA:** headline `text-7xl` + assinatura em `font-mono`
- **Body:** `text-sm` ou `text-base` regular
- **Footnotes:** `text-xs text-gray-500`

## §4 Components

### Stack canônica
- **Componentes React:** `src/components/` (sem shadcn — ad-hoc com classes utilitárias em `globals.css`)
- **Cockpit admin:** `src/app/painel/comercial/*` (7 submódulos: Dashboard, Leads, Ofertas, Experimentos, Iniciativas, Tarefas, KPIs)
- **Escanear antes de criar** — app tem muito componente custom (cart drawer, sticker card, album grid, toast, hero, etc.)

### Classes utilitárias em `globals.css`
| Classe | Uso |
|---|---|
| `.badge` + `.badge-{zinc,blue,green,amber,red}` | tags coloridas por estado |
| `.btn-primary` | CTA amber gradient `#f59e0b→#d97706`, texto preto |
| `.btn-ghost` | neutro dark (transparente, borda sutil) |
| `.ticker-track` | faixa AO VIVO loop infinito 42s linear |
| `.float-slow` | sticker flutuante 6s ease-in-out |
| `.sticker-added`, `.cart-badge-bounce` | feedback de carrinho |
| `.toast-enter`, `.toast-exit` | animações de toast |
| `.slide-up`, `.fade-in`, `.slide-in`, `.count-up`, `.shimmer`, `.pulse-dot` | primitivos de motion |

### Forms
- Server Actions (cockpit usa `actions.ts` centralizado com 15 actions)
- Padrão `?new=1` no searchParam exibe form de criação em Server Component (sem estado client)
- Zod 4 para validação — reescrita completa do Zod 3, performance 2-7x melhor
- Toasts custom (não Sonner) via `.toast-enter`/`.toast-exit`

### Cart (consumer)
- Drawer lateral com `slide-in-right` ao abrir
- Adicionar item dispara `cart-badge-bounce` no ícone header + `sticker-added` no card de origem
- Desconto por quantidade aplicado no total (não por item) — ver `src/lib/price-resolver.ts`
- Sistema de preços em 3 eixos: Individual > Seção > Por Tipo (album) > Global por Tipo > Padrão

### Painel admin (cockpit comercial)
- Kanban 4 colunas em `/iniciativas` (BACKLOG→PLANNED→IN_PROGRESS→DONE)
- Pipeline CRM em `/leads` (PROSPECT→WON/LOST)
- Dashboard com métricas de produto, pipeline, tarefas urgentes
- KPIs com histórico + delta + target + mini-gráficos
- Guard via `ADMIN_EMAIL` env var (`src/lib/admin.ts`)

## §5 Layout

### Landing (consumer)
- **Hero:** H1 gigante + collage lateral (`lg+`) com mock panel + stickers flutuantes (`float-slow`)
- **Ticker:** full-width logo abaixo do hero, duplicação do conteúdo com `aria-hidden` na segunda cópia
- **Pain → Fix grid:** 3 colunas (`lg`), card `#0f1219`
- **Product showcase:** painel mockup de 24 stickers (grid 5/7/8 cols) ao lado de lista editorial de features
- **Pricing:** 3 cards, plano destacado com `ring amber` + ribbon "Mais escolhido" em `-top-3`
- **FAQ accordion:** `<details>` nativo com `+` girando 45° no `group-open`
- **Final CTA:** ambient `radial-gradient` amber, headline `text-7xl`, assinatura em Geist Mono

### Painel (consumer logado)
- Mobile-first com `viewportFit: "cover"`, safe-area-bottom, bottom nav
- Touch targets mínimo 44px
- Grid de stickers com `.sticker-glow` em cards raros

### Cockpit (admin)
- Sidebar + main
- Tabs em `src/components/painel/comercial/comercial-tabs.tsx`
- Kanban horizontal em iniciativas (scroll horizontal em mobile)

### Spacing
Tailwind default.

### Radius
Tailwind default (`rounded-md` · `rounded-lg` · `rounded-xl`). Ribbon "Mais escolhido" usa `rounded-full`.

## §6 Depth & Elevation

Surface ladder de 3 níveis (menos granular que P1/P2). Dramatização vem de gradients amber + motion, não de shadow.

| Nível | Surface | Border | Uso |
|---|---|---|---|
| 0 | `#0b0e14` (canvas body) | — | app shell |
| 1 | `#0d1017` ou `#0f1219` | `rgba(255,255,255,0.08)` | seções alt, cards, FAQs, pricing |
| 2 | `#1a1f2e` | `rgba(255,255,255,0.14)` | sticker padrão, elevated |
| 3 | Custom ring amber + ribbon | amber glow | pricing destacado, CTA ativo |

### Shadow
Tailwind default + keyframes custom (`sticker-glow` halo amber pulsante).

### Motion (11 keyframes canônicos em `globals.css`)
| Keyframe | Duração | Uso |
|---|---|---|
| `slide-up` | cubic-bezier(0.16,1,0.3,1) | entrada de conteúdo editorial |
| `fade-in` | `0.3s` | fade simples |
| `sticker-glow` | pulsante | halo amber em figurinhas raras |
| `slide-in-right` | — | gaveta lateral (cart drawer) |
| `cart-bounce` | — | feedback ao adicionar ao carrinho |
| `toast-in` / `toast-out` | — | entrada/saída de toasts |
| `shimmer` | `1.5s infinite` | skeleton loading |
| `ticker` | `42s linear` | loop horizontal (`.ticker-track`) |
| `float-slow` | `6s ease-in-out` | stickers flutuantes (`.float-slow`) |
| `pulse-dot` | `1.2s` | bolinha pulsante em status badges |

### Acessibilidade
`@media (prefers-reduced-motion: reduce)` zera animações globalmente.

## §7 Do's & Don'ts

### Do's
- **Amber `#fbbf24`** como único brand color — usar em eyebrow, gradient CTAs, ring de destaque, headline keyword
- Motion celebrando ações (cart-bounce, sticker-glow, float-slow)
- Hero editorial com H1 `text-7xl xl:text-[84px] font-black` e palavra-chave em amber
- Ticker horizontal logo abaixo do hero com métricas em `font-mono`
- Eyebrow `text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em]` acima de toda headline
- Tipos de figurinha centralizados em `src/lib/sticker-types.ts` — valores internos (`regular`, `foil`, `shiny`) nunca mudam; labels via `getStickerTypeConfig()`
- Formatters centralizados; preços via `resolveUnitPrice()` do `price-resolver.ts` (hierarquia 5 níveis)
- Server Components default; `'use client'` só com hooks/events
- Mobile-first com bottom nav, safe-area-bottom, touch targets 44px+
- `@media (prefers-reduced-motion: reduce)` sempre respeitado
- Cockpit admin mantém paleta amber (não virar SaaS neutro)

### Don'ts
- Não introduza shadcn — P8 é ad-hoc intencional, adicionar shadcn quebra a identidade editorial
- Não use light mode (dark-only)
- Não use gold `#d4af37` do P1 — aqui é amber `#fbbf24` (Tailwind amber-400)
- Não use `useMemo`/`useCallback`/`React.memo` — React Compiler otimiza
- Não renderize preço ignorando `price-resolver.ts` (pula desconto de quantidade / regra por seção)
- Não hardcode labels de tipo de figurinha — usar `getStickerTypeShortLabel()`
- Não acesse `cookies()` / `params` / `headers()` síncronos — Next 16 removeu, sempre `await`
- Não mexa em animação sem testar `prefers-reduced-motion`
- Não acumule commits sem deploy — `npx vercel deploy --prod` obrigatório após `git push` (auto-deploy desativado)

## §8 Responsive

Tailwind default + mobile-first. Viewport com `viewportFit: "cover"` + safe-area-bottom.

| Token | Min-width |
|---|---|
| `sm` | `640px` |
| `md` | `768px` |
| `lg` | `1024px` |
| `xl` | `1280px` |
| `2xl` | `1536px` |

### Regras
- **Mobile (`<md`):** bottom nav; H1 escala para `text-5xl` / `text-6xl`; collage do hero escondido; ticker mantém; kanban horizontal scroll
- **Tablet (`md`):** 2-col grids; H1 `text-6xl` / `text-7xl`
- **Desktop (`lg+`):** hero com collage lateral; H1 `text-7xl`; pricing 3-col
- **Desktop XL (`xl+`):** H1 `text-[84px]`; showcase grid de 24 stickers em 8 cols
- **Touch targets:** mínimo 44×44px (Apple HIG)
- **Safe area:** botões flutuantes com `pb-[env(safe-area-inset-bottom)]`

## §9 Agent Prompt

```
You are generating UI for **FigurinhasPro** (P8 — Next.js 16 + Prisma 7 + Neon + Stripe + iron-session, CINEMATIC-DARK COLECIONÁVEL).

Family: cinematic-dark + colecionavel-editorial. Vibe: vitrine premium de colecionáveis, hero editorial, motion celebrando ações. AD-HOC — NÃO USA SHADCN.

Stack OBRIGATÓRIA:
- Next.js 16 App Router + React 19 + Turbopack + React Compiler. Server Components default.
- Tailwind v4 CSS-first com @theme inline em app/globals.css. Sem tailwind.config.js.
- Classes utilitárias ad-hoc em globals.css (.badge, .btn-primary, .btn-ghost, .ticker-track, .float-slow, etc.).
- Prisma 7.7 com generator "prisma-client" novo + PrismaNeon WebSocket Pool + Lazy Proxy em src/lib/db.ts.
- Auth iron-session + bcryptjs. Pagamentos Stripe. Monitoring Sentry. Env validation Zod 4.

Paleta (dark-only, HEX direto):
- Canvas body #0b0e14, foreground #e8eaed.
- Surfaces: #0d1017 section-alt, #0f1219 card, #1a1f2e elevated.
- Primary AMBER #fbbf24 (Tailwind amber-400) + hover #f59e0b + CTA gradient end #d97706 + profundidade #92400e/#78350f.
- Feedback: #34d399 success, #fbbf24 warning, #f87171 error, #60a5fa info.
- Borders: rgba(255,255,255,0.08) subtle / rgba(255,255,255,0.14) strong.

Tipografia:
- Geist Sans (body) + Geist Mono (métricas, assinaturas, código, ticker).
- Hero H1: text-7xl xl:text-[84px] font-black leading-[0.95] tracking-tight — palavra-chave em text-amber-400.
- Eyebrow OBRIGATÓRIO acima de headline: text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em].
- Pain text-gray-500 line-through / Fix text-gray-100.

Padrões canônicos:
- Hero editorial com collage lateral (lg+) + stickers flutuantes (.float-slow).
- Ticker full-width logo após hero (42s linear, conteúdo duplicado com aria-hidden).
- Pain → Fix grid 3-col (lg) com card #0f1219.
- Product showcase: mockup de 24 stickers (5/7/8 cols) ao lado de lista editorial.
- Pricing 3-card, destacado com ring amber + ribbon "Mais escolhido" -top-3.
- FAQ accordion via <details> nativo com + girando 45°.
- Final CTA: ambient radial-gradient amber + headline 7xl + assinatura font-mono.
- Cart drawer com slide-in-right + cart-bounce no badge + sticker-added no card.
- Cockpit admin (/painel/comercial) com sidebar + tabs + kanban 4-col (BACKLOG→DONE) + pipeline CRM (PROSPECT→WON/LOST) + KPIs com delta/target.
- Forms: Server Actions centralizadas em actions.ts + padrão ?new=1 para criação em Server Component.
- Preços via resolveUnitPrice() — hierarquia Individual > Seção > Tipo(album) > Tipo(global) > Padrão.
- Tipos sticker via getStickerTypeConfig() / getStickerTypeShortLabel() — labels "Normal/Especial/Brilhante".

Motion (11 keyframes custom): slide-up, fade-in, sticker-glow, slide-in-right, cart-bounce, toast-in/out, shimmer, ticker (42s), float-slow (6s), pulse-dot.
Acessibilidade: @media (prefers-reduced-motion: reduce) zera animações.

Mobile-first: bottom nav, safe-area-bottom, touch targets 44px+, viewportFit cover.

Proibido: introduzir shadcn (quebra identidade), usar light mode, usar gold #d4af37 do P1, useMemo/useCallback/React.memo, renderizar preço ignorando price-resolver.ts, hardcode labels de tipo de figurinha, acessar cookies/params/headers síncronos, ignorar prefers-reduced-motion.

Saída: JSX com classes utilitárias ad-hoc + Tailwind + dark por default. Server Component por default.
```
