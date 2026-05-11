---
data: 2026-05-11
tipo: plano
status: rascunho-aguardando-aprovacao
gate-humano: sim (por fase)
autor: alex (via claude opus 4.7 + p8-orchestrator)
pesquisas-base:
  - thoughts/pesquisas/2026-05-11-20-melhorias-layout.md (checklist 20+1 itens)
  - thoughts/pesquisas/2026-05-11-best-practices-2026-layout.md (ajustes via Tailwind 4 + shadcn + Next 16 + WCAG 2.2)
referencias-canonicas:
  - tailwindcss.com/docs/theme
  - ui.shadcn.com/docs/components/button
  - nextjs.org/docs/app/api-reference/directives/use-cache
  - w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
proxima-fase: /p8-master:valida (validar este plano) → /p8-master:implementa (executar fase a fase)
estimativa-total: ~12-15 dias úteis
---

# Plano — Implementar 21 melhorias de layout no P8-FigurinhasPro

## Contexto

Pesquisa identificou 20 melhorias + best practices 2026 adicionou 1 (use cache na vitrine). Plano organiza essas 21 melhorias em **5 fases priorizadas por sequência lógica** (quick wins → foundation → a11y → refactor estrutural → vitrine):

1. **Fase 1 — Quick Wins** (1-2 dias): mudanças triviais com alto impacto
2. **Fase 2 — Foundation** (3-5 dias): sistema de design coerente em Tailwind 4
3. **Fase 3 — Acessibilidade** (2-3 dias): compliance WCAG 2.2 + a11y básica
4. **Fase 4 — Refactor estrutural** (4-6 dias): quebrar monólitos `inventory-manager` (1079 LOC) e `painel-shell` (458 LOC)
5. **Fase 5 — Vitrine + Cache** (2-3 dias): hero da loja + `'use cache'` em rotas públicas

Cada fase tem **gate humano explícito** antes de prosseguir pra próxima. TDD obrigatório onde houver mudança de comportamento.

---

## Princípios operacionais (aplicáveis a todas as fases)

- **TDD onde muda comportamento**: stepper input direto, contador contextual, sidebar dual active → teste primeiro. Mudanças puramente visuais (tokens, espaçamento, cores) não exigem TDD — gate é visual via `/p8-master:ui-review`.
- **Commits atômicos**: 1 commit = 1 melhoria. Mensagem imperativa em PT-BR.
- **Gate pre-commit**: `npm run test → tsc --noEmit → npm run build` automático antes de cada commit.
- **Validação visual após cada melhoria de UI**: `/p8-master:ui-review <rota>` em 3 breakpoints (375/768/1280).
- **DOMAIN_FACT_HALLUCINATION**: NUNCA afirmar fato sobre Panini sticker codes sem `grep src/lib/albums.ts` (regra já em LESSONS.md global).

---

## Fase 1 — Quick Wins (1-2 dias, ~6 commits)

**Objetivo**: mudanças triviais com alto impacto pra desbloquear conformidade + UX mínima.

### 1.1 Remover `maximumScale: 1` do viewport
- **Arquivo**: `src/app/layout.tsx` (export `viewport`)
- **Mudança**: deletar `maximumScale: 1` (manter `width=device-width, initial-scale=1`)
- **Por quê**: viola WCAG 1.4.4 (Resize Text) — bloqueia pinch-to-zoom
- **TDD**: não (mudança de config, comportamento já existia)
- **Validação**: testar pinch zoom no mobile real
- **Commit**: `fix(a11y): remove viewport maximumScale=1 (WCAG 1.4.4 violation)`

### 1.2 Atribuição "Imagens: LastSticker.com / © Panini" no rodapé da loja
- **Arquivo**: `src/components/loja/store-footer.tsx`
- **Mudança**: adicionar linha discreta `<p className="text-[10px] text-zinc-600">Imagens dos álbuns: catálogo público <a href="https://laststicker.com">LastSticker.com</a>. Direitos das figurinhas: © Panini S.p.A.</p>`
- **Por quê**: mitiga risco legal/comercial das covers raspadas (review #1 atualizado)
- **TDD**: não (display only)
- **Validação**: visual em `/loja/[slug]`
- **Commit**: `feat(loja): atribuição de fonte dos covers no rodapé`

### 1.3 Contador contextual no filtro "Faltam"
- **Arquivo**: `src/components/painel/inventory-manager.tsx` (~linha 845 do filtro toolbar)
- **Mudança**: ajustar texto pra `"{n_visible_in_section} exibidas nesta seção · {n_total_filter} no álbum"`
- **Por quê**: review #2 — "8 exibidas" mostra 3 cards na tela = confusão
- **TDD**: SIM — escrever teste que valida formato do contador em 3 cenários (all/section, filter all/missing, etc.)
- **Arquivo de teste**: `src/components/painel/inventory-manager.test.tsx` (novo)
- **Commit**: `fix(estoque): contador contextual no filtro de figurinhas faltantes`

### 1.4 Stepper aceita input direto (clicar no número abre edit)
- **Arquivo**: `src/components/painel/inventory-manager.tsx` (StickerCard, ~linha 280)
- **Mudança**: clicar no `<span>{qty}</span>` substitui por `<input type="number">` com `onBlur`/`Enter` pra salvar
- **Por quê**: review #8 — torturante pra qty >10. Stepper só pra ajuste fino
- **TDD**: SIM — teste de comportamento: clicar abre input, blur salva, Escape cancela
- **Commit**: `feat(estoque): input direto de quantidade no sticker card`

### 1.5 Stepper sempre visível (qty=0 com "+ Adicionar")
- **Arquivo**: `src/components/painel/inventory-manager.tsx` (StickerCard, condicional `qty===0`)
- **Mudança**: substituir card "vazio" por `<button>+ Adicionar 1</button>` que vira stepper ao primeiro click
- **Por quê**: review #5 — falta affordance pra adicionar 1ª unidade
- **TDD**: SIM — teste verifica que botão aparece quando qty=0 e dispara onClick correto
- **Commit**: `feat(estoque): CTA Adicionar visível em cards sem estoque`

### 1.6 Sidebar de seções — resolver dual active state
- **Arquivo**: `src/components/painel/inventory-manager.tsx` (sidebar + IntersectionObserver)
- **Mudança**: quando `activeSection === "all"`, item visível do observer ganha `border-l-2 border-accent` (não `bg-accent-500/10`). Item explicitamente clicado mantém background cheio
- **Por quê**: review #3 — 2 itens visualmente "ativos" simultâneos = ambíguo
- **TDD**: não (mudança visual com diff de classNames)
- **Validação**: visual + scroll observer test
- **Commit**: `fix(estoque): distinguir item ativo (clicado) de item visível (scroll)`

### Gate Fase 1
- ✅ 6 commits passaram pre-commit gate
- ✅ Visual conferido em `/painel/estoque/panini_fifa_world_cup_2022` (375/768/1280)
- ✅ Pinch zoom funciona em mobile real
- 🚪 Aprovação humana antes de Fase 2

---

## Fase 2 — Foundation: Tailwind 4 + Tokens + shadcn (3-5 dias, ~8 commits)

**Objetivo**: sistema de design coerente, eliminando hardcoded values e centralizando primitives.

### 2.1 Migrar 11 vars CSS de `:root` para `@theme inline` + adicionar tokens semânticos
- **Arquivo**: `src/app/globals.css`
- **Mudança**: linhas 217-227 (vars CSS) migram para `@theme inline` apontando para escala bruta. Adicionar:
  ```css
  @theme {
    /* Escalas brutas */
    --color-zinc-50: ...
    --color-zinc-950: ...
    --color-accent-50: ...
    --color-accent-500: #fbbf24  /* mantém valor atual */
    --color-accent-950: ...
    --color-success-500: #34d399
    --color-danger-500: #ef4444
    --color-info-500: #60a5fa
  }
  @theme inline {
    /* Tokens semânticos */
    --color-background: var(--color-zinc-950)
    --color-foreground: var(--color-zinc-50)
    --color-card: var(--color-zinc-900)
    --color-border: rgba(255,255,255,0.06)
    --color-accent: var(--color-accent-500)
  }
  ```
- **Por quê**: hoje só 4 tokens em `@theme inline` + 11 vars desconectadas. Tailwind 4 espera tudo no `@theme` pra gerar utilities (`bg-accent-500`, `text-success-500`)
- **TDD**: não (config CSS, regressão visual)
- **Validação**: `npm run build` passa + screenshot de 3 rotas iguais antes/depois
- **Commit**: `refactor(theme): consolida tokens em @theme com escalas semânticas`

### 2.2 Consolidar 3 fontes de "amber" em token único `accent`
- **Arquivos**: grep `amber-` em `src/**/*.tsx` (provavelmente 20-50 ocorrências)
- **Mudança**: substituir `amber-400` → `accent-400`, `amber-500/10` → `accent-500/10`, etc.
- **Por quê**: output/04-designer flag — branding fragmentado
- **TDD**: não
- **Validação**: visual side-by-side
- **Commit**: `refactor(theme): consolida amber-* em accent-* (escala única)`

### 2.3 Tipografia tokens (`--text-display/h1/h2/body/small/tiny`)
- **Arquivo**: `src/app/globals.css` (`@theme`)
- **Mudança**: adicionar `--text-display: 3rem`, `--text-h1: 2.25rem`, `--text-h2: 1.5rem`, etc. com `--text-display--line-height` e `--text-display--font-weight` (sintaxe Tailwind 4)
- **Por quê**: hoje `text-[11px]`, `text-[22px]` ad-hoc espalhados (output/04 flag)
- **TDD**: não
- **Commit**: `feat(theme): escala tipográfica semântica em tokens`

### 2.4 Spacing tokens (`--spacing` singular)
- **Arquivo**: `src/app/globals.css` (`@theme`)
- **Mudança**: `--spacing: 0.25rem` (já é o default Tailwind 4) — confirma que `p-1=4px`, `p-4=16px`, `gap-8=32px` estão funcionando uniformemente. Remover hardcoded `gap-1.5`, `p-2.5`, `mt-[3px]` onde possível
- **Por quê**: espaçamento ad-hoc
- **TDD**: não
- **Commit**: `refactor(theme): padroniza spacing via tokens (--spacing singular)`

### 2.5 `@layer base/components/utilities` em `globals.css`
- **Arquivo**: `src/app/globals.css`
- **Mudança**: reorganizar arquivo em 3 layers:
  - `@layer base`: reset/normalize + element defaults (h1-h6 com escala da #2.3, body fonts/colors)
  - `@layer components`: `.btn-primary`, `.card`, `.stepper`, `.modal-shell` (extrair patterns repetidos)
  - `@layer utilities`: utilities customizadas (`.no-tap-highlight`, `.truncate-2-lines`, etc.)
- **Por quê**: precedência previsível Tailwind 4 (base < components < utilities)
- **TDD**: não
- **Commit**: `refactor(theme): organiza CSS em @layer base/components/utilities`

### 2.6 Instalar shadcn `Button` + customizar variants
- **Arquivo novo**: `src/components/ui/button.tsx` (via shadcn CLI)
- **Comando**: `pnpm dlx shadcn@latest add button` (ou `npm`)
- **Customização**: ajustar variants pra P8 — `primary` (accent), `secondary` (outline), `ghost`, `danger`. Sizes `sm | md | lg | icon`
- **Workaround Tailwind 4**: adicionar em `@layer base` do globals.css:
  ```css
  @layer base {
    button:not(:disabled),
    [role="button"]:not(:disabled) {
      cursor: pointer;
    }
  }
  ```
- **TDD**: não (component primitive, visual)
- **Commit**: `feat(ui): instala shadcn Button como primitive`

### 2.7 Substituir botões inline por `<Button>` shadcn
- **Arquivos**: ~30 componentes em `src/components/painel/*` + `src/components/loja/*`
- **Mudança**: `<button className="bg-amber-500 ...">Click</button>` → `<Button variant="primary">Click</Button>`
- **Estratégia**: substituir gradualmente, 5-7 componentes por commit
- **TDD**: SIM em componentes com lógica (handlers) — verificar onClick continua disparando
- **Commits sugeridos**:
  - `refactor(painel): usa Button shadcn em estoque + preços`
  - `refactor(painel): usa Button shadcn em pedidos + loja editor`
  - `refactor(loja): usa Button shadcn em hero + sidebar + footer`

### 2.8 Unificar `<EmptyState>` (remover `empty-orders-kit.tsx`)
- **Arquivo**: `src/components/ui/empty-state.tsx` (já existe, estender com slots)
- **Mudança**: aceitar slots `icon | title | description | action`. Migrar `empty-orders-kit.tsx` pra usar EmptyState.
- **TDD**: não (refactor com mesmo comportamento)
- **Commit**: `refactor(ui): consolida EmptyState com slots reutilizáveis`

### Gate Fase 2
- ✅ 8 commits passaram pre-commit gate
- ✅ `npm run build` passa (Tailwind 4 reconhece todos os tokens)
- ✅ Visual de 5 rotas críticas conferido antes/depois (zero regressão)
- ✅ Bundle size não cresceu mais de 5%
- 🚪 Aprovação humana antes de Fase 3

---

## Fase 3 — Acessibilidade (2-3 dias, ~5 commits)

**Objetivo**: compliance WCAG 2.2 Level AA + a11y básica de keyboard/screen reader.

### 3.1 Touch targets (WCAG 2.5.8 Minimum = 24×24)
- **Arquivos**: stepper qty (`inventory-manager.tsx`), bottom nav (`painel-shell.tsx`), close buttons de modais (`confirm-dialog.tsx:86`, `price-modal`)
- **Mudança**: garantir `min-h-[24px] min-w-[24px]` (24px = WCAG minimum) em **todos** os botões interativos. Aplicar `44×44` (Enhanced AAA) em **CTAs críticos mobile**: stepper qty, bottom nav, primary CTAs da vitrine
- **Por quê**: WCAG 2.5.8 (Level AA) — pesquisa best practices ajustou do meu 44 inicial pra 24 mínimo
- **TDD**: não (CSS apenas)
- **Validação**: medir com DevTools em mobile emulation
- **Commit**: `a11y: garante touch targets 24px (WCAG 2.5.8) + 44px em CTAs críticos`

### 3.2 Focus rings consistentes via `:focus-visible`
- **Arquivo**: `src/app/globals.css` (já tem `:focus-visible` mas inconsistente)
- **Mudança**: utility class no `@layer components`:
  ```css
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }
  ```
  Aplicar em todos os inputs, botões, links interativos
- **TDD**: não
- **Commit**: `a11y: focus-visible ring consistente em todos interactive elements`

### 3.3 Focus trap em modais (ConfirmDialog, CartDrawer, PriceModal)
- **Arquivo**: `src/lib/use-dialog.ts` (já existe — estender)
- **Mudança**: hook `useDialog` faz focus trap (primeiro elemento focável recebe focus on open, Tab cíclico, Shift+Tab cíclico reverso) + Escape (já tem). Aplicar em 3 modais.
- **Por quê**: keyboard users ficam presos fora do modal (UX_AUDIT)
- **TDD**: SIM — testar Tab navigation + Escape closes
- **Commit**: `a11y: focus trap em modais via useDialog hook`

### 3.4 Labels semânticos + `aria-describedby` em inputs
- **Arquivos**: `src/components/auth/auth-input.tsx`, `src/components/ui/phone-input.tsx`, inputs em editores de preço/loja
- **Mudança**: garantir `<label htmlFor>` real (não placeholder-as-label) + `aria-describedby` quando há mensagem de erro/helper
- **Por quê**: screen readers leem corretamente (UX_AUDIT)
- **TDD**: SIM — testar com `@testing-library/react` `getByLabelText`
- **Commit**: `a11y: labels semânticos + aria-describedby em todos inputs`

### 3.5 Cursor pointer fix (Tailwind 4 breaking change)
- **Arquivo**: `src/app/globals.css` `@layer base`
- **Mudança**: já incluído em 2.6 mas garantir que cobre `<a>` e elementos com `role="button"` também
- **TDD**: não
- **Commit**: (combinado com 2.6 se na mesma fase)

### Gate Fase 3
- ✅ 5 commits passaram pre-commit gate
- ✅ Lighthouse a11y score ≥95 (era ≤90)
- ✅ Navegação 100% por teclado em 5 rotas críticas
- ✅ Screen reader (VoiceOver/NVDA) lê corretamente formulário de login
- 🚪 Aprovação humana antes de Fase 4

---

## Fase 4 — Refactor estrutural (4-6 dias, ~6 commits)

**Objetivo**: quebrar monólitos que dificultam evolução do design system + corrigir bug Turbopack recorrente.

### 4.1 Extrair `<PriceModal>` de `inventory-manager.tsx`
- **Arquivo origem**: `src/components/painel/inventory-manager.tsx:17-179` (PriceModal sub-componente)
- **Arquivo destino**: `src/components/painel/inventory/price-modal.tsx`
- **TDD**: SIM — caracterização: salvar preço com Enter, cancelar com Escape, limpar
- **Commit**: `refactor(estoque): extrai PriceModal pra arquivo próprio`

### 4.2 Extrair `<StickerCard>` de `inventory-manager.tsx`
- **Arquivo origem**: `inventory-manager.tsx:181-341` (StickerCard sub-componente)
- **Arquivo destino**: `src/components/painel/inventory/sticker-card.tsx`
- **TDD**: SIM — caracterização: stepper +/-, toggle 0↔1, abrir PriceModal
- **Commit**: `refactor(estoque): extrai StickerCard pra arquivo próprio`

### 4.3 Extrair `<SectionBlock>` de `inventory-manager.tsx`
- **Arquivo origem**: `inventory-manager.tsx:343-400`
- **Arquivo destino**: `src/components/painel/inventory/section-block.tsx`
- **TDD**: SIM — render correto de seção + grid de cards
- **Commit**: `refactor(estoque): extrai SectionBlock pra arquivo próprio`

### 4.4 Extrair `<InventoryToolbar>` (filtros + busca + ações)
- **Arquivo origem**: `inventory-manager.tsx` (busca, filtros, "Marcar todas", "Zerar")
- **Arquivo destino**: `src/components/painel/inventory/inventory-toolbar.tsx`
- **TDD**: SIM — comportamento de filtros, busca debounced, callbacks
- **Commit**: `refactor(estoque): extrai InventoryToolbar`

### 4.5 Quebrar `<PainelShell>` (458 LOC) em Shell + Sidebar + TopBar + MobileNav
- **Arquivo origem**: `src/components/painel/painel-shell.tsx`
- **Arquivos destino**:
  - `src/components/painel/shell/painel-shell.tsx` (orchestrator ~120 LOC)
  - `src/components/painel/shell/sidebar.tsx` (~100 LOC)
  - `src/components/painel/shell/topbar.tsx` (~80 LOC)
  - `src/components/painel/shell/mobile-nav.tsx` (~80 LOC)
  - `src/lib/nav-config.ts` (NavItems como data fora do JSX)
- **TDD**: SIM — caracterização: logout confirm, breadcrumb, mobile nav toggle
- **Commits**: 1 por sub-componente (4 commits)
  - `refactor(painel): extrai nav-config (data fora do JSX)`
  - `refactor(painel): extrai Sidebar do PainelShell`
  - `refactor(painel): extrai TopBar do PainelShell`
  - `refactor(painel): extrai MobileNav do PainelShell`

### 4.6 Validação anti-regressão final + restart Turbopack
- **Mudança**: rodar suite completa de testes + smoke manual em 5 rotas críticas + restart dev server pra confirmar que bug `jest-worker exceeding retry limit` parou (causa raiz era inventory-manager.tsx de 1079 LOC)
- **Commit**: `chore: validação anti-regressão pós-refactor (Fase 4)`

### Gate Fase 4
- ✅ 6 commits passaram pre-commit gate
- ✅ `inventory-manager.tsx` reduziu de 1079 → ~250 LOC
- ✅ `painel-shell.tsx` reduziu de 458 → ~120 LOC
- ✅ Bug Turbopack `jest-worker` não reproduz em 1h de dev server
- ✅ Cobertura de testes nos componentes extraídos ≥80%
- 🚪 Aprovação humana antes de Fase 5

---

## Fase 5 — Vitrine + `'use cache'` (2-3 dias, ~3 commits)

**Objetivo**: hero da loja com hierarquia tipográfica forte + cache na vitrine pública.

### 5.1 Hero da vitrine com hierarquia tipográfica + CTA único focal
- **Arquivo**: `src/components/loja/store-hero.tsx`
- **Mudança**: aplicar tokens da Fase 2.3 (`text-display`, `text-h1`, etc.). Reduzir pra 1 CTA primário visível (atualmente 2-3). Subtítulo em body, stats em monospace pequeno.
- **TDD**: não (visual)
- **Validação**: `/p8-master:ui-review /loja/<slug>/<albumSlug>` em 3 breakpoints
- **Commit**: `feat(loja): hero com hierarquia tipográfica + CTA único`

### 5.2 Enable `cacheComponents: true` em `next.config.ts`
- **Arquivo**: `next.config.ts`
- **Mudança**: adicionar `cacheComponents: true` no config object
- **TDD**: não (config)
- **Commit**: `feat(next): habilita Cache Components feature`

### 5.3 Aplicar `'use cache'` em `/loja/[slug]/[albumSlug]/page.tsx` + `cacheTag`
- **Arquivos**: `src/app/loja/[slug]/[albumSlug]/page.tsx` + Server Actions de inventory
- **Mudanças**:
  - No topo do `page.tsx`: `'use cache'` + `cacheTag(\`album-\${albumSlug}\`)`
  - Em cada Server Action de inventory: `updateTag(\`album-\${albumSlug}\`)`
  - Carregar `cookies()` ou outras runtime APIs FORA do escopo cached (passar como argumento se necessário)
- **TDD**: SIM — cache invalida ao mudar inventory, recarrega após `updateTag`
- **Validação**: profiling antes/depois (FCP, TTFB)
- **Commit**: `feat(loja): adota use cache na rota pública [slug]/[albumSlug]`

### Gate Fase 5
- ✅ 3 commits passaram pre-commit gate
- ✅ FCP da vitrine cai ≥30% (Vercel Analytics)
- ✅ TTFB da vitrine cai ≥50% (cache hit)
- ✅ Invalidação funcional: mudar qty no painel → vitrine reflete em ≤5s
- 🚪 Aprovação humana antes de deploy prod

---

## Estimativa total e custos

| Fase | Dias úteis | Commits | Custo claude estimado |
|---|---|---|---|
| 1. Quick Wins | 1-2 | 6 | ~$8 |
| 2. Foundation | 3-5 | 8 | ~$20 |
| 3. A11y | 2-3 | 5 | ~$12 |
| 4. Refactor estrutural | 4-6 | 6 | ~$25 |
| 5. Vitrine + Cache | 2-3 | 3 | ~$10 |
| **Total** | **12-19 dias** | **28 commits** | **~$75** |

## Riscos identificados

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Refactor de inventory-manager quebra estoque em prod | Média | TDD obrigatório em cada extração (4.1-4.4) + rollback fácil (1 commit = 1 sub-component) |
| Tailwind 4 breaking changes (cursor) não cobertos pelo workaround | Baixa | Workaround oficial documentado em pesquisa best practices |
| `'use cache'` quebra fluxo de auth (cookies dentro do escopo) | Média | Ler `cookies()` no Page (não no componente cached), passar `seller.id` como prop |
| Refactor de PainelShell perde algum estado (logout dialog, breadcrumb) | Baixa | Caracterização TDD antes de mover código |
| Substituição amber → accent quebra design em alguma tela esquecida | Baixa | Grep exhaustivo + visual side-by-side em 10 rotas críticas |
| Bug Turbopack continua mesmo após Fase 4 | Baixa | Plan B: `next dev --no-turbopack` (fallback Webpack) |

## Itens propositalmente fora deste plano

- **Migrar pra next-forge monorepo**: P8 é single-app, ROI baixo
- **Storybook**: equipe pequena, adicionar quando crescer
- **Re-scrape de covers sem watermark**: Opção B do review #1 — mais cara que Opção A (atribuição) já implementada na 1.2
- **Licenciar Panini direto**: Opção C do review #1 — decisão estratégica/comercial, não técnica
- **Migrar todos os componentes pra shadcn**: Button já cobre 80% do uso, outros primitives (Card, Dialog, Toast, Input) ficam pra plano futuro

## Próximos passos

1. **AGORA**: humano revisa este plano. Aprova fase 1 ou pede ajustes
2. **Após aprovação**: `/p8-master:valida thoughts/planos/2026-05-11-implementar-melhorias-layout.md` (valida placeholders, contradições, escopo)
3. **Após validação**: `/p8-master:implementa Fase 1` (executa 6 commits da Fase 1)
4. **Após cada fase**: review humano + decisão de continuar pra próxima

## Gates de aprovação por fase

| Fase | Gate antes | Gate depois |
|---|---|---|
| 1 | Aprovação deste plano | 6 commits + visual conferido |
| 2 | "Pode seguir pra Fase 2" | Build verde + visual ok |
| 3 | "Pode seguir pra Fase 3" | Lighthouse a11y ≥95 |
| 4 | "Pode seguir pra Fase 4" | TDD obrigatório, rede de testes pronta |
| 5 | "Pode seguir pra Fase 5" | Profiling antes/depois |
| Deploy | "Pode deployar" | Smoke test prod após cada deploy |
