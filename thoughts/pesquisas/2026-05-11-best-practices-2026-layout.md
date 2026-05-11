---
data: 2026-05-11
tipo: pesquisa-externa
topico: best-practices-2026-layout
autor: alex (via claude opus 4.7 + /stay-current)
fontes-canonicas:
  - https://tailwindcss.com/docs/theme
  - https://ui.shadcn.com/docs/components/button
  - https://nextjs.org/docs/app/api-reference/directives/use-cache
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
  - https://www.next-forge.com (parcial)
fetched-em: 2026-05-11
relacionados:
  - thoughts/pesquisas/2026-05-11-20-melhorias-layout.md (alimenta /plano)
status: ativo
---

# Best Practices 2026 — Layout P8-FigurinhasPro

Complementa o checklist de 20 melhorias com fatos atualizados das docs canônicas (gap cutoff jan/2026 → currentDate 2026-05-11).

## 1. Tailwind 4 — `@theme` directive (tailwindcss.com/docs/theme)

### Três variantes do @theme

| Variante | Quando usar | Comportamento |
|---|---|---|
| `@theme { --x: ... }` | Token comum | Gera utility class + CSS var em `:root` |
| `@theme inline { --font: var(--g) }` | Token referencia outra var | **Embute valor literal** na utility (sem `inline`, resolve no ponto da definição → quebra fonts dinâmicas) |
| `@theme static { ... }` | Sempre emitir CSS var | Mantém var mesmo sem uso (útil pra debug/branding) |

### Namespaces que GERAM utilities automaticamente

| Namespace | Gera utility | Exemplo |
|---|---|---|
| `--color-*` | `bg-X`, `text-X`, `border-X`, `from-X`, etc. | `--color-accent-500` → `bg-accent-500` |
| `--text-*` | `text-X` (size) | `--text-base: 1rem` → `text-base` |
| `--font-*` | `font-X` (family) | `--font-display: ...` → `font-display` |
| `--font-weight-*` | `font-X` (weight) | `--font-weight-bold: 700` → `font-bold` |
| `--leading-*` | `leading-X` | `--leading-tight: 1.25` → `leading-tight` |
| `--tracking-*` | `tracking-X` | `--tracking-wide: 0.025em` → `tracking-wide` |
| `--spacing` (singular) | `p-N`, `m-N`, `gap-N` automáticos baseados em múltiplos | `--spacing: 0.25rem` → `p-1=4px`, `p-4=16px`, `gap-8=32px` |
| `--radius-*` | `rounded-X` | `--radius-md` → `rounded-md` |
| `--shadow-*` | `shadow-X` | `--shadow-lg` → `shadow-lg` |
| `--breakpoint-*` | variant `X:` | `--breakpoint-3xl: 120rem` → `3xl:grid-cols-6` |
| `--animate-*` | `animate-X` | `--animate-fade-in` → `animate-fade-in` |

### `@layer` — quando usar cada um

- `@layer base` — reset/normalize + element defaults (h1, p, links de Markdown)
- `@layer components` — multi-class abstractions com `@apply` (`.btn-primary`, `.card`)
- `@layer utilities` — single-purpose utilities customizados (`.no-tap-highlight`)

Ordem de precedência: base < components < utilities (Tailwind default). Significa que utility class **sempre** sobrescreve component class — exatamente o que se espera.

### Recomendação acionável pro P8

Hoje em `globals.css`:
- ❌ 4 tokens em `@theme inline` (bg, fg, font-sans, font-mono)
- ❌ 11 vars CSS em `:root` desconectadas
- ❌ ZERO `@layer`

Migrar para:
- ✅ 30+ tokens em `@theme` (cores escala 50-950, text sizes, spacing, radius, shadow, breakpoints)
- ✅ Cores semânticas via `@theme inline` apontando pra escalas brutas (`--color-primary: var(--color-accent-500)`)
- ✅ `@layer base` pra reset de elementos (h1-h6 com escala tipográfica)
- ✅ `@layer components` pra `.btn`, `.card`, `.stepper`, `.modal-shell` consolidados

---

## 2. shadcn/ui (ui.shadcn.com)

### Button atual (2026)

**Variants disponíveis:** `default`, `outline`, `ghost`, `destructive`, `secondary`, `link`.

**Sizes:** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

**Padrão `asChild`** mantém — `<Button asChild><Link href="/x">Ir</Link></Button>` renderiza o Link com classes do Button.

```bash
pnpm dlx shadcn@latest add button
# (ou npm/yarn/bun)
```

### ⚠️ Breaking change Tailwind 4 + shadcn

Tailwind 4 mudou `cursor: pointer` → `cursor: default` em botões. Fix oficial:

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

Ou usar `npx shadcn@latest init --pointer` (flag novo).

### Recomendação pro P8

Item #13 do checklist (criar `<Button>` primitive) deveria **partir do shadcn** em vez de construir do zero:
1. `pnpm dlx shadcn@latest add button` (instala em `src/components/ui/button.tsx`)
2. Customizar variants pra `primary` (laranja Panini), `secondary` (outline), `ghost`, `danger`
3. Adicionar a base `cursor: pointer` no `@layer base` (ou usar `--pointer` flag)
4. Substituir botões inline em todo `src/components/painel/*` e `src/components/loja/*`

---

## 3. Next.js 16 — `use cache` directive (nextjs.org/docs)

### Setup obrigatório

```ts
// next.config.ts
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  cacheComponents: true,
}
export default nextConfig
```

### Uso em 3 níveis

**Arquivo (todas exports):**
```tsx
'use cache'
export default async function Page() { ... }
```

**Componente:**
```tsx
export async function Bookings({ type }: { type: string }) {
  'use cache'
  return ...
}
```

**Função:**
```tsx
export async function getData() {
  'use cache'
  return fetch('/api/data')
}
```

### Cache key composta automaticamente

1. Build ID (muda → invalida tudo)
2. Function ID (hash da localização + assinatura)
3. Argumentos serializáveis (props do componente OU parâmetros da função)
4. HMR hash (dev only)

**Variáveis de closure** (capturadas do escopo externo) também viram parte da key automaticamente.

### Composition pattern crucial

`children` e Server Actions podem ser **passados não-serializados** se o componente cacheado **não introspectar** eles:

```tsx
async function CachedShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  'use cache'
  const data = await fetch('/api/cached')
  return (
    <div>
      {header}  {/* slot — não inspeciona */}
      <Static data={data} />
      {children}  {/* slot — dynamic, não cacheado */}
    </div>
  )
}

export default function Page() {
  return (
    <CachedShell header={<h1>Home</h1>}>
      <DynamicComponent data={await getRuntimeData()} />
    </CachedShell>
  )
}
```

Isso é **Partial Pre-rendering** (PPR) na prática: shell estático + slots dinâmicos.

### Cache lifetime default

- `stale`: 5min (client-side, mínimo enforced 30s)
- `revalidate`: 15min (server-side)
- `expire`: never

Customizar com `cacheLife('hours' | 'days' | { stale, revalidate, expire })`.

### Revalidação on-demand

```tsx
import { cacheTag, updateTag } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheTag('products')
  return fetch('/api/products')
}

// Em Server Action:
'use server'
export async function updateProduct() {
  await db.products.update(...)
  updateTag('products')  // Invalida todas caches taggeadas 'products'
}
```

### ⚠️ Constraint importante

Dentro de `use cache` **não pode**:
- Chamar `cookies()`, `headers()`, `searchParams` direto
- Receber argumentos não-serializáveis (class instances, Functions soltas, Symbols, URL instances)

Solução: ler runtime APIs **fora** do escopo cached e passar como argumentos:

```tsx
// ❌ ERRADO
async function CachedComp() {
  'use cache'
  const userId = (await cookies()).get('uid')?.value  // ERRO
  return ...
}

// ✅ CERTO
async function CachedComp({ userId }: { userId: string }) {
  'use cache'
  return ...
}

export default async function Page() {
  const userId = (await cookies()).get('uid')?.value
  return <CachedComp userId={userId} />
}
```

### Recomendação pro P8

- `src/app/loja/[slug]/[albumSlug]/page.tsx` é candidato perfeito pra `'use cache'` no nível de file — vitrine pública, dados raramente mudam
- Componentes pesados como `<StoreHero>`, `<AlbumViewer>` podem ter `'use cache'` no body com `cacheTag(['album-${albumSlug}'])`
- Server Action que muda inventory → `updateTag('album-${albumSlug}')`
- `src/app/painel/*` continua sem `'use cache'` (dados do seller — runtime)

---

## 4. WCAG 2.2 — Target Size Minimum (w3.org/WAI/WCAG22)

### 🎯 Correção crítica vs nosso checklist atual

| Critério | Tamanho exigido | Nível |
|---|---|---|
| **SC 2.5.8** Target Size Minimum | **24 × 24 CSS px** | A (mínimo) |
| **SC 2.5.5** Target Size Enhanced | **44 × 44 CSS px** | AAA (best practice) |

**Nosso checklist (#7)** dizia "44×44px mínimo" — isso é **Enhanced AAA**, não **Minimum A**. O **mínimo obrigatório** é **24×24**.

### 5 exceções ao 24×24

1. **Spacing**: target menor passa SE um círculo de 24px de diâmetro centrado nele não intersecta outros targets vizinhos. Útil pra ícones inline densos em toolbars.
2. **Equivalent**: existe outro controle na MESMA página com função idêntica e tamanho ≥24.
3. **Inline**: target dentro de fluxo de texto (link em parágrafo).
4. **User Agent Control**: control nativo do browser (calendar, file input) sem customização.
5. **Essential**: target essencial à informação (mapa, dataviz denso).

### Recomendação pro P8

Item #7 do checklist deve ser ajustado:
- **Mínimo obrigatório (compliance AA)**: 24×24 px nos elementos críticos
- **Best practice (AAA + arenacards.md)**: 44×44 px no caminho mobile crítico (stepper, bottom nav, CTAs primários da vitrine)
- Em toolbars densas (filtros, ícones de seção), pode usar 24×24 com spacing de 12px em torno (passa pela exceção #1).

---

## 5. next-forge — design system reference

A doc principal (`docs.next-forge.com`) retornou 404/redirect; landing principal não detalha estrutura interna do `@repo/design-system`.

**Fato conhecido (do CLAUDE.md do workspace ArenaCards):**
- next-forge usa Turborepo monorepo com `apps/` + `packages/`
- Design system fica em `packages/design-system/` (não `@repo/design-system`)
- Bundle padrão: shadcn/ui primitives + Tailwind + Clerk + Radix + CMDK
- Storybook em `apps/storybook` pra preview isolado de componentes

**Recomendação pro P8:**
P8 é **single-app** (não monorepo). Não vale migrar pra next-forge agora. Mas **adotar o pattern** funciona:
1. Concentrar primitives em `src/components/ui/` (já é onde shadcn instala)
2. Componentes de domínio em `src/components/painel/`, `src/components/loja/`
3. Tokens centralizados em `src/app/globals.css` (`@theme`)
4. (Opcional futuro) Storybook em `src/stories/` se a equipe crescer

---

## Síntese — ajustes ao checklist de 20 melhorias

Re-validação dos itens da pesquisa `2026-05-11-20-melhorias-layout.md` com base nas fontes 2026:

| # | Item original | Validação 2026 |
|---|---|---|
| 1 | Expandir `@theme inline` pra 30+ tokens | ✅ Confirmado — usar `@theme` (sem `inline`) pra escalas brutas + `@theme inline` SÓ pra vars que referenciam outras |
| 5 | Tipografia tokens (`--text-*`) | ✅ Confirmado — Tailwind 4 já tem `--text-xs/sm/base/lg/xl/2xl` builtin, customizar valores nesses nomes |
| 7 | Touch targets 44×44 | ⚠️ Ajustado — **24×24 é o mínimo WCAG A**, 44×44 é Enhanced AAA. Aplicar 44 em CTAs críticos + 24 em toolbars densas com spacing 12px. |
| 13 | `<Button>` primitive | ✅ Confirmado — `pnpm dlx shadcn@latest add button` em vez de criar do zero |
| 8 | Focus rings | ✅ Confirmado — `:focus-visible` com `ring-2 ring-accent` |
| 3 | `@layer` base/components | ✅ Confirmado — `base` pra reset, `components` pra `@apply` compostos, `utilities` pra single-purpose |

### Item novo (não estava no checklist original)

**21. Adotar `'use cache'` na vitrine `src/app/loja/[slug]/[albumSlug]/page.tsx`**
- **O quê**: enable `cacheComponents: true` em `next.config.ts` + `'use cache'` no file da página + `cacheTag(['album-${albumSlug}'])` em fetches relevantes
- **Por quê**: vitrine pública é candidato ideal — dados de inventory mudam quando seller atualiza, mas leitura é alto volume. Cache invalidate via `updateTag` na Server Action de inventory.
- **Impacto**: alto (perf + custo Neon). **Esforço**: médio (~1 dia + teste de invalidação)

---

## Próximos passos

1. ✅ **Fase 1** (pesquisa): completa — checklist de 20 melhorias + best practices 2026
2. **Fase 2** (pesquisa externa): completa — esse doc
3. **Fase 3 — `/plano`**: criar `thoughts/planos/2026-05-11-implementar-melhorias-layout.md` priorizando:
   - **Quick wins primeiro**: #6 (viewport), #19 (atribuição loja), #17 (contador contextual), #15, #16, #18 → 1-2 dias
   - **Foundation depois**: #1 (tokens), #5 (tipografia), #3 (`@layer`), #2 (consolidar amber), #13 (Button shadcn) → 3-5 dias
   - **A11y + refactor**: #7 (24/44 ajustado), #8, #9, #10, #11, #12 → 1 semana
   - **Vitrine + cache**: #20 (hero), #21 (use cache) → 2-3 dias
