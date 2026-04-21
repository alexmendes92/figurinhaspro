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

## 11. Route variants

Algumas rotas precisam de identidade própria — uma vitrine pública tem requisitos diferentes de um painel admin. Em vez de forçar uniformidade, declaramos variantes formais. Cada variante vive em um CSS module escoped à rota e NÃO deve vazar para fora dela.

### 11.1 Variante "vitrine" (`/loja/**`)

Rota pública consumer-facing. Otimiza densidade + drama editorial + percepção de produto premium. Diverge intencionalmente do core para lembrar marketplace colecionável (NBA Top Shot, Panini sports magazines), não SaaS Arena.

**Escopo:** `src/components/loja/store-album-view.module.css` + componentes em `src/components/loja/*`. Ativado pelo CSS module (`.root` scoping) no `<StoreAlbumView>`.

**Tokens próprios (sobrescrevem §2 dentro do escopo):**

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#05070b` | canvas mais fundo que core, contraste maior com stickers |
| `--bg-2` | `#0a0d13` | surface primária (cards, drawer, modals) |
| `--bg-3` | `#121621` | surface elevada (inputs, controles) |
| `--bg-4` | `#1b2030` | surface highlight (nav ativo, switches off) |
| `--bg-5` | `#242a3a` | surface top-tier (raro) |
| `--fg` | `#f2f3f5` | texto principal |
| `--fg-dim` | `#a7adba` | texto secundário |
| `--fg-mute` | `#7d838f` | metadata, timestamps (≥4.5:1 AA) |
| `--fg-ghost` | `#7a8192` | placeholders, footer meta (≥4.5:1 AA) |
| `--line` | `#232836` | divisores padrão |
| `--line-2` | `#2c3342` | divisores hover/ativo |
| `--accent` | `oklch(0.82 0.15 85)` | amber equivalente (~`#fbbf24`), em OKLCH para mistura linear com gradient |
| `--accent-bg` | `oklch(0.28 0.08 85)` | amber escuro para backgrounds ambientes |
| `--accent-soft` | `oklch(0.82 0.15 85 / 0.14)` | amber 14% alpha para surfaces sutis |
| `--lime` | `oklch(0.86 0.19 130)` | feedback positivo (desconto aplicado) — verde lima diferente de `#34d399` do core, para destacar vitrine |
| `--red` | `oklch(0.72 0.2 25)` | remover/erro |
| `--blue` | `oklch(0.78 0.14 240)` | info/filtro ativo |
| `--grad` | `linear-gradient(135deg, oklch(0.82 0.15 85), oklch(0.7 0.2 40))` | amber→laranja, identidade de brand da vitrine |

**Por que OKLCH:** mistura perceptualmente linear em gradients (amber→laranja no logo, botão primário, card type badges). HEX em `linear-gradient` produz midtones marrons; OKLCH preserva chroma. Trade-off aceito: paleta não é bit-identica ao core `#fbbf24`, mas visualmente equivalente.

**Tipografia:**

- `--font-bebas` — Bebas Neue (importado em `page.tsx` via `next/font/google`). Usado APENAS em `.heroTitle`. Escolha editorial (narrow display sans) contra Geist Sans (body), inspirado em magazine covers.
- `--font-sans` (Geist Sans) — continua para body, labels, botões.
- `--font-mono` (Geist Mono) — métricas, tags, códigos de sticker.
- **Base font-size:** `14px` no `.root` (compressão intencional para aumentar densidade de cards por viewport). Todo child herda.

**Radius ladder (arbitrário, documentado):**

| Uso | Radius |
|---|---|
| Pills/chips pequenos | 4-6px |
| Buttons utilitários | 7-9px |
| Cards/inputs/panels | 10-11px |
| Modals, promo highlights | 12-14px |
| Pills 100% rounded | 99px |

Desvio do §5 core (Tailwind default 6/8/12). Aceito porque vitrine usa microscale mais fina.

**Shadow:**

Diferente do core (§6 que diz "drama vem de gradient+motion, não shadow"), a vitrine **usa shadow como drama intencional**:

- `.heroStk`: `0 30px 60px rgba(0,0,0,0.6)` — stickers flutuantes no hero com profundidade dramática
- `.card:hover`: `0 16px 32px rgba(0,0,0,0.4)` + `translateY(-3px)` — hover-lift clássico de e-commerce
- `.drawer`: `-20px 0 60px rgba(0,0,0,0.5)` — gaveta lateral projeta no canvas
- `.mobileBarBtn`, `.checkoutBtn`: amber glow (`0 8px 20px oklch(accent/0.3)`) — CTA em contexto

Motivação: vitrine precisa de hierarquia visual imediata (sticker brilha → quero comprar). Sombra fornece que sem depender de animação pesada.

**Motion (compartilhado com core):**

Usa `@keyframes slide-in-right` e `@keyframes fade-in` de `globals.css` — NÃO redefine. Motion namespace é UM só no projeto.

Animações próprias permitidas na variante:
- `.card:hover` translateY + shadow (hover-lift)
- `.heroStk:hover` parallax rotate/translate (envolvido em `@media (hover: hover)`)
- `.btnPrimary:hover` translateY(-1px) + amber glow

**Components paralelos declarados:**

Módulo reimplementa um conjunto reduzido de componentes porque core não tem equivalente:
- `.drawer` — cart drawer com header/body/summary/foot
- `.card` — sticker card com image/code/stock/type-badge/body/footer
- `.modal` + `.modalBox` — dialog wrapper genérico
- `.actionPill` e `.actionPillBulk` — pill buttons compactos para filtros/ações inline
- `.chip`, `.cartBtn`, `.navIcon` — nav elements específicos da vitrine

Botões utilitários (`.btn`, `.btnPrimary`, `.btnGhost`) **coexistem** com `.btn-primary`/`.btn-ghost` do core (§9). Na variante, prefira `.btnPrimary` do módulo; no core, prefira `.btn-primary` dos globals.

**Composition patterns exclusivos (adiciona a §10):**

- **Hero editorial vitrine**: `<header>` com nav próprio + `<h1>` Bebas Neue `clamp(56px, 8vw, 82px)` + chips editoriais + stats grid + hero sticker stack com parallax.
- **Promo row**: 3 cards informativos/acionáveis abaixo do hero (import lista, combo desconto, horário/pagamento).
- **Sidebar filtros**: busca + albums list + sections list + type toggles + price range dual-slider, sticky em desktop, oculta em mobile.
- **Grid auto-fill 160px**: sticker cards responsivos com hover-lift.
- **Bottom mobile bar**: CTA fixa no safe-area quando carrinho tem items.

**Regras da variante (don'ts):**

- **Não vazar tokens da variante para fora** — `--bg-*` / `--fg-ghost` / `--grad` existem só dentro de `.root` do módulo. Se outra rota precisar, criar sua própria variante.
- **Não usar tokens do core dentro da variante sem intenção** — a rota escolhe seu sistema completo.
- **Não reintroduzir `@keyframes` que já existem em globals** — motion fica uno.
- **Não promover variante vitrine para o core** — se um pattern (ex: drawer) valer projeto-wide, extrair para globals.css e componente compartilhado primeiro.

### 11.2 Outras variantes

Nenhuma declarada ainda. Quando `/painel/comercial/*` ou outras rotas precisarem de identidade própria, adicionar aqui com o mesmo template (tokens + typography + radius + shadow + motion + components + rationale).

## 12. Accessibility baseline

WCAG AA. Amber sobre canvas escuro passa 4.5:1.

Variante vitrine respeita mesma baseline: `--fg-mute` e `--fg-ghost` recalibrados em 2026-04-21 para ≥4.5:1 (ver §11.1). Modais usam `role="dialog" aria-modal="true" aria-label`, Escape fecha, foco preso e restaurado via hook `useDialog`.

## 13. Gaps

- Surface ladder do core de 3 níveis (menos granular que P1/P2)
- Classes utilitárias definidas manualmente — sem shadcn
- Sem light mode
- Variante vitrine duplica components (drawer, card) que poderiam migrar para o core como compartilhados se surgir demanda em outra rota
