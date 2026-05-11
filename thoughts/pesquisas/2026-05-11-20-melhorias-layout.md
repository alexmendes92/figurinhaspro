---
data: 2026-05-11
tipo: pesquisa
topico: 20-melhorias-layout
autor: alex (via claude opus 4.7 + p8-orchestrator agent)
sha: 226c337
branch: prototype/modal-roi
relacionados:
  - thoughts/reviews/2026-05-10-painel-estoque-panini.md (12 issues operacionais)
  - output/04-designer.md (26 issues estratégicas, 5 direções D1-D5)
  - docs/UX_AUDIT_REPORT.md (54 issues, 9 auditores, 3 sprints)
  - docs/ANALISE_UX_IMPLEMENTACAO.md (71 issues por persona)
status: ativo
proxima-fase: /stay-current → /plano
---

# 20 Melhorias de Layout — P8-FigurinhasPro

## Contexto

Pedido: "checklist de 20 melhorias no layout, depois /stay-current pra best practices, depois /plano pra implementação".

Esta pesquisa **NÃO duplica** as 154+ issues já documentadas em 4 artefatos anteriores. Em vez disso, **consolida** os deltas de maior alavancagem em uma lista de 20 itens **acionáveis** com paths/linhas reais, priorizados por impacto × esforço.

3 agents em paralelo coletaram evidência:
- `explorador` (LOCALIZAR): 43 componentes catalogados em 11 categorias.
- `explorador` (ANALISAR): `globals.css` tem apenas **4 tokens em `@theme inline`** (bg, fg, font-sans, font-mono) + 11 variáveis CSS em `:root` desconectadas do Tailwind + 13 animations customizadas + ZERO `@layer base/components/utilities`.
- `historiador`: 4 artefatos UX/design anteriores, 154+ issues acumuladas, cronologia 2026-04-04 → 2026-05-10.

## Estado atual — fatos críticos extraídos da evidência

1. **Sistema de design fragmentado**: 4 tokens Tailwind 4 + 11 vars CSS em `:root` = duas fontes de verdade desconectadas. Hardcoded `text-[11px]`, `text-[22px]`, `gap-1.5` espalhados.
2. **3 fontes de "amber" divergentes** (`output/04-designer.md`): `amber-400` no shell, `amber-500/10` em background, `#fbbf24` em var CSS — todos visualmente similares mas semanticamente difusos.
3. **`PainelShell` tem 458 linhas** + `inventory-manager` tem **1079 linhas** — componentes monolíticos que duplicam padrões.
4. **Touch targets entre 22-32px** em vários botões (regra ≥44px violada — WCAG + `arenacards.md` "Review de UI").
5. **Focus rings invisíveis ou inconsistentes** em diversos inputs/botões (auditoria UX 2026-04-05).
6. **`viewport: maximumScale: 1`** viola WCAG (auditoria UX, top 10 críticos).
7. **Watermark "LastSticker.com"** sobre nomes dos jogadores em covers (review 2026-05-10) — origem dos covers = laststicker.com (linha 1 de `albums.ts`).
8. **Modais sem focus trap** + Escape inconsistente (auditoria UX).

## As 20 melhorias

### 🎨 Sistema de Design (foundation)

**1. Expandir `@theme inline` em `globals.css` para 30+ tokens.**
- **Onde**: `src/app/globals.css:3-8`
- **O quê**: Migrar as 11 vars de `:root` (linhas 217-227) para dentro do `@theme inline`, adicionar tokens semânticos (`--color-primary`, `--color-success`, `--color-danger`, `--color-warning`, `--color-info`, escalas 50→950).
- **Por quê**: Tailwind 4 espera tokens em `@theme inline` pra gerar utilities (`bg-primary`, `text-success-500` etc). Hoje só 4 tokens → todas as cores são hardcoded em classes.
- **Impacto**: alto (base pra todas as outras melhorias). **Esforço**: médio (~50 linhas CSS + grep & replace em utilities deprecated).

**2. Consolidar 3 fontes de "amber" em 1 token `--color-accent` único.**
- **Onde**: `globals.css:223` (var `--accent: #fbbf24`) + ocorrências de `amber-400` / `amber-500/10` em componentes.
- **O quê**: Definir 1 escala `--color-accent-{50,100,...,900}` no `@theme inline` e substituir todos os `amber-*` por `accent-*`.
- **Por quê**: Branding consistente. Hoje a marca varia visualmente entre telas.
- **Impacto**: médio. **Esforço**: baixo (regex find/replace).

**3. Criar `@layer base` com reset semântico + `@layer components` com primitives.**
- **Onde**: `globals.css` (todo o arquivo).
- **O quê**: Mover reset/normalize para `@layer base`, mover utilities customizadas (`.btn-primary`, `.card`, `.stepper`) para `@layer components`. Animations e keyframes permanecem fora.
- **Por quê**: Permite override correto entre Tailwind utilities (default order: base < components < utilities). Hoje regras CSS soltas concorrem com utilities Tailwind.
- **Impacto**: alto (precedência previsível). **Esforço**: médio.

**4. Definir escala de espaçamento semântica (`--spacing-xs/sm/md/lg/xl`).**
- **Onde**: `@theme inline`.
- **O quê**: 5 tokens (`xs=4px`, `sm=8px`, `md=16px`, `lg=24px`, `xl=32px`) gerando `gap-md`, `p-lg`, `m-xl`.
- **Por quê**: Hoje `gap-1.5`, `p-2.5`, `mt-[3px]` espalhados — espaçamento ad-hoc. Output/04-designer flag.
- **Impacto**: médio (consistência visual). **Esforço**: baixo.

**5. Tipografia: escala de 6 níveis declarada em tokens (`--text-display/h1/h2/body/small/tiny`).**
- **Onde**: `@theme inline` + componentes que usam `text-[11px]`, `text-[22px]`.
- **O quê**: Tokens com `font-size + line-height + font-weight + tracking` por nível semântico.
- **Por quê**: Output/04 documenta valores ad-hoc (`text-[11px]`, `text-[22px]`). Hierarquia tipográfica perdida.
- **Impacto**: alto (legibilidade). **Esforço**: médio.

---

### ♿ Acessibilidade (compliance + UX)

**6. Remover `maximumScale: 1` do viewport (WCAG violation).**
- **Onde**: `src/app/layout.tsx` (provavelmente nas linhas 1-30, viewport export).
- **O quê**: Tirar `maximumScale: 1`, manter só `width=device-width, initial-scale=1`.
- **Por quê**: UX_AUDIT top 10 crítico. Bloqueia pinch-to-zoom, viola WCAG 1.4.4.
- **Impacto**: alto (compliance). **Esforço**: trivial (1 linha).

**7. Touch targets mínimo 44×44px em TODOS os botões interativos.**
- **Onde**: Stepper de qty (`inventory-manager.tsx`), bottom nav (`painel-shell.tsx:194-218`), close buttons de modal (`confirm-dialog.tsx`, `price-modal` linha 86-91).
- **O quê**: Auditar com `inspect` cada botão clicável, garantir `min-h-[44px] min-w-[44px]` (ou `h-11 w-11`).
- **Por quê**: regra `arenacards.md` "Review de UI" + WCAG 2.5.5 + output/04-designer flag (alguns 22-32px).
- **Impacto**: alto (mobile). **Esforço**: médio.

**8. Focus rings visíveis e consistentes via `:focus-visible`.**
- **Onde**: `globals.css` (linha ~existente de `:focus-visible`) + todos componentes interativos.
- **O quê**: Padronizar `:focus-visible` com `ring-2 ring-accent ring-offset-2 ring-offset-background outline-none` aplicado em utility class única.
- **Por quê**: Hoje vários inputs/botões têm `outline-none` sem fallback — navegação por teclado fica invisível.
- **Impacto**: alto (a11y). **Esforço**: médio.

**9. Focus trap em todos modais + Escape consistente.**
- **Onde**: `confirm-dialog.tsx:72` (já tem Escape), `cart-drawer.tsx`, `inventory-manager.tsx:32-180` (PriceModal).
- **O quê**: Extrair hook `useDialog` que faz focus trap + Escape + `aria-modal` corretos. Aplicar em 3+ modais.
- **Por quê**: UX_AUDIT flag — keyboard users ficam presos fora do modal.
- **Impacto**: médio (a11y). **Esforço**: médio.

**10. Labels semânticos + `aria-describedby` em todos inputs.**
- **Onde**: `auth-input.tsx`, `phone-input.tsx`, todos `<input>` em editores.
- **O quê**: Garantir `<label htmlFor>` real (não placeholder-as-label) + `aria-describedby` para mensagens de erro.
- **Por quê**: screen readers leem corretamente. UX_AUDIT flag.
- **Impacto**: médio (a11y). **Esforço**: médio.

---

### 📐 Estrutura de componentes

**11. Quebrar `inventory-manager.tsx` (1079 linhas) em 4 sub-componentes.**
- **Onde**: `src/components/painel/inventory-manager.tsx`
- **O quê**: extrair `PriceModal`, `StickerCard`, `SectionBlock`, `InventoryToolbar` em files separados. Manter `InventoryManager` como orquestrador (~250 linhas).
- **Por quê**: já documentado em `thoughts/reviews/2026-05-10`. Causa raiz do bug Turbopack jest-worker recorrente.
- **Impacto**: alto (manutenibilidade + bug fix). **Esforço**: alto (~3h refactor).

**12. Quebrar `painel-shell.tsx` (458 linhas) em Shell + Sidebar + TopBar + MobileNav.**
- **Onde**: `src/components/painel/painel-shell.tsx`
- **O quê**: 4 sub-componentes, cada um <120 linhas. NavItems vão pra `src/lib/nav-config.ts` (data fora do JSX).
- **Por quê**: Hoje misturar layout + data + state + handlers em 458 linhas dificulta evolução do design system.
- **Impacto**: alto. **Esforço**: alto.

**13. Criar `<Button>` primitive consolidando todas as variants atuais.**
- **Onde**: novo `src/components/ui/button.tsx` (não existe — UX_AUDIT flag).
- **O quê**: variants `primary | secondary | ghost | danger`, sizes `sm | md | lg`, states `loading | disabled`, slot `icon`. Substituir botões inline em todo o codebase.
- **Por quê**: Hoje cada lugar tem CSS inline diferente — branding fragmentado.
- **Impacto**: alto (consistência). **Esforço**: médio.

**14. Criar `<EmptyState>` único + retirar duplicatas (`empty-orders-kit.tsx` etc).**
- **Onde**: `src/components/ui/empty-state.tsx` já existe (54 linhas) + `empty-orders-kit.tsx` duplica padrão.
- **O quê**: estender `EmptyState` com slots `icon | title | description | action`, consolidar usos.
- **Por quê**: Rule of Three já bate (>3 ocorrências de padrão similar).
- **Impacto**: baixo. **Esforço**: baixo.

---

### 🎯 UX da rota crítica (estoque + loja)

**15. Stepper de quantidade aceita input direto (não só `−` / `+`).**
- **Onde**: `inventory-manager.tsx` (qty controls do StickerCard).
- **O quê**: clicar no número abre input inline (ou `<QuantityModal>`). Salva no Enter / blur. Já em `thoughts/reviews/2026-05-10` #8.
- **Por quê**: vendedor com 50+ figurinhas precisa digitar `23` direto. Hoje 23 clicks no `+`.
- **Impacto**: alto (vendedor frequente). **Esforço**: baixo.

**16. Mostrar stepper em TODOS os cards (qty=0 com "+ Adicionar" CTA inline).**
- **Onde**: `inventory-manager.tsx` (StickerCard quando `qty===0`).
- **O quê**: trocar card "vazio" por `<button>+ Adicionar 1</button>` que vira stepper após primeiro click.
- **Por quê**: review 2026-05-10 #5 — falta affordance pra adicionar 1ª unidade.
- **Impacto**: alto (UX). **Esforço**: baixo.

**17. Contador contextual de filtro ("3 exibidas nesta seção · 8 no álbum total").**
- **Onde**: `inventory-manager.tsx` toolbar (filtro Faltam).
- **O quê**: ajustar texto pra explicitar escopo (seção visível vs total).
- **Por quê**: review 2026-05-10 #2 — usuário vê "8 exibidas" mas 3 cards na tela = confusão.
- **Impacto**: médio (UX). **Esforço**: trivial (~10 linhas).

**18. Resolver "dual active state" da sidebar (Todas + país visível durante scroll).**
- **Onde**: `inventory-manager.tsx` sidebar de seções + IntersectionObserver.
- **O quê**: quando `activeSection === "all"`, item visível do observer ganha borda esquerda sutil (não background). Só item explicitamente clicado ganha bg cheio.
- **Por quê**: review 2026-05-10 #3 — 2 itens visualmente "ativos" simultâneos = ambíguo.
- **Impacto**: médio. **Esforço**: baixo.

---

### 🖼️ Vitrine pública (loja/[slug])

**19. Atribuição "Imagens: LastSticker.com / © Panini S.p.A." no rodapé da loja.**
- **Onde**: `src/components/loja/store-footer.tsx`
- **O quê**: linha discreta no rodapé citando fonte dos assets (Opção A do review 2026-05-10 #1 atualizado).
- **Por quê**: covers vêm de laststicker.com (`albums.ts` linha 1). Atribuição visível mitiga risco legal/comercial sem investir em pipeline próprio (Opção B) ou licenciar Panini (Opção C).
- **Impacto**: alto (legal de baixo custo). **Esforço**: trivial (~5 linhas).

**20. Hero da vitrine com hierarquia tipográfica forte + CTA único focal.**
- **Onde**: `src/components/loja/store-hero.tsx`
- **O quê**: 1 CTA primário visível (não 2-3 competindo), título display (escala #5), subtítulo body, stats em monospace pequeno. Aplicar tokens da #5.
- **Por quê**: hoje hero tem 2-3 CTAs concorrendo + tipografia ad-hoc → comprador não sabe o próximo passo.
- **Impacto**: alto (conversão). **Esforço**: médio.

---

## Priorização (impacto × esforço)

| # | Melhoria | Impacto | Esforço | Quick win? |
|---|---|---|---|---|
| 6 | Remover `maximumScale: 1` | Alto | Trivial | ⭐⭐⭐ |
| 17 | Contador contextual | Médio | Trivial | ⭐⭐ |
| 19 | Atribuição rodapé loja | Alto | Trivial | ⭐⭐⭐ |
| 4 | Spacing tokens | Médio | Baixo | ⭐⭐ |
| 15 | Stepper input direto | Alto | Baixo | ⭐⭐ |
| 16 | Stepper sempre visível | Alto | Baixo | ⭐⭐ |
| 18 | Sidebar dual active | Médio | Baixo | ⭐ |
| 2 | Consolidar amber | Médio | Baixo | ⭐ |
| 14 | EmptyState único | Baixo | Baixo | — |
| 1 | Expandir `@theme inline` | Alto | Médio | (foundation) |
| 5 | Tipografia tokens | Alto | Médio | ⭐ |
| 7 | Touch targets 44px | Alto | Médio | ⭐ |
| 8 | Focus rings consistentes | Alto | Médio | ⭐ |
| 9 | Focus trap modais | Médio | Médio | — |
| 10 | Labels semânticos | Médio | Médio | — |
| 13 | `<Button>` primitive | Alto | Médio | (foundation) |
| 20 | Hero loja | Alto | Médio | — |
| 3 | `@layer` base/components | Alto | Médio | (foundation) |
| 12 | Quebrar `painel-shell` | Alto | Alto | — |
| 11 | Quebrar `inventory-manager` | Alto | Alto | (mata bug Turbopack) |

**Sequência sugerida:**
1. **Quick wins** (impacto alto + esforço trivial/baixo): #6, #19, #17, #15, #16, #18 → 1-2 dias.
2. **Foundation** (impacto base pra outras): #1, #3, #5, #4, #2, #13 → 3-5 dias.
3. **Acessibilidade** (#7, #8, #9, #10, #14) → 2-3 dias.
4. **Refactor estrutural** (#11, #12) → 2-3 dias cada.
5. **Vitrine** (#20) → 1-2 dias.

## Próximos passos

1. **Fase 2 — `/stay-current`**: pesquisar best practices atuais (Tailwind 4 patterns 2026, shadcn registry novo, Next.js 16 design components, padrões de tokens semânticos, novos requirements WCAG, sistema de design `next-forge`/`vercel-ui`, etc).
2. **Fase 3 — `/plano`**: criar plano detalhado em `thoughts/planos/` priorizando quick wins + foundation, com TDD onde aplicável, gate humano em cada fase.

## Limites desta pesquisa

- Não inspecionei visualmente em browser (Chrome MCP desconectado nesta sessão).
- Inferi propósito de alguns componentes ("implied" no relatório do explorador) sem ler todas as 43 SKILLs.
- Cobertura mobile/tablet baseada em código (touch targets) não em screenshot — confirmar com `p8-master:ui-review` em 3 breakpoints quando Chrome reconectar.
- Issues que já estão em `output/04-designer.md` direções D2/D4 (não selecionadas) ficaram fora deste checklist por design — escopo é "melhorias acionáveis hoje", não re-discutir estratégia.
