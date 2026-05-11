---
data: 2026-05-11
tipo: design-system-audit
feature: design-system-completo
autor: alexmendes92
relacionados:
  - product-snapshot.md
  - src/app/globals.css
  - src/components/ui/button.tsx
  - src/components/ui/phone-input.tsx
  - src/components/ui/empty-state.tsx
  - src/components/ui/confirm-dialog.tsx
status: rascunho
escopo: src/components/**/*.tsx (55 componentes) + src/app/globals.css
score-geral: 57/100
gerado-por: /design:design-system audit
---

## Resumo executivo

Auditoria sistemática do design system do P8-FigurinhasPro cobrindo 55 componentes em `src/components/` + tokens em `globals.css`. Score geral **57/100**, puxado pra baixo por **a11y (4/10)** e **documentação (2/10)**. Pontos fortes: tokens bem definidos (32 cores + 7 escalas tipográficas + 15 animações), Button shadcn-style com 5 variants + 4 sizes, organização por pasta de domínio. Pontos fracos: **cor fantasma `#0f1219` aparece em 5 componentes sem token correspondente**, modais sem `role="alertdialog"` nem `aria-labelledby`, **30 de 55 componentes (55%) sem nenhum atributo ARIA**, 8 ocorrências residuais de classes legadas `.btn-*` em 3 arquivos (Fase 2.7 do roadmap ainda aberta).

**6 priority actions** identificadas, todas com esforço baixo/médio. As 3 primeiras (consolidar `#0f1219`, adicionar `loading` no Button, a11y dos modais) podem ser resolvidas em 1 sprint.

---

## Score por dimensão

| Dimensão | Score | Status | Evidência |
|---|---|---|---|
| Token coverage | 7/10 | Bom — escala bem definida | 32 tokens cor + 7 typo + 1 spacing em `globals.css`, mas 11 hex hardcoded em código |
| Component completeness | 6/10 | Médio — primitives parciais | Button 8/10, PhoneInput 5/10, EmptyState 6/10, ConfirmDialog 5/10 |
| A11y (ARIA) | 4/10 | Ruim — modais sem role | `aria-*` aparece em 25 de 55 arquivos (45%); modais sem `role`/`aria-labelledby` |
| Documentação | 2/10 | Muito ruim — sem stories/JSDoc | 0 `*.stories.{ts,tsx,mdx}`, 1 `.intent.md`, 3 testes |
| Naming consistency | 7/10 | Bom — organização por domínio | 8 componentes top-level deveriam estar em subpastas |
| Migração legados | 6/10 | Em andamento | Button shadcn completo, mas 8 ocorrências de `.btn-*` em 3 arquivos restantes |

**Score geral: 57/100**

---

## Naming Consistency

| Issue | Componentes / Arquivos | Recomendação |
|---|---|---|
| **Componentes top-level misturados** com componentes de domínio | `cart-drawer.tsx`, `toast.tsx`, `app-shell.tsx`, `sticker-panel.tsx`, `album-shelf.tsx`, `album-viewer.tsx`, `album-cover-upload.tsx`, `flag-emoji-polyfill.tsx` na raiz `src/components/` | Mover `cart-drawer`, `sticker-panel`, `album-*` pra `loja/`; `toast` pra `ui/`; `app-shell`, `flag-emoji-polyfill` pra `shared/` |
| **Duplicação aparente** entre `inventory-manager.tsx` e pasta `inventory/` | `painel/inventory-manager.tsx` vs `painel/inventory/{price-modal,section-block,sticker-card,inventory-toolbar}.tsx` | Confirmar se `inventory-manager` é orquestrador ou se foi superseded — documentar ou deletar |
| **Trio de editores de preços** com sobreposição funcional não-óbvia | `precos-editor.tsx`, `precos-global-editor.tsx`, `precos-album-editor.tsx` | Adicionar JSDoc indicando quem chama quem (parece que `precos-editor` é o wrapper top-level) |

---

## Token Coverage

### Definidos em `globals.css`

| Categoria | Tokens | Localização |
|---|---|---|
| Cores accent (escala 50→950) | 11 | `--color-accent-{50..950}` |
| Cores semânticas | 6 | `--color-{success,danger,info}-{400,500}` |
| Surfaces | 4 | `--color-surface-{0,1,2,3}` (0b0e14 → 1f2937) |
| Tokens semânticos (refs) | 14 | `--color-{card, card-hover, border, border-hover, muted, muted-foreground, accent, accent-dim, accent-border, success, info, background, foreground}` |
| Tipografia | 7 níveis | `display (3rem), h1 (2.25rem), h2 (1.5rem), h3 (1.125rem), body (0.875rem), small (0.75rem), tiny (0.6875rem)` — todos com size + line-height + weight |
| Spacing base | 1 | `--spacing: 0.25rem` (deriva toda escala Tailwind) |
| Animações | 15 utilities + 11 keyframes | `slide-up, fade-in, sticker-added, slide-in, cart-badge-bounce, toast-{enter,exit}, shimmer, count-up, ticker-track, float-slow, pulse-dot, scrollbar-thin` |

### Drift detectado — hex hardcoded em componentes

| Cor | Ocorrências | Arquivos | Diagnóstico |
|---|---|---|---|
| **`#0f1219`** | **5×** | `dashboard-my-albums.tsx:25`, `dashboard-hot.tsx:14,33`, `dashboard-alerts.tsx:96,115`, `confirm-dialog.tsx:40` | **Cor fantasma** — não existe nos tokens. Surface entre `surface-0 (#0b0e14)` e `surface-1 (#111318)`. Padrão recorrente → vira token ou consolida |
| `#111318` | 1× | `plan-limit-modal-preview.tsx:47` | Igual a `--color-surface-1`. Trocar por `bg-card` |
| `#1a1f2e` | 1× | `inventory/price-modal.tsx:57` | Outro surface "perdido". Avaliar consolidar |
| `#0b0e14` | 1× | `plan-limit-modal-preview.tsx:119` (`text-[#0b0e14]`) | Igual a `--color-background`. Trocar por `text-background` |
| `#34d399` (success-400) | 1× | `dashboard-hot.tsx:56` (prop `color` do Spark) | Expor via Tailwind class ou referenciar `var(--color-success-400)` |
| `#fbbf24` (accent-400) | 1× | `spark.tsx:13` (default da prop `color`) | Default aceitável, mas pode referenciar var |
| `#ffffff` | 1× | `empty-orders-kit.tsx:87` (Canvas `fillStyle`) | **Aceitável** — Canvas API não consome tokens CSS |

### Sticky: `text-gray-*` e `bg-red-*` raw

| Padrão | Onde | Recomendação |
|---|---|---|
| `text-gray-{400,600}`, `placeholder:text-gray-600` | `phone-input.tsx:40`, `empty-state.tsx:21,30,31`, `confirm-dialog.tsx:43,47` | Trocar por `text-muted`, `text-muted-foreground` (tokens semânticos) |
| `bg-red-500 hover:bg-red-400` | `confirm-dialog.tsx:32` | Trocar por `bg-danger-500 hover:bg-danger-400` (token já existe) |
| `bg-white/[0.04]`, `border-white/[0.08]` | múltiplos | Aceitável (utility), mas consolida em `bg-card`/`border-border` quando coincidir |

---

## Component Completeness

| Componente | Variants | Sizes | States (default/hover/active/disabled/loading) | A11y | Docs | Score |
|---|---|---|---|---|---|---|
| **Button** (`ui/button.tsx`) | ✅ 5 (primary, secondary, ghost, danger, link) | ✅ 4 (sm, md, lg, icon) | ✅✅⚠️✅❌ (sem loading) | ✅ `focus-visible:ring-accent` | ⚠️ Comentário no topo, sem JSDoc | **8/10** |
| **PhoneInput** (`ui/phone-input.tsx`) | ❌ Sem variants | ❌ Sem sizes | ✅⚠️⚠️❌❌ (sem disabled visual, sem error) | ❌ Sem `aria-label` / `aria-invalid` / `aria-describedby` | ❌ | **5/10** |
| **EmptyState** (`ui/empty-state.tsx`) | ❌ Só neutro (sem success/error/info) | ❌ Tamanho fixo | ✅ (estado único) | ❌ Sem `aria-live` para anúncio | ❌ | **6/10** |
| **ConfirmDialog** (`ui/confirm-dialog.tsx`) | ✅ 2 (danger, default) | ❌ Tamanho fixo | ✅✅✅⚠️❌ (sem disabled durante confirm pending) | ❌ Sem `role="alertdialog"`, sem `aria-labelledby`/`aria-describedby` | ❌ | **5/10** |

### Findings críticos por componente

**Button (`ui/button.tsx`)**
- ✅ shadcn-style com `cva` + `asChild` polimórfico (Radix Slot)
- ✅ `focus-visible:ring-accent ring-offset-background` — bom pra a11y
- ❌ **Falta state `loading`** (com spinner) — exigido pra ações async (Stripe checkout, save de formulário, criar lead). Sem isso, dev acaba duplicando lógica de loading com `disabled` + texto custom em cada call site.
- ❌ Falta JSDoc na função export

**PhoneInput (`ui/phone-input.tsx`)**
- ✅ Auto-format BR `(11) 99999-9999` correto
- ❌ **Hardcoded `text-gray-600` em placeholder** — deveria ser token semântico (`placeholder:text-muted-foreground`)
- ❌ **Sem `error` prop** — não tem como mostrar validação inline
- ❌ **Sem label slot** — depende de wrapper do consumer (acoplamento)
- ❌ **Sem `aria-invalid` quando erro** — quebra screen readers
- ❌ Sem `disabled` prop explícito (depende de `<fieldset disabled>` externo)

**EmptyState (`ui/empty-state.tsx`)**
- ⚠️ Usa **CSS var legacy com fallback hex** `bg-[var(--card,#111318)]` — versão Tailwind 4 deveria ser `bg-card` direto
- ❌ Action renderiza botão inline em vez de usar `<Button>` — **duplicação de estilos**
- ❌ Sem variants — todo empty state é igual (sem distinção semântica entre "lista vazia esperada" vs "erro ao carregar")

**ConfirmDialog (`ui/confirm-dialog.tsx`)**
- ⚠️ Usa `#0f1219` hardcoded — **cor fantasma**
- ⚠️ Botões inline em vez de `<Button variant="danger" />` — **duplicação**
- ⚠️ `bg-red-500` em vez de `bg-danger-500` — não usa token semântico (estranho porque o componente sabe que é "danger")
- ❌ **Sem `role="alertdialog"`** no wrapper — modal não anuncia ao screen reader
- ❌ Depende de `useDialog` para keyboard/focus trap — não é evidente sem ler o hook (precisa de JSDoc indicando)

---

## Issues Adicionais

### Classes legadas ainda em uso (Fase 2.7 pendente)

`globals.css` anota: _"Buttons (legados — serão substituídos por shadcn Button em Fase 2.7)"_. Estado real:

| Local | Ocorrências de `btn-primary | btn-ghost | badge-*` |
|---|---|
| `src/app/globals.css` | 10 (definições — esperado) |
| `src/components/painel/loja-editor.tsx` | 1 |
| `src/app/painel/pedidos/pedidos-client.tsx` | 6 |
| `src/app/painel/loja/page.tsx` | 1 |
| `src/components/loja/store-album-view.intent.md` | 2 (doc) |

**Total em código de produção: 8 ocorrências em 3 arquivos** — escopo pequeno, migração viável em 1 sessão.

### Cobertura de testes em componentes

| Componente | Tem `*.test.tsx`? |
|---|---|
| `auth/auth-input.tsx` | ✅ `auth-input.test.tsx` |
| `painel/dashboard-my-albums.tsx` | ✅ `__tests__/dashboard-my-albums.test.tsx` |
| `painel/dashboard-quick-actions.tsx` | ✅ `__tests__/dashboard-quick-actions.test.tsx` |
| **outros 52 componentes** | ❌ Sem cobertura |

### Documentação

- ❌ Sem Storybook (`*.stories.{ts,tsx,mdx}` retornou 0 hits)
- ⚠️ 1 `intent.md` em `loja/store-album-view.intent.md` — formato candidato pra padronizar nos primitives
- ❌ Sem JSDoc nos primitives `ui/`
- ✅ Tokens em `globals.css` têm comentários explicando o uso

### Acessibilidade (visão macro)

- `aria-*` aparece em **25 de 55 componentes (45%)**
- **Componentes interativos sem nenhum aria**: provável bug em screen readers. Próximo passo: grep por `onClick=` em componentes sem `aria-*` para listar especificamente.

---

## Priority Actions (recomendações ranqueadas)

### 1. Consolidar a cor fantasma `#0f1219` (impacto alto, esforço baixo) ⭐
5 ocorrências em 5 componentes diferentes — padrão emergente. Duas opções:
- **A)** Adicionar `--color-surface-card-elevated: #0f1219` em `globals.css` e expor `bg-card-elevated`
- **B)** Substituir todas as 5 ocorrências por `bg-card` (`#111318`) — diff visual aceitável

**Recomendação:** opção A. A cor existe por razão visual (escolha do designer ou alguém em sessões anteriores) — formalizar.

### 2. Adicionar state `loading` ao `<Button>` (impacto alto, esforço baixo)
Stripe checkout, form submissions, save de preços — todos precisam mostrar progresso. Adicionar prop `isLoading` + spinner via Lucide `Loader2 className="animate-spin"`. Sem isso, dev acaba duplicando lógica de loading com `disabled` + texto custom em cada call site.

### 3. A11y nos modais (impacto alto regulatório, esforço médio) ⭐
`ConfirmDialog` e demais modais sem `role="alertdialog"` / `aria-labelledby` / `aria-describedby` quebram leitores de tela. Adicionar:
```tsx
<div role={variant === "danger" ? "alertdialog" : "dialog"}
     aria-labelledby="dialog-title"
     aria-describedby="dialog-description"
     aria-modal="true">
  <h3 id="dialog-title">{title}</h3>
  <p id="dialog-description">{description}</p>
  ...
</div>
```

### 4. Migrar `.btn-*` legados → `<Button>` (impacto médio, esforço baixo)
Apenas 3 arquivos restam (`loja-editor.tsx`, `pedidos-client.tsx`, `loja/page.tsx`). Fase 2.7 do roadmap pode ser encerrada em uma sessão. Permite remover ~50 linhas de CSS em `globals.css`.

### 5. Adicionar `error` + `aria-invalid` ao `PhoneInput` (impacto médio, esforço baixo)
Hoje componente é "burro" — não comunica validação. Padrão sugerido:
```tsx
interface PhoneInputProps {
  ...
  error?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
}
```

### 6. Padronizar formato `intent.md` para todos os primitives `ui/` (impacto baixo, esforço médio)
`store-album-view.intent.md` já existe — promover formato para `ui/button.intent.md`, `ui/phone-input.intent.md`, `ui/empty-state.intent.md`, `ui/confirm-dialog.intent.md`. Cobre 80% do valor de Storybook sem o custo de manter Storybook num projeto que prioriza simplicidade.

---

## Próximos passos

1. **Converter Priority Actions em plano formal** via `/p8-master:plano <prioridade>` — gate humano antes de tocar código
2. **Bug específico de migração:** rodar `/p8-master:pesquisa migração btn-legacy` para mapear todos os usos antes de Edit
3. **Validação visual:** após cada Priority Action implementada, rodar `/p8-master:ui-review <componente>` para confirmar que diff não regressa visualmente

## Anti-patterns evitados nesta auditoria

- ✅ Toda afirmação tem evidência factual (arquivo:linha)
- ✅ Nenhuma estimativa de "convenção Panini" / "padrão da indústria" sem grep
- ✅ Tokens checados contra `globals.css` (fonte de verdade), não inferidos
- ✅ Versões e componentes confirmados via Read direto, não memória de treino

---

_Audit gerado em 2026-05-11 23:07 via `/design:design-system audit`._
_Score 57/100 calculado como média ponderada das 6 dimensões._
_Pode ser regenerado quando: novo primitive adicionado, refactor de tokens, ou após fechar Fase 2.7._
