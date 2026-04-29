---
data: 2026-04-27
tipo: pesquisa
topico: painel-loja-estrutura
autor: contato@arenacards.com.br
relacionados: []
status: ativo
commit_sha: 25675fd
branch: master (local — atrasado 20 commits vs origin/master)
deploy_sha_provavel: 6fed020 (merge PR #2 — origin/master)
repo: https://github.com/alexmendes92/figurinhaspro.git
---

# Estrutura da página `/painel/loja`

> **Update 2026-04-27**: a divergência foi resolvida — ver §0. O HTML capturado no deploy corresponde ao código real, que vive em `origin/master` (e localmente no worktree `.claude/worktrees/agitated-lovelace-e0e620/`). O `master` local está 20 commits atrás. As seções §1–§7 abaixo descrevem o estado de `master` local em `25675fd`. A §0 documenta o estado real do deploy.

---

## 0. Estado real do deploy (origin/master, 20 commits à frente)

`git log master..origin/master` revelou 20 commits ainda não puxados localmente. Os relevantes:

| SHA | Commit |
|-----|--------|
| `6fed020` | Merge pull request #2 from alexmendes92/claude/agitated-lovelace-e0e620 |
| `2a6f1a6` | feat(loja): checklist visual de onboarding com progresso e CTAs |
| `807f1ae` | docs(features): plano checklist visual de onboarding na vitrine |
| `05025ec` | feat(painel-shell): plano FREE clicavel pra /painel/planos no card user |
| `fc38ce5` | feat(estoque): mostra cta "adicionar" em card de album sem estoque |
| `b082352` | feat(pedidos): adiciona kit de divulgacao no empty state |
| `893362a` | docs(features): plano empty states do painel |
| `d55df50`, `ab2b698`, `f4b94a3` | fixes de sticky no painel-estoque/shell |
| `3c9a097` | chore(hooks): fortalece pre-commit com test e tsc antes do build |
| (vários) | fixes de bandeira de país + Twemoji + extract `formatCrumbSegment` |

O código da feature está local em `.claude/worktrees/agitated-lovelace-e0e620/` (worktree do agente Claude que abriu a PR #2). Arquivos novos:

### 0.1. `src/components/painel/onboarding-checklist.tsx` (Server Component)

Renderizado em `src/app/painel/loja/page.tsx:29–33`, **logo após o `<h1>` e antes do card "Link da vitrine"**. Recebe 3 props do `seller`:

```tsx
<OnboardingChecklist
  shopDescription={seller.shopDescription}
  businessHours={seller.businessHours}
  paymentMethods={seller.paymentMethods}
/>
```

Comportamento:

- Calcula progresso via `computeOnboardingProgress(input)` (pure function, ver §0.2).
- Se `filledCount === total`: mostra **estado completo** — card pequeno verde, `border-green-500/20 bg-green-500/5`, ícone check + "Vitrine pronta — X de Y campos preenchidos".
- Senão: card grande `rounded-2xl border-[var(--border)] bg-[var(--card)] p-5` com:
  - Header `<p>Sua vitrine está {percent}% configurada</p>` + contador mono `{filledCount}/{total}`.
  - Barra de progresso `<div role="progressbar">` com `aria-valuenow/min/max` + `aria-label`. Trilho `bg-zinc-800 h-1.5`, preenchimento `bg-amber-500 transition-all duration-700`. Width = `Math.max(percent, 4)%` (mínimo visual de 4% mesmo com 0%).
  - `<ul>` com **apenas os campos `missing`** (não lista os preenchidos). Cada `<li>`: `border-[var(--border)] bg-white/[0.02]` com label + help text + `<Link href="?edit=1#${field}">Configurar</Link>` (botão `bg-amber-500 text-black min-h-[44px]`).

Metadados dos campos (`FIELD_META`):

| field id | label | help |
|----------|-------|------|
| `shopDescription` | "Descrição da loja" | "O que você vende e há quanto tempo" |
| `businessHours` | "Horário de atendimento" | "Quando você responde clientes" |
| `paymentMethods` | "Métodos de pagamento" | "PIX, cartão, dinheiro, transferência" |

### 0.2. `src/lib/onboarding-progress.ts` (lógica pura)

```ts
const FIELDS = ["shopDescription", "businessHours", "paymentMethods"];

function isFilled(value: string | null): boolean {
  return !!value && value.trim().length > 0;
}

export function computeOnboardingProgress(input):
  { filledCount, total, percent, missing }
```

- Critério "preenchido": `value` truthy **e** `value.trim().length > 0` (string vazia ou só whitespace conta como vazio).
- `total = 3` (constante).
- `percent = Math.round((filledCount / total) * 100)`.
- `missing` é array dos field ids não-preenchidos, ordenado conforme `FIELDS`.

### 0.3. `src/lib/onboarding-progress.test.ts`

Testes unitários da função pura (existência confirmada — não inspecionei o conteúdo).

### 0.4. Os links `?edit=1#${field}` apontam para o `LojaEditor`

O `OnboardingChecklist` gera `<Link href="?edit=1#shopDescription">`, `#businessHours`, `#paymentMethods`. Esse mecanismo **provavelmente** depende de o `LojaEditor` (na mesma branch) ler `?edit=1` e ter `id` em cada input — o `LojaEditor` **dessa branch** está modificado vs `master` local (não inspecionei o diff por completo). Antes de planejar mudança, conferir `loja-editor.tsx` em `origin/master` (`.claude/worktrees/agitated-lovelace-e0e620/src/components/painel/loja-editor.tsx`) para entender se:
- a página passa `searchParams` ao `LojaEditor`, OU
- o `LojaEditor` lê via hook (`useSearchParams`), OU
- a âncora hash sozinha basta (foco/scroll do navegador) e o `?edit=1` é lido em outro lugar.

### 0.5. Como reconciliar local com deploy

```bash
git fetch
git pull --ff-only         # ou git rebase origin/master
```

Após o pull, o `master` local terá o checklist. As seções §1–§7 deste documento descrevem o estado **anterior** ao pull (`25675fd`) e seguem válidas como referência histórica do antes/depois.

---

## Pergunta original

> "Melhore a estrutura dessa seção de minha loja"
> Target: `main.painel-shell-module__2ISE6a__content` em `https://album-digital-ashen.vercel.app/painel/loja`.
> O HTML capturado mostra um card **"Sua vitrine está 0% configurada — 0/3"** com checklist (Descrição da loja, Horário de atendimento, …) e links `?edit=1#shopDescription`, `?edit=1#businessHours`.

Pesquisa documenta a estrutura **atual no codebase** (commit `25675fd`, branch `master`). Sem opinião e sem proposta de mudança.

---

## ⚠️ Divergência inicialmente reportada — RESOLVIDA

Inicialmente o HTML capturado parecia não corresponder ao código. Após `git fetch`, confirmou-se que **`origin/master` está 20 commits à frente do `master` local** e que o deploy roda `origin/master`. A feature do checklist foi implementada na PR #2 (`claude/agitated-lovelace-e0e620`) e mergeada em `6fed020`. Detalhes em §0.

A descrição abaixo (§1–§7) cobre o **estado de `master` local em `25675fd`** — útil como referência do antes/depois.

---

## 1. Arquivos envolvidos

### 1.1. Página e filhos imediatos

| Arquivo | Tipo | Função |
|---------|------|--------|
| `src/app/painel/loja/page.tsx` | Server Component (async) | Entrypoint da rota; busca `seller` + 3 queries; renderiza link da vitrine, 3 stats, `<LojaEditor>` e bloco "Preços na vitrine" |
| `src/components/painel/loja-editor.tsx` | Client Component (`'use client'`) | Editor inline dos campos da vitrine, alterna leitura/edição via `useState`, persiste via `fetch PATCH /api/seller` |
| `src/lib/toast-context.tsx` | Client Context | Provê `useToast()` (`.success`/`.error`) consumido pelo `LojaEditor` |
| `src/lib/auth.ts` | Server | `getSession()` lê cookie `iron-session` (`fp_session`) e devolve `Seller` completo do Prisma ou `null` |
| `src/lib/db.ts` | Server | Lazy proxy do `PrismaClient` com `PrismaNeon` (WebSocket Pool) |
| `src/lib/sticker-types.ts` | Util | `getDefaultPrice()`, `getStickerTypeShortLabel()` usados no bloco "Preços na vitrine" |
| `src/lib/albums.ts` | Util | Catálogo estático com 13 entradas (origem do "13" hardcoded nos stats) |

### 1.2. Server Actions

**Não existem** Server Actions em `src/app/painel/loja/`. A mutação ocorre via Route Handler REST:

- `src/app/api/seller/route.ts` — exporta `GET()` e `PATCH(req)`. `PATCH` valida manualmente (sem Zod) os campos `shopName`, `phone`, `onboardingStep`, `shopDescription`, `businessHours`, `paymentMethods`, faz `db.seller.update`, retorna apenas `{ shopName, phone, onboardingStep }` (não devolve os campos de texto editados).

### 1.3. Layout/shell

| Arquivo | Conteúdo relevante |
|---------|---------------------|
| `src/app/painel/layout.tsx` | Server Component; valida sessão + `onboardingStep < 4` (redirect); carrega `pendingOrders`; carrega fontes Bebas Neue + Manrope; passa props para `<PainelShell>` |
| `src/components/painel/painel-shell.tsx` | Client Component; sidebar colapsável + topbar + bottom nav mobile; envolve `{children}` em `<main className="content">` |
| `src/components/painel/painel-shell.module.css` | CSS Module; classe `.content` (linha 553) gera o hash `painel-shell-module__2ISE6a__content`. Define `flex: 1; overflow-y: auto; padding-bottom: 72px` (mobile) / `0` (≥1024px) |

### 1.4. Schema Prisma — `Seller` (`prisma/schema.prisma:12–49`)

Campos relevantes para a vitrine pública:

- `shopName: String` — nome da loja (não-nullable)
- `shopSlug: String @unique` — slug da URL `/loja/[slug]`
- `phone: String?` — WhatsApp
- `shopDescription: String?` — descrição editável
- `businessHours: String?` — horário editável
- `paymentMethods: String?` — métodos de pagamento
- `logo: String?` — não usado na page atual
- `plan: String @default("FREE")` — exibido como badge no `LojaEditor`
- `onboardingStep: Int @default(0)` — gate de acesso ao layout (`< 4` redireciona)

Relations usadas pela página: `inventory[]`, `orders[]`, `priceRules[]`.

### 1.5. Tokens CSS — `src/app/globals.css:217–228` (`:root`)

| Token | Valor |
|-------|-------|
| `--card` | `#111318` |
| `--card-hover` | (definido) |
| `--border` | `rgba(255, 255, 255, 0.06)` |
| `--border-hover` | (definido) |
| `--muted` | `#9ca3af` |
| `--muted-foreground` | (definido) |
| `--accent` | `#fbbf24` |
| `--accent-dim` | `rgba(245, 158, 11, 0.08)` |
| `--accent-border` | `rgba(245, 158, 11, 0.2)` |
| `--success` | `#34d399` |
| `--info` | (definido) |

---

## 2. Fluxo de dados (server)

### 2.1. Queries em `page.tsx:11–15` — `Promise.all`

```ts
db.inventory.count({ where: { sellerId: seller.id, quantity: { gt: 0 } } })
db.order.count({ where: { sellerId: seller.id } })
db.priceRule.findMany({ where: { sellerId: seller.id, albumSlug: null } })
```

- `inStockCount`: figurinhas com `quantity > 0`.
- `orderCount`: total de pedidos do vendedor (sem filtro de status).
- `priceRules`: apenas regras **globais** (`albumSlug: null`); regras por álbum não são lidas aqui.

`priceRules` vira `priceMap: Map<stickerType, price>` (`page.tsx:17`), consumido apenas pelo bloco "Preços na vitrine" iterando `["regular", "foil", "shiny"]`.

### 2.2. Props passadas ao `<LojaEditor>` (`page.tsx:81–89`)

```
shopName, phone, shopDescription, businessHours, paymentMethods, email, plan
```

`LojaEditor` **não faz queries próprias**.

### 2.3. Sessão (`src/lib/auth.ts:21–31`)

`getSession()` aguarda `cookies()` (Next 16 async), descriptografa cookie `fp_session` (iron-session, `maxAge: 30 dias`, `httpOnly`, `sameSite: lax`), lê `session.sellerId`, e devolve `db.seller.findUnique(...)` completo. `page.tsx:9` faz `if (!seller) return null` (sem redirect).

---

## 3. Modo edição — estado local, não searchParam

O HTML deployed mostrava `href="?edit=1#shopDescription"`. **Esse mecanismo não existe no código atual.**

`LojaEditor` mantém estado client-side (`loja-editor.tsx:33`):

```ts
const [editing, setEditing] = useState(false)
```

- Botão "Editar" (`linha 189`) faz `setEditing(true)`.
- Inputs aparecem inline; `handleSave()` (`linha 35`) faz `fetch("/api/seller", { method: "PATCH", ... })`.
- Em sucesso: `saved = true`, `editing = false`, `toast.success`. Após 2s, `saved` volta a `false`.
- `resetFields()` (`linha 57`) restaura props originais e volta `editing = false`.
- **Sem `router.refresh()`** após save — o Server Component pai não re-renderiza; UI fica com valores do estado local.

`useState` controla também: `shopName`, `phone`, `shopDescription`, `businessHours`, `paymentMethods`, `saving`, `saved`.

---

## 4. Stats card (Figurinhas / Pedidos / Álbuns) — `page.tsx:63–78`

```
{ label: "Figurinhas", value: inStockCount, color: "text-blue-400" }
{ label: "Pedidos",    value: orderCount,   color: "text-green-400" }
{ label: "Álbuns",     value: "13",         color: "text-[var(--accent)]" }
```

- `"13"` é **string literal hardcoded**. Corresponde aos 13 álbuns estáticos em `src/lib/albums.ts`.
- `CustomAlbum` (álbuns criados pelo vendedor via `/painel/estoque/novo`) **não é contado** aqui — nenhuma query a `db.customAlbum` na página.

---

## 5. Plan gates

Nem `page.tsx` nem `loja-editor.tsx` nem `api/seller/route.ts` importam `src/lib/plan-limits.ts`. O campo `plan` é exibido como badge estático no editor (`loja-editor.tsx:149`). Nenhuma funcionalidade da página é gated por plano.

---

## 6. Padrões existentes no painel (referência)

Documentação do que já é convenção em outras páginas — útil pra contextualizar onde `/painel/loja` se encaixa.

### 6.1. Wrapper raiz das páginas de painel

| Página | Wrapper | Max-width |
|--------|---------|-----------|
| `painel/page.tsx:278` | `p-4 sm:p-6 lg:p-8 max-w-[1280px] slide-up` | `1280px` |
| `painel/estoque/page.tsx:53` | `p-6 lg:p-8 max-w-6xl slide-up` | `max-w-6xl` |
| `painel/pedidos/page.tsx:114` | `p-6 lg:p-8 max-w-5xl slide-up` | `max-w-5xl` |
| `painel/precos/page.tsx:79` | `p-4 sm:p-6 lg:p-8 max-w-6xl slide-up` | `max-w-6xl` |
| **`painel/loja/page.tsx:22`** | **`p-6 lg:p-8 max-w-2xl slide-up`** | **`max-w-2xl`** |
| `painel/estoque/novo/page.tsx:59` | `p-6 lg:p-8 max-w-2xl slide-up` | `max-w-2xl` |
| `painel/planos/page.tsx:129` | `max-w-4xl mx-auto px-6 py-10` (exceção) | — |
| `painel/comercial/*` | layout injeta `p-4 sm:p-6`; páginas usam `space-y-4` ou `space-y-6` (exceção) | — |

`/painel/loja` usa o wrapper mais estreito (`max-w-2xl`), padrão para páginas de configuração simples.

### 6.2. Header canônico

```html
<div class="flex items-start justify-between mb-8">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{título}</h1>
    <p class="text-sm text-[var(--muted)] mt-1">{subtítulo}</p>
  </div>
</div>
```

Visto em `painel/estoque/page.tsx:55–87`, `painel/pedidos/page.tsx:115–121`, `painel/precos/page.tsx:81–87` e `painel/loja/page.tsx:23–26` (sem ação à direita).

### 6.3. Cards / painéis

Fórmula dominante (10+ ocorrências):

```
rounded-2xl border border-[var(--border)] bg-[var(--card)]
```

Variante de destaque (`accent-dim`): `painel/loja/page.tsx:29` (link da vitrine), `getting-started.tsx:44`.

Variante isolada do cockpit comercial: `bg-white/[0.03] border border-white/[0.06] rounded-xl p-4` (não usa `var(--card)` nem `rounded-2xl`).

### 6.4. Progress bars

Não há componente reutilizável `<ProgressBar>`/`<Progress>`. Implementação inline em 3 lugares:

- `painel/estoque/page.tsx:197–209` — barra com cor condicional (zinc/amber/green) por % preenchido.
- `painel/pedidos/page.tsx:294–306` — barra de status do pedido (`var(--accent)` vs `bg-zinc-800`).
- `components/painel/getting-started.tsx:53–58` — segmentos `w-8 h-1.5` por passo do onboarding.

### 6.5. Checklist de onboarding existente

`src/components/painel/getting-started.tsx` (renderizado em `painel/page.tsx:374–381`):

- Wrapper: `rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-5 sm:p-6 mb-8`.
- Header: "X de N concluídos" + barras de segmento.
- Itens: `<Link>` com ícone, label e chevron. Concluídos: `opacity-60 line-through`. Pendentes: `hover:border-amber-500/20 hover:bg-amber-500/[0.03]`.
- 3 passos do checklist: estoque (`hasStock = inventoryCount > 0`), preços (`hasPrices = priceRuleCount > 0`), WhatsApp (`hasPhone = !!seller.phone`).
- Componente retorna `null` quando `completed === total`.

Cálculo (`getting-started.tsx:37–41`):

```ts
const flags = { hasStock, hasPrices, hasPhone };
const completed = Object.values(flags).filter(Boolean).length;
const total = steps.length; // 3
if (completed === total) return null;
```

### 6.6. Server vs Client Components

- **Server Components**: páginas que só leem dados (`/painel/loja`, `/painel/estoque`, `/painel/precos`, `/painel/comercial/*`).
- **`'use client'` na página**: quando precisa de fetch reativo / hooks (`/painel/pedidos`, `/painel/planos`).
- **Pattern**: páginas Server importam Client Components pontuais (`LojaEditor`, `CopyLinkButton`, `DashboardAlerts`).
- **Cockpit comercial**: 100% Server Components nas páginas; interatividade via `?new=1` + Server Actions (sem `useState`).

### 6.7. SearchParams `?new=1` / `?edit=1`

`?new=1` é usado consistentemente no cockpit comercial para alternar lista/criação inline:

| Página | Padrão |
|--------|--------|
| `painel/comercial/leads/page.tsx:40,74,137` | `const showNew = searchParams?.new === "1"` |
| `painel/comercial/tarefas/page.tsx:27,94` | idem |
| `painel/comercial/experimentos/page.tsx:68` | `href="…?new=1"` |
| `painel/comercial/iniciativas/page.tsx:87` | idem |
| `painel/comercial/ofertas/page.tsx:40` | idem |

`?tab=` também é usado (ex: `painel/admin/revendedores/[id]/page.tsx:178`).

**Fora do cockpit**: nenhum lugar do painel usa esse mecanismo. `?edit=1` em particular não existe no codebase atual.

### 6.8. `<Link>` vs `<a>`

- `<Link>` (Next.js) para toda navegação interna, incluindo `target="_blank"` para abrir vitrine pública (`painel/loja/page.tsx:36`, `painel/page.tsx:484`).
- `<a>` apenas para externos (ex: `https://wa.me/...` em `pedidos/page.tsx:272–282`).

### 6.9. Classes utilitárias de botão (`globals.css`)

- `.btn-primary` (linha 268–289): gradiente âmbar (`#f59e0b → #d97706`), texto preto, `rounded-12px`. Override de tamanho via `!py-1.5 !px-3 !text-xs` (modificador `!` do Tailwind).
- `.btn-ghost` (linha 291–310): transparente com border `rgba(255,255,255,0.06)`, texto `#9ca3af`.
- `.badge` + variantes `.badge-zinc/blue/green/amber/red` (linha 230–265).
- Animações: `.slide-up` (entrada de página), `.fade-in`, `.shimmer`, `.sticker-added`, `.toast-enter`/`.toast-exit`, `.pulse-dot`, etc. (linha 36–48).

---

## 7. Estrutura visual atual de `/painel/loja` (síntese do JSX)

Ordem de blocos em `src/app/painel/loja/page.tsx`:

1. **Header** (`linha 23–26`): `<h1>Minha Loja</h1>` + subtítulo "Configurações da sua vitrine pública".
2. **Card "Link da sua vitrine"** (`linha 29–59`): variante `accent-dim`; mostra `/loja/{shopSlug}` em fonte mono + botão `<Link>` "Abrir vitrine" (target `_blank`).
3. **Stats grid** (`linha 62–78`): 3 cards com `grid-cols-3` — Figurinhas (`inStockCount`), Pedidos (`orderCount`), Álbuns (`"13"` literal).
4. **`<LojaEditor>`** (`linha 81–89`): bloco editável com header "Editar/Salvar/Cancelar"; campos: shopName, phone, shopDescription, businessHours, paymentMethods, email (read-only), plan badge.
5. **Card "Preços na vitrine"** (`linha 92–116`): lista os 3 tipos (Normal/Especial/Brilhante) com preço de `priceMap` ou `getDefaultPrice()` como fallback; link `<Link>` para `/painel/precos`.

---

## 8. Histórico em `thoughts/`

Nenhum artefato relevante. As pastas `pesquisas/`, `planos/`, `decisoes/`, `handoffs/`, `revisoes/` contêm apenas `.gitkeep`. Este é o primeiro artefato gerado pelo workflow R-P-I no projeto.

---

## Achados-chave

1. **Divergência deploy ↔ master**: o card "0% configurada / 0/3" e os links `?edit=1#anchor` do HTML capturado não existem em `master`. Antes de qualquer plano, confirmar de onde veio o HTML (deploy desatualizado? branch? rota diferente?).
2. **`/painel/loja` é Server Component magro** (`page.tsx`, ~120 linhas) com 3 queries Prisma e 1 Client Component (`LojaEditor`).
3. **Mutação via REST, não Server Action**: `LojaEditor` faz `fetch PATCH /api/seller`. Validação manual sem Zod. Resposta não inclui campos de texto editados, e não há `router.refresh()` — UI fica fora-de-sincronia com o servidor após save (estado local mascara a divergência).
4. **Stats "13 álbuns" é literal** — não conta `CustomAlbum`.
5. **Checklist real (3/3) está no dashboard `/painel`**, não em `/painel/loja`. Os 3 itens são estoque, preços, WhatsApp — não "descrição/horário/...".
6. **Wrapper `max-w-2xl`** posiciona `/painel/loja` na categoria "página de configuração simples" (mesmo wrapper de `/painel/estoque/novo`).
7. **`?edit=1` não existe no codebase**. O padrão de searchParam-driven inline form é usado **apenas** no cockpit comercial, com `?new=1`.
8. **Sem componente `<ProgressBar>` reutilizável** — qualquer barra é inline (3 estilos diferentes em uso).
9. **Tokens visuais consistentes** (`--card`, `--border`, `--accent*`) em `globals.css:217–228`. Cockpit comercial é exceção isolada (usa cores literais `white/[0.0X]`).
10. **Plan gates ausentes** nessa página/rota — `plan-limits.ts` não é importado.

---

## Próximos passos sugeridos pelo workflow

- Esclarecer a origem do HTML antes de planejar (deploy stale? branch? variante removida?).
- Caso confirmado que se quer adicionar checklist + `?edit=<anchor>` na rota `master`, abrir `/plano` referenciando este artefato.
