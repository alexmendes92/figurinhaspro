# DESIGN_SYSTEM.md — P8 Figurinhas Pro

**Extracted at:** 2026-04-19 (reconciliado)
**Detection confidence:** high
**Source:** `app/globals.css` (~215 linhas), `app/page.tsx`, `package.json`

## 1. Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"`)
- **Component library:** ad-hoc + classes utilitárias (badge, btn-primary, btn-ghost)
- **Fonts:** Geist Sans + Geist Mono (next/font)
- **ORM:** Prisma 7 + Neon
- **Deploy:** Vercel
- **Component directory:** `components/`
- **Tema:** dark-only (body fixo `#0b0e14`)

## 2. Color tokens

### 2.1 Canvas / Surface

- `background: #0b0e14` (canvas escuro azulado — body)
- `foreground: #e8eaed` (quase branco)
- Surfaces (usadas em cards, painéis, seções):
  - `#0d1017` — section alt (usado em seções pares com `border-t`)
  - `#0f1219` — card/panel surface (cards, mockups, FAQs, pricing)
  - `#111318` — legado `--card` (substituído por `#0f1219` nas landing pages novas)
  - `#1a1f2e` — surface elevated (sticker padrão)

### 2.2 Primary (escala amber)

- `--accent: #fbbf24` (amber-400 — brand Arena Cards)
- `--accent-hover: #f59e0b` (amber-500)
- `#d97706` (amber-600 — botão primário gradient end)
- `#92400e` (amber-800) + `#78350f` (amber-900) — profundidade em gradientes decorativos de sticker (holo/legend)

### 2.3 Feedback

- success: `#34d399` (emerald)
- warning: `#fbbf24` (amber = accent)
- error: `#f87171` (rose)
- info: `#60a5fa` (blue)

### 2.4 Border

- border-subtle: `rgba(255,255,255,0.08)`
- border-strong: `rgba(255,255,255,0.14)`

## 3. Typography

- `--font-sans: var(--font-geist-sans)`
- `--font-mono: var(--font-geist-mono)`
- Escala via Tailwind default (`text-sm` → `text-4xl`)

## 4. Spacing

Tailwind default.

## 5. Radius

Tailwind default (`rounded-md`, `rounded-lg`, `rounded-xl`).

## 6. Shadow

Tailwind default + keyframes custom.

## 7. Motion

Keyframes custom definidos no globals.css:
- `@keyframes slide-up` — entrada de conteúdo editorial (cubic-bezier 0.16,1,0.3,1)
- `@keyframes fade-in` — fade simples 0.3s
- `@keyframes sticker-glow` — halo amber pulsante em cards de figurinha
- `@keyframes slide-in-right` — gaveta lateral (cart drawer)
- `@keyframes cart-bounce` — feedback de adição ao carrinho
- `@keyframes toast-in` / `toast-out` — entrada/saída de toasts
- `@keyframes shimmer` — skeleton loading (1.5s infinite)
- `@keyframes ticker` — loop horizontal infinito (42s linear) usado em `.ticker-track`
- `@keyframes float-slow` — oscilação vertical 6s usada em `.float-slow` (stickers flutuantes)
- `@keyframes pulse-dot` — bolinha pulsante (1.2s) em status badges
- Acessibilidade: `@media (prefers-reduced-motion: reduce)` zera animações globalmente
- Easings: cubic-bezier(0.16,1,0.3,1) para entradas suaves, `ease-in-out` para loops

## 8. Breakpoints

Tailwind default.

## 9. Components (classes utilitárias)

- `.badge` + variantes `.badge-zinc`, `.badge-blue`, `.badge-green`, `.badge-amber`, `.badge-red` — tags coloridas por estado
- `.btn-primary` — CTA amber (gradient `#f59e0b→#d97706`, texto preto)
- `.btn-ghost` — neutro dark (transparente, borda sutil)
- `.ticker-track` — faixa de AO VIVO em loop infinito (42s linear)
- `.float-slow` — sticker flutuante 6s ease-in-out (respeita `prefers-reduced-motion`)
- `.sticker-added`, `.cart-badge-bounce` — feedback de carrinho
- `.toast-enter`, `.toast-exit` — animações de toast
- `.slide-up`, `.fade-in`, `.slide-in`, `.count-up`, `.shimmer`, `.pulse-dot` — primitivos de motion

Componentes React em `components/`. Escanear antes de criar novos.

## 10. Composition patterns

- Grid de stickers/figurinhas (cards com `sticker-glow`)
- Cart drawer (`cart-bounce` + `slide-in-right` ao adicionar)
- Toast notifications (`toast-in`/`toast-out`)
- Dashboard product listing
- **Hero editorial**: H1 com `text-7xl xl:text-[84px] font-black leading-[0.95] tracking-tight`, palavra-chave em `text-amber-400`, collage lateral (lg+) com mock panel + stickers flutuantes (`float-slow`)
- **Eyebrow**: `text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em]` acima de cada headline de seção
- **Ticker**: faixa full-width logo abaixo do hero com métricas em Geist Mono, duplicação do conteúdo para loop infinito com `aria-hidden` na segunda cópia
- **Pain → Fix grid**: 3 colunas (lg) com card `#0f1219`, pain em `line-through text-gray-500`, fix em `text-gray-100`
- **Product showcase**: painel mockup de 24 stickers (grid 5/7/8 cols) ao lado de lista editorial de features com divisores `border-white/[0.06]`
- **Pricing**: 3 cards, plano destacado com ring amber + ribbon "Mais escolhido" posicionado `-top-3`
- **FAQ accordion**: `<details>` nativo com `+` girando 45° no `group-open`
- **Final CTA**: ambient radial-gradient amber, headline 7xl, assinatura em Geist Mono

## 11. Accessibility baseline

WCAG AA. Amber sobre canvas escuro passa 4.5:1.

## 12. Gaps

- Surface ladder de 3 níveis (menos granular que P1/P2)
- Classes utilitárias definidas manualmente — sem shadcn
- Sem light mode
