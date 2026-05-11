---
data: 2026-05-11
tipo: plano
topico: tokens-cor-fantasma-e-btn-legados
autor: alexmendes92
projeto: P8-FigurinhasPro
relacionados:
  - thoughts/reviews/2026-05-11-design-system-audit.md
status: ativo
sha: 71a03ba
branch: prototype/modal-roi
iteracoes: 0
pacote: A
aprovado-em: 2026-05-11T23:25
ordem-execucao: 2 (D → A → B → C)
decisoes-aprovadas:
  - "Nome do token: card-elevated (não surface-elevated)"
  - "Confirma encerrar Fase 2.7 removendo .btn-primary/.btn-ghost"
  - "Rodar lint:fix ao final"
---

# Plano A — Tokens (cor fantasma `#0f1219` + migração `.btn-*` legados)

## Goal

Consolidar a cor fantasma `#0f1219` (5 ocorrências hardcoded) num token nomeado, migrar as 8 ocorrências residuais de `.btn-primary` / `.btn-ghost` em 3 arquivos pra `<Button>` shadcn (já existe e está completo), e remover as definições legadas de `globals.css` — encerrando a Fase 2.7 do roadmap inline.

## Pesquisa-base

- [thoughts/reviews/2026-05-11-design-system-audit.md](../reviews/2026-05-11-design-system-audit.md) — Priority Actions 1 e 4 (escopo factual: arquivos:linhas + diagnóstico)

## Architecture

Camadas afetadas: `src/app/globals.css` (adicionar token + remover classes legadas), `src/components/painel/` (3 arquivos com hex hardcoded), `src/components/ui/` (1 arquivo — `confirm-dialog.tsx`), `src/app/painel/` (2 páginas com `.btn-*`).

Decisão arquitetural: criar `--color-surface-card-elevated: #0f1219` em `@theme` (escala bruta) + `--color-card-elevated: var(--color-surface-card-elevated)` em `@theme inline` (alias semântico). Isso expõe a utility Tailwind `bg-card-elevated` consumível nos componentes. A cor existe por razão visual (surface intermediário entre `surface-0` `#0b0e14` e `surface-1` `#111318`) — formalizar como token, não remover.

Substituição de `.btn-*` é mecânica: cada call site usa `<Button variant="...">` em vez de `<button className="btn-primary">`. Não introduz nova lógica.

## Files affected

### Modify

| Arquivo | Mudança |
|---|---|
| `src/app/globals.css` | (1) Adicionar `--color-surface-card-elevated: #0f1219` em `@theme` (após `--color-surface-3`); (2) Adicionar `--color-card-elevated: var(--color-surface-card-elevated)` em `@theme inline` (após `--color-card-hover`); (3) Remover bloco `.btn-primary` (linhas ~206–227); (4) Remover bloco `.btn-ghost` (linhas ~229–248) |
| `src/components/painel/dashboard-my-albums.tsx` | Linha 25: `bg-[#0f1219]` → `bg-card-elevated` |
| `src/components/painel/dashboard-hot.tsx` | Linhas 14 e 33: `bg-[#0f1219]` → `bg-card-elevated` |
| `src/components/painel/dashboard-alerts.tsx` | Linhas 96 e 115: `bg-[#0f1219]` → `bg-card-elevated` |
| `src/components/ui/confirm-dialog.tsx` | Linha 40: `bg-[#0f1219]` → `bg-card-elevated` (somente token; a11y do dialog fica para Pacote B) |
| `src/components/painel/loja-editor.tsx` | Substituir 1 `.btn-*` por `<Button variant="...">` apropriado |
| `src/app/painel/pedidos/pedidos-client.tsx` | Substituir 6 `.btn-*` por `<Button variant="...">` (precisa map: primary→primary, ghost→ghost) |
| `src/app/painel/loja/page.tsx` | Substituir 1 `.btn-*` por `<Button variant="...">` |

### Create

Nenhum arquivo novo. (Sem testes novos — substituição mecânica é coberta por `npm run build` + smoke visual.)

### Delete

Nada — definições legadas saem via Edit em `globals.css`.

## Phases

### Fase 1 — Novo token `card-elevated` em `globals.css`

- **RED:** Adicionar teste em `src/__tests__/globals.test.ts` (ou novo `tokens.test.ts`) que faz `import "@/app/globals.css?raw"` e verifica `expect(css).toContain("--color-surface-card-elevated: #0f1219")` + `expect(css).toContain("--color-card-elevated:")`. Falha vermelha.
- **GREEN:** Edit em `globals.css`: adicionar token bruto + alias semântico.
- **REFACTOR:** Ajustar comments adjacentes em `globals.css` indicando uso ("`bg-card-elevated` — surface para empty states de dashboard cards").
- **Critério de saída:** `npm run test` verde + `npx tsc --noEmit` verde + `npm run build` verde.

### Fase 2 — Substituir hex `#0f1219` por `bg-card-elevated` nos 5 componentes

- **RED:** Adicionar teste de grep em `tokens.test.ts`: `expect(grep("#0f1219", "src/components")).toHaveLength(0)`. Falha vermelha (5 ocorrências hoje).
- **GREEN:** 5 Edits cirúrgicos (dashboard-my-albums, dashboard-hot x2, dashboard-alerts x2, confirm-dialog).
- **REFACTOR:** Smoke visual via `npm run dev` + abrir `/painel` no `/chrome` — confirmar que cards permanecem visualmente idênticos.
- **Critério de saída:** test + tsc + build verde. **Validação visual obrigatória** via `/p8-master:ui-review painel-dashboard` antes de fechar a fase (regra dura — toda mudança visual exige screenshot).

### Fase 3 — Migrar `.btn-*` em 3 arquivos pra `<Button>`

- **RED:** Adicionar teste `expect(grep("btn-primary|btn-ghost", "src/app|src/components")).toHaveLength(0)`. Falha vermelha (8 ocorrências hoje em 3 arquivos).
- **GREEN:** 3 Edits (loja-editor.tsx 1×, pedidos-client.tsx 6×, loja/page.tsx 1×). Cada `<button className="btn-primary">X</button>` vira `<Button variant="primary">X</Button>`. Importar `Button` no topo do arquivo se não houver.
- **REFACTOR:** Verificar size apropriado (`size="md"` é default; `size="sm"` se botão era pequeno).
- **Critério de saída:** test + tsc + build verde + `/p8-master:ui-review pedidos` (rota mais afetada).

### Fase 4 — Remover `.btn-primary` e `.btn-ghost` de `globals.css`

- **RED:** Atualizar `tokens.test.ts`: `expect(css).not.toContain(".btn-primary")` + `expect(css).not.toContain(".btn-ghost")`. Falha vermelha.
- **GREEN:** Edit em `globals.css` removendo os 2 blocos (linhas ~206–248).
- **REFACTOR:** Atualizar comment no topo da seção `@layer components` removendo "(legados — Fase 2.7)".
- **Critério de saída:** test + tsc + build verde.

## Risks

- **Visual regression em `/painel/pedidos`** — `pedidos-client.tsx` tem 6 `.btn-*`, é o arquivo mais denso. Risco de Button shadcn não cobrir exatamente o mesmo gradient laranja ou padding. Mitigação: comparar screenshot antes/depois via `/p8-master:ui-review`.
- **`bg-card-elevated` não rerenderiza** se Tailwind PostCSS não detectar a nova utility — exige `npm run build` limpo (não `--turbopack` incremental) na primeira validação.
- **Outros hex `#0f1219` aparecem em `.intent.md` ou docs** — grep test pode pegar falsos positivos. Mitigação: escopar `glob: "*.tsx"` no teste.
- **Pacote B (modais a11y) também toca `confirm-dialog.tsx`** — se A e B rodarem em paralelo, conflito de merge. Mitigação: rodar A antes de B, ou consolidar num único PR.

## Out of scope (YAGNI)

1. **Migrar `.badge-*` legados em `globals.css`** — escopo dele é outro pacote (Badge primitive ainda não existe em `src/components/ui/`).
2. **Refatorar `precos-editor.tsx` + `precos-{global,album}-editor.tsx`** — naming consistency é tarefa separada.
3. **Adicionar testes para todos os componentes tocados** — só `tokens.test.ts` (grep + assert CSS) entra; cobertura completa de Button shadcn não é objetivo aqui.
4. **Migrar `bg-white/[0.04]` raw para tokens** — mesmo princípio do `text-gray-*`: fica para um pacote dedicado a tokens semânticos secundários.
5. **Storybook para Button** — fora de escopo; `intent.md` cobre em Pacote D.

## Open questions

1. **Nome do token: `card-elevated` ou `surface-elevated`?** Recomendo `card-elevated` porque `card` já é semântico no Tailwind config (`bg-card` existe). Coerência > simetria de naming.
2. **Confirma encerrar Fase 2.7** removendo `.btn-primary`/`.btn-ghost` definitivamente em globals.css? (Resposta esperada: sim — `<Button>` shadcn cobre 100% dos casos.)
3. **Quer rodar `npm run lint:fix`** ao final pra reordenar imports automaticamente? Recomendo sim — Biome pode flaggar imports duplicados após inserir `Button`.

## Critério de "feito"

- 4 fases verdes em sequência (cada fase fecha individualmente, commit atômico)
- Grep `#0f1219` em `src/components/**/*.tsx` retorna **0 ocorrências**
- Grep `btn-primary|btn-ghost` em `src/app/**/*.tsx` + `src/components/**/*.tsx` retorna **0 ocorrências**
- `globals.css` tem `--color-card-elevated` definido e `.btn-primary`/`.btn-ghost` removidos
- Visual diff em `/painel`, `/painel/pedidos`, `/painel/loja` confirmado **idêntico** via `/p8-master:ui-review`
- Pre-commit gate verde (test + tsc + build)
- Audit re-rodado: Token Coverage sobe de 7/10 para ≥ 8/10; Migração legados sobe de 6/10 para 9/10
