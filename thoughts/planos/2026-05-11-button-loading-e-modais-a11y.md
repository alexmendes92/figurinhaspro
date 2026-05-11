---
data: 2026-05-11
tipo: plano
topico: button-loading-e-modais-a11y
autor: alexmendes92
projeto: P8-FigurinhasPro
relacionados:
  - thoughts/reviews/2026-05-11-design-system-audit.md
  - thoughts/planos/2026-05-11-tokens-cor-fantasma-e-btn-legados.md
status: ativo
sha: 71a03ba
branch: prototype/modal-roi
iteracoes: 0
pacote: B
dependencia: Pacote A (deve rodar antes — confirmado)
aprovado-em: 2026-05-11T23:25
ordem-execucao: 3 (D → A → B → C)
decisoes-aprovadas:
  - "isConfirming é prop nova em ConfirmDialog"
  - "aria-label do spinner: 'Carregando' (PT-BR)"
  - "plan-limit-modal-preview ganha a11y agora (prototype/modal-roi)"
  - "Não extrair <Dialog> primitive ainda (3 modais é limite)"
---

# Plano B — Button loading state + a11y dos modais

## Goal

Adicionar prop `isLoading` ao primitive `<Button>` (com spinner Lucide + auto-disable), e adicionar atributos ARIA obrigatórios (`role`, `aria-modal`, `aria-labelledby`, `aria-describedby`) em 3 modais existentes (`ConfirmDialog`, `price-modal`, `plan-limit-modal-preview`). Como subproduto, `ConfirmDialog` para de duplicar estilos de botão inline e passa a consumir `<Button variant="danger" isLoading={...}>`.

## Pesquisa-base

- [thoughts/reviews/2026-05-11-design-system-audit.md](../reviews/2026-05-11-design-system-audit.md) — Priority Actions 2 e 3 (Button e ConfirmDialog scores 8/10 e 5/10 respectivamente, com gaps específicos mapeados)

## Architecture

Camadas afetadas: `src/components/ui/` (Button + ConfirmDialog) e `src/components/painel/inventory/` + `src/components/proto/` (modais consumidores).

Decisões:
1. **Button loading**: prop `isLoading?: boolean`. Quando `true`, renderiza `<Loader2 className="animate-spin" />` no slot do ícone, mantém o texto/children, força `disabled={true}` (combinando com prop `disabled` original). Spinner é Lucide (já dependência do projeto, `lucide-react@^1.8.0`).
2. **Modais a11y**: padrão único — wrapper recebe `role={variant === "danger" ? "alertdialog" : "dialog"}`, `aria-modal="true"`, `aria-labelledby="dialog-title-{id}"`, `aria-describedby="dialog-desc-{id}"`. IDs únicos via `useId()` do React 19 (já disponível).
3. **ConfirmDialog vira consumidor do Button**: remove 2 `<button>` inline + classes hardcoded, consome `<Button variant="ghost">Cancelar</Button>` e `<Button variant={variant === "danger" ? "danger" : "primary"} isLoading={confirming}>Confirmar</Button>`.

## Files affected

### Modify

| Arquivo | Mudança |
|---|---|
| `src/components/ui/button.tsx` | Adicionar prop `isLoading?: boolean` em `ButtonProps`; render condicional de `<Loader2 className="animate-spin" />`; auto-disable quando loading |
| `src/components/ui/confirm-dialog.tsx` | (1) `role`/`aria-modal`/`aria-labelledby`/`aria-describedby` no wrapper; (2) IDs via `useId()`; (3) Trocar 2 `<button>` inline por `<Button>`; (4) Adicionar prop `isConfirming?: boolean` que passa pra `isLoading` do botão de confirmar |
| `src/components/painel/inventory/price-modal.tsx` | Mesmo padrão a11y do ConfirmDialog (`role="dialog"`, `aria-modal`, labelledby, describedby) |
| `src/components/proto/plan-limit-modal-preview.tsx` | Mesmo padrão a11y |

### Create

| Arquivo | Função |
|---|---|
| `src/components/ui/__tests__/button.test.tsx` | Testar `isLoading` (spinner + disabled + texto preservado) |
| `src/components/ui/__tests__/confirm-dialog.test.tsx` | Testar `role="alertdialog"` quando `variant="danger"`, `aria-labelledby` resolvendo pra `<h3>` correto, ESC fecha, click outside fecha |

### Delete

Nada.

## Phases

### Fase 1 — `Button.isLoading`

- **RED:** Criar `button.test.tsx` com 3 casos: (a) `isLoading=true` → `screen.getByRole("button")` tem `disabled=true`; (b) `isLoading=true` → `screen.getByRole("status")` existe (spinner com `role="status"` + `aria-label="Carregando"`); (c) `isLoading=true` + children="Salvar" → texto "Salvar" continua visível. Todos vermelhos.
- **GREEN:** Adicionar `isLoading?: boolean` em `ButtonProps`. Importar `Loader2` de `lucide-react`. Render: `{isLoading && <Loader2 role="status" aria-label="Carregando" className="animate-spin" />}{children}`. Força `disabled` via `disabled={props.disabled || isLoading}`.
- **REFACTOR:** Confirmar `[&_svg]:size-4 [&_svg]:shrink-0` continua aplicando ao Loader2 (já está no `buttonVariants`).
- **Critério de saída:** `npm run test` verde (3 testes novos) + `npx tsc --noEmit` + `npm run build`.

### Fase 2 — A11y do `ConfirmDialog` + consumir `<Button>`

- **RED:** Criar `confirm-dialog.test.tsx` com casos: (a) `variant="danger"` + `open=true` → `screen.getByRole("alertdialog")` existe; (b) `variant="default"` → `getByRole("dialog")`; (c) `aria-labelledby` aponta pra id existente; (d) `aria-describedby` aponta pra description quando existe; (e) `isConfirming=true` → botão de confirmar tem `disabled=true` (testado via Button). Vermelhos.
- **GREEN:** (1) Importar `useId` de React; gerar `const titleId = useId(); const descId = useId();`. (2) Wrapper: `<div role={variant === "danger" ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} ...>`. (3) `<h3 id={titleId}>` + `<p id={descId}>`. (4) Substituir 2 `<button>` inline por `<Button variant="ghost">Cancelar</Button>` e `<Button variant={variant === "danger" ? "danger" : "primary"} isLoading={isConfirming}>Confirmar</Button>`. (5) Remover variável `confirmClass` (não usada mais).
- **REFACTOR:** Tirar `min-h-[44px]` das chamadas — Button `size="md"` já tem `h-10 px-4` que é touch-friendly. Confirmar que padding não fica menor visualmente.
- **Critério de saída:** test + tsc + build verde. **Validação visual** via `/p8-master:ui-review confirm-dialog` (golden path: deletar uma figurinha → modal abre → cancelar/confirmar).

### Fase 3 — A11y dos outros 2 modais

- **RED:** Adicionar 1 teste por modal (`price-modal.test.tsx`, `plan-limit-modal-preview.test.tsx`) checando `role="dialog"` + `aria-modal` + `aria-labelledby`. Vermelhos.
- **GREEN:** Aplicar mesmo padrão (`useId`, ids no `<h*>` e descrição). Em `plan-limit-modal-preview.tsx` linha 119 (`text-[#0b0e14]`), aproveitar pra trocar por `text-background` (sticky do audit).
- **REFACTOR:** Avaliar se vale extrair `<Dialog>` primitive — **decisão protelada** (vira tarefa nova se mais 2 modais precisarem do mesmo padrão).
- **Critério de saída:** test + tsc + build verde.

## Risks

- **Dependência implícita do Pacote A** — `confirm-dialog.tsx` é tocado em ambos. Se A não rodou ainda, esta fase introduz `bg-card-elevated` que ainda não existe como token, ou mantém `#0f1219` hardcoded. **Mitigação:** rodar A antes; ou consolidar A+B no mesmo PR.
- **`useDialog` hook custom** — confirm-dialog usa `useDialog<HTMLDivElement>(open, onCancel)`. Não sei se ele já gerencia focus trap + ESC handler. Precisa Read antes de tocar — se gerencia, ok; se não, plano cresce. **Mitigação:** spike de 5 min em F2 antes de RED.
- **`role="alertdialog"` vs `role="dialog"`** — alertdialog é mais restritivo (espera ação imediata). Para `variant="danger"` faz sentido; para "default" pode ser excesso. Manter dual mapping.
- **React Compiler + `useId`** — `useId` é stable em React 19; Compiler não deve interferir. Validar com test verde.

## Out of scope (YAGNI)

1. **Extrair `<Dialog>` primitive em `ui/dialog.tsx`** — só vale quando >3 modais convergirem; hoje 3 é exato no limite, mas a divergência (alertdialog vs dialog vs preview) sugere protelar.
2. **Migrar `cart-drawer.tsx`** — é drawer, não modal; padrão a11y é diferente (`role="dialog"` + foco volta ao trigger).
3. **Spinner global em outros componentes** — Button.loading basta; refactorar todos os loadings spalhados pelo app é outra tarefa.
4. **Telas de loading skeleton** — fora do escopo; `loading.tsx` do Next 16 cobre.
5. **Toast a11y** — `toast.tsx` precisa `aria-live` mas é tarefa separada.

## Open questions

1. **Pacote A roda antes de B?** Se sim, B começa com `confirm-dialog.tsx` já sem `#0f1219`. Recomendo: sim — sequencial reduz risco de merge conflict.
2. **`isConfirming` é prop nova em ConfirmDialog?** Sim — adicionar. Caller pode passar `isConfirming={mutation.isPending}` se usa React Query, ou state local com `useState`.
3. **Texto do `aria-label` do spinner: "Carregando" ou "Loading"?** App é PT-BR. Usar "Carregando".
4. **`plan-limit-modal-preview.tsx` é protótipo em `prototype/modal-roi`** — vale fazer a11y nele agora? Sim — quando promover para `painel/*`, já está pronto.

## Critério de "feito"

- 3 fases verdes em sequência
- 3 modais com `role` + `aria-modal` + `aria-labelledby` + `aria-describedby`
- Button com prop `isLoading` documentada (interface TS) + 3 testes verdes
- ConfirmDialog consumindo `<Button>` (2 botões inline removidos)
- Pre-commit gate verde
- Audit re-rodado: ConfirmDialog sobe de 5/10 → 8/10; Button sobe de 8/10 → 9/10; A11y geral sobe de 4/10 → 6/10
