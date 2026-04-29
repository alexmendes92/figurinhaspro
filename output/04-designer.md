---
fase: estrategia-designer
gerado-em: 2026-04-29T00:15:00-03:00
versao: 1
projeto-alvo: C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
agents-usados: [analista-gerador, pesquisador, arquiteto-estrategico]
status: completo
sumario: "Design escolhido: D1 (sangria) + D3 (onboarding-first) + D5 (polimento de receita) em 7 PRs sequenciais (~17 dias úteis em 6 semanas). D2 (lista de faltantes promovida) adiada pós-Copa, D4 (shadcn/ui sistêmico) adiada Q3/26."
direcao-escolhida: D1+D3+D5
direcoes-adiadas: [D2-pos-copa, D4-q3-2026]
prs-planejados: 7
duracao-estimada-dias-uteis: 17
janela-copa: "28/04/2026 → 19/07/2026"
prox-fase: prototipo-definicao
---

# Estratégia de Designer — P8-FigurinhasPro

> Diagnóstico e proposta de design derivados de Geral (`output/01`) + Marketing (`output/02`) + Estrutura (`output/03`). Restrições herdadas: validação inicial / zero budget / fundador solo / janela Copa 2026 / Tailwind 4 + Geist + dark default / mobile-first.

## Sumário Executivo

A re-análise de UI/UX do código (lente design no Step 2) confirmou **sistema parcialmente declarado, majoritariamente ad-hoc** — 3 fontes diferentes de "amber", `text-zinc-*` vs `text-gray-*`, `focus:ring 10%` invisível, touch targets de 22-32px na vitrine (abaixo de 44px mínimo). 5 direções estratégicas foram geradas (Step 4) e o operador escolheu (Step 5) **D1 + D3 + D5 combinadas** — sangria + onboarding-first + polimento de receita.

A direção escolhida cabe em **7 PRs sequenciais (~17 dias úteis)** ao longo de 6 semanas, encaixando-se nas Fases 1-5 do roteiro estrutural (`output/03 §4.c`). O **caminho crítico** é PR-F (D5 receita) — único PR que toca lógica de receita ativa antes do pico Copa. **D2 (promover lista de faltantes na vitrine)** foi explicitamente adiada para pós-Copa por exigir refactor em `store-album-view.tsx` (1.052 LOC sem testes); **D4 (adoção shadcn/ui sistêmica)** foi adiada para Q3/26 — refactor sistêmico durante pico de tráfego é receita pra acidente em produção.

**3 hipóteses centrais a validar** com a entrega: (H1) modal contextual com ROI converte FREE→PRO mais que pricing genérico; (H2) onboarding single-page + checklist persistente reduz desistência D0 vs wizard 5-passos; (H3) re-ativar plan limits durante Copa não cria atrito desproporcional com sellers FREE atuais (depende de query de grandfathering antes do PR-F).

## 1. Síntese trans-relatórios

### a. Superfícies críticas (UI/UX com maior impacto)

6 superfícies selecionadas por concentração de complexidade × gaps que bloqueiam conversão × persona-alvo Rodrigo:

**1. Vitrine pública — `/loja/[slug]/[albumSlug]/`** (`store-album-view.tsx` 1.052 LOC, sem testes). **O que dói:** lista de faltantes oculta dentro do componente sem CTA acima da dobra (Paulo P14: "nunca ouvi falar"); cold start parseia `albums.ts` 44.781 LOC (G9). **Entrega:** "cole sua lista do app Panini e veja só o que falta" como CTA primário.

**2. Onboarding — `/onboarding/page.tsx`** (772 LOC). **O que dói:** wizard multi-step com 3 campos rastreados; Camila P7 confiança Alta: "configurar muito = não vou fazer". **Entrega:** form único, painel imediato com bulk import em destaque, ≤2 min até primeira figurinha cadastrada (G10 §17.a).

**3. Painel de estoque — `/painel/estoque/`** (`inventory-manager.tsx` 1.049 LOC, sem testes). **O que dói:** Copa 2026 = 980 figurinhas (recorde); sem evidência de teste com volume em prod (G10 §15 c.2). **Entrega:** importar 980 figurinhas via colagem em <10s sem travar mobile, com feedback de progresso visível.

**4. Editor de preços — `/painel/precos/[albumSlug]/`** (`precos-album-editor.tsx` 823 LOC, 3 abas). **O que dói:** custo cognitivo alto; Rodrigo P6: "tentei Shopify, ficou 2 dias e desisti — muito complexo". **Entrega:** preço básico (tipo) acessível em 1 aba sem exigir entender seções/tiers na 1ª semana.

**5. Página de planos — `/painel/planos/`**. **O que dói:** caminho FREE→PRO falha silenciosamente se Stripe IDs não configurados (G4); modal de limite genérico sem ROI. **Entrega:** modal contextual com ROI ("você está perdendo R$ X/sem; PRO te devolve isso") + botão upgrade que falha com mensagem clara (GM3, §17.b).

**6. Bottom nav e shell do painel — `painel-shell.tsx`** (440 LOC). **O que dói:** cockpit comercial visível na nav mas será DEPRECATED Q3/26 (Estrutura §4.c Fase 4); "Planos" não aparece no bottom nav mobile. **Entrega:** nav limpa com 5 destinos + cockpit removido antes do banner.

### b. Mensagem central + persona-alvo

- **Persona única 90d:** Rodrigo (revendedor profissional, 400-800 figurinhas/mês, perde 10-15 vendas/sem).
- **Mensagem central:** "venda perdida evitada" — Rodrigo não compra software, compra tempo (§2.b Marketing).
- **5 variantes por canal:** WhatsApp DM / banner P1 / Stories IG / Reels TikTok / landing hero.
- **Implicação direta:** copy + UI das 4 superfícies de aquisição (landing `/`, signup, onboarding, vitrine usada como prova social) precisam refletir a mesma mensagem. Não pode dizer "organize estoque" enquanto marketing diz "pare de perder venda".
- **Camila e Paulo:** beneficiários indiretos. Camila vive no FREE; Paulo nunca paga. Marketing direto pra ambos não está no escopo dos 90 dias.

### c. Estrutura modular (UI)

Boundaries da Estrutura (`output/03 §3.a`) que tocam UI:

- **Catálogo (`lib/catalog/`)** — afeta vitrine + estoque. DB plug-in adiado (G9), mas boundary nasce na Fase 3.
- **Billing (`lib/billing/`)** — afeta página de planos + modal de limite. Upgrade contextual (GM3) depende de `telemetry.ts` da Observability.
- **Vendedor & Auth** — `proxy.ts` adiado pós-Copa. Signup ganha campo invisível `acquisitionSource` (UTM, GM1).
- **Cockpit comercial frozen** — banner "DEPRECATED Q3/26" no `layout.tsx`; item removido da nav principal em `painel-shell.tsx`.
- **Dashboard novo `/painel/admin/operacao` (Fase 4)** — primeira UI nova prevista pela estrutura. Reaproveita padrões existentes.
- **Observability (`lib/observability/`)** — `telemetry.ts` cria `plan_limit_hit`, `signup_completed`, `first_inventory_added`. Disparam upgrade contextual (GM3).

**Lista de faltantes promovida em 3 superfícies (§17.e Geral):** vitrine pública (CTA primário), onboarding (vídeo tutorial), URL `?paste-list` com prefill. **Adiada pós-Copa** por exigir refactor em 1.052 LOC sem testes.

### d. Restrições herdadas

- **Validação inicial / zero budget / fundador solo:** sem agência, sem designer dedicado, sem ferramentas pagas. Tailwind 4 + componentes próprios. Protótipos em código, não em Figma.
- **Janela Copa 2026 (~6 semanas):** redesign big-bang fora do escopo. Refactor de componentes gigantes (`store-album-view.tsx`, `inventory-manager.tsx`, `precos-album-editor.tsx`, `onboarding/page.tsx`) adiado pós-Copa. O que cabe agora: melhorias cirúrgicas dentro dos componentes existentes.
- **Mobile-first obrigatório:** Rodrigo no celular no ônibus; Paulo compra no celular; Camila atualiza Stories no celular. Validar em 375px antes de qualquer breakpoint. Touch targets ≥44px.
- **Stack:** Tailwind CSS 4 com `@theme inline` em `globals.css` (sem `tailwind.config.js`), Geist Sans + Geist Mono, dark mode hardcoded.
- **Acessibilidade (WCAG):** não declarada como prioridade; violações graves são gaps, não bloqueadores. Decisão sobre corrigir antes de features novas é trade-off com fundador.
- **Sem instrumentação custom:** decisões de design baseadas em personas e entrevistas simuladas, não em dados reais. Toda proposta dependente de dado comportamental marca-se como hipótese a validar.

## 2. Estado atual de design

### a. Sistema de design / tokens

**Tailwind 4 sem `tailwind.config.js` — confirmado.** Única fonte de tokens em `globals.css`:

- **Nível 1 (`@theme inline`):** apenas 4 tokens — `--color-background: #0b0e14`, `--color-foreground: #e8eaed`, `--font-sans`, `--font-mono`. Sem breakpoints, escala de espaçamento, radius padronizado.
- **Nível 2 (`:root` ad-hoc):** tokens semanticamente nomeados (`--card`, `--border`, `--muted`, `--accent: #fbbf24`, `--success`, `--info`) — **não injetados no Tailwind**. A landing usa `text-amber-400`, `bg-[#0f1219]`, `border-white/[0.06]` em vez dos tokens.
- **Nível 3 (CSS Module da vitrine `store-album-view.module.css`):** `--accent: oklch(0.82 0.15 85)` — **diferente do `:root #fbbf24`** em displays P3.

**Diagnóstico:** sistema parcialmente declarado, majoritariamente ad-hoc. 3 fontes diferentes de "amber". `text-zinc-*` na página de planos diverge do `text-gray-*` global.

**Modo escuro:** sempre escuro. `<html class="dark">` hardcoded em `layout.tsx:71`. Sem toggle, sem `prefers-color-scheme`.

**Tipografia:** Geist Sans (corpo) + Geist Mono (códigos/dados). Hierarquia funcional. Sem tamanhos customizados no `@theme`; mistura escala Tailwind padrão com valores arbitrários (`text-[11px]`, `text-[13px]`, `text-[15px]`, `text-[22px]`).

**Espaçamentos:** ad-hoc. Sem token de espaçamento vertical.

### b. Padrões visuais por superfície

**Landing `/` (`page.tsx`):** dark premium. Hero `text-5xl sm:text-6xl lg:text-7xl xl:text-[84px]` com `font-black`, amber-400, gradientes radiais. Colagem flutuante visível só em `lg:` (mobile esconde metade do hero). Pricing table com PRO destacado (`Mais escolhido` badge amber). Dor→solução em 6 cards, depoimentos com aria-label correto.

**Login/Signup (`(auth)/`):** sistema próprio coerente com 8 componentes (`AuthInput`, `AuthButton`, `AuthError`, `AuthLogo`, `PasswordStrength`, `AuthDivider`, `AuthSuccess`, `AuthFooterLink`). Login com split layout (esquerda branding, direita form). `AuthInput` com `focus:ring-amber-500/10` (10% opacidade — invisível). Validação só no submit. Registro: grid `grid-cols-2` em 375px (apertado).

**Vitrine pública** (CSS Module com tokens próprios). Hero impressionante mesmo em 375px (`loja-album-refine-375.png`). "Cole a lista que falta" visível como card promo no hero. Sidebar de filtros some em ≤1100px sem substituto mobile (filtros por tipo + faixa de preço inacessíveis em mobile).

**Painel — bottom nav / sidebar (`painel-shell.tsx`):** desktop com sidebar (Operação + Ferramentas + Admin condicional); mobile com bottom nav de 5 itens (Início, Estoque, Preços, Pedidos, Vitrine). **"Planos" ausente no bottom nav** — usuário FREE no celular não acha upgrade.

**Onboarding:** wizard 5 steps. Step 0 "Boas-vindas" é informativo puro (3 cards + 1 botão "Começar agora"). Sem voltar explícito em mobile. Camila desiste antes mesmo de chegar ao step 1.

**Estoque (`inventory-manager.tsx`):** grid visual com imagens reais, abas "Todas/Tenho/Faltam" com contadores. Funcional desktop e mobile. Filtros por seção como tabs scrolláveis.

**Preços (`precos-album-editor.tsx`):** 3 abas com editor inline (cada linha tem botão salvar próprio). Padrão "salvar por campo" pode confundir.

**Planos (`/painel/planos`):** grid `sm:grid-cols-3`. Plan atual com badge "Atual" verde + border amber + ring. Plan PRO com badge "Popular" amber. **`alert()` nativo** em erro de checkout — quebra padrão do `ToastProvider` existente.

### c. Acessibilidade (WCAG)

| Item | Estado | Severidade |
|---|---|---|
| Contraste texto primário (#e8eaed sobre #0b0e14) | ~15:1 | OK |
| Contraste texto muted (#9ca3af) | ~5:1 | OK normal, falha em <14px |
| Contraste muted-foreground (#6b7280) | ~3:1 | **Falha** texto pequeno frequente |
| Touch target `cardQty` (vitrine) | 26×26px | **Falha** (mínimo 44px) |
| Touch target `cardAdd` (vitrine) | 32×32px | **Falha** |
| Touch target `ciCtrl` (drawer carrinho) | 22×22px | **Falha crítico** |
| Foco visível global (`:focus-visible`) | outline amber 60% | OK |
| Foco em AuthInput | `focus:ring-amber-500/10` + `outline-none` | **Falha** (ring 10% invisível) |
| `aria-label` em botões ícone | presente em quase todos | OK |
| Hierarquia heading | `<h1>` único, `<h3>` sem `<h2>` em `/painel/planos` | Skip de level (menor) |
| Alt em imagens | descritivo (`${code} - ${name}`) | OK |

### d. Responsividade

- **Breakpoints:** landing usa `sm:` + `lg:` (sem `md:`). Vitrine usa CSS Module com `max-width: 1100px` + `max-width: 600px` (não-Tailwind). Mistura mobile-first (Tailwind) com desktop-first (CSS Module).
- **Vitrine mobile:** hero ocupa fold, "Cole a lista que falta" visível. Funciona. **Filtros por tipo/preço somem em ≤1100px sem substituto** (não há botão "Filtrar").
- **Sidebar de filtros vitrine:** breakpoint 1100px é alto demais — iPad Pro landscape (1366px) vê sidebar; MacBook Air 13" janela não-maximizada (~1024px) perde sidebar.
- **Bottom nav painel:** 5 itens em 375px = ~75px largura cada. Pode truncar label em telas menores.
- **Viewport:** `viewportFit: "cover"`, `themeColor: "#0b0e14"` — correto para notch. `safe-area-bottom` definida e usada em `mobileBar`.
- **Inputs auth `text-sm` (14px):** iOS dá zoom automático ao focar campos com font-size <16px. Confunde Camila no iPhone.

### e. Pontos fortes

1. **Vitrine pública com identidade visual forte e coerente** — CSS Module próprio com tokens OKLCH, gradientes, hover de elevação, animação de entrada do carrinho. Diferenciada do painel (contexto comprador vs vendedor).
2. **Sistema de animações respeitoso ao usuário** — `prefers-reduced-motion: reduce` zera durations; `@media (hover: none)` remove hover overlays em touch.
3. **Feedback de estado consistente nos componentes auth** — `AuthButton` com loading + spinner; `AuthInput` com erro inline; `PasswordStrength` com 4 níveis.
4. **Lista de faltantes com 2 pontos de entrada visíveis no hero da vitrine** — botão CTA "Colar minha lista" + card promo. Não está escondida.
5. **Pricing table com hierarquia clara e uso atual contextualizado** — métricas reais (figurinhas/pedidos/álbuns) antes dos cards. Badge "Atual" vs "Popular" semântica correta.

### f. Pontos fracos críticos

1. **Touch targets vitrine abaixo de 44px** — `cardQty` 26px, `ciCtrl` 22px, `cardAdd` 32px. Tarefa crítica em mobile.
2. **Filtros vitrine somem em mobile sem substituto** — Rodrigo com 600 figurinhas não consegue filtrar por "apenas Especiais" no celular.
3. **"Planos" inacessível no bottom nav mobile** — Camila FREE não acha upgrade.
4. **`alert()` nativo na tela de planos** — quebra padrão do `ToastProvider` existente.
5. **Onboarding step 0 vazio aumenta atrito** — 3 cards + botão "Começar agora" sem ganho.
6. **`focus:ring-amber-500/10` invisível** — falha WCAG 2.4.11.
7. **Inputs auth `text-sm` (14px) — zoom automático iOS ao focar.**
8. **3 fontes de "amber" divergentes** — global #fbbf24, vitrine OKLCH, Tailwind `amber-400`.
9. **Pricing table com `text-zinc-*` divergindo do `text-gray-*` global.**
10. **Sidebar vitrine some em 1100px (alto)** — iPad e MacBook Air 13" não-maximizado perdem sidebar.

## 3. Best practices

### a. Padrões UX dominantes para o nicho

1. **Filtro instantâneo com chip bar sticky + bottom sheet** (ASOS, H&M mobile). Sem "Apply button" na remoção. [BTNG Studio, 2026](https://www.btng.studio/articles/top-ecommerce-ux-filter-design-patterns-practical-tips-for-2025/), [Baymard](https://baymard.com/learn/ecommerce-filter-ui).
2. **Lista de faltantes como filtro de vitrine** — Pokemon TCG Pocket wishlist ([Kotaku, 2024](https://kotaku.com/pokemon-tcg-pocket-wishlist-cards-wonder-pick-1851704678)); Controle de Figurinhas ([Google Play](https://play.google.com/store/apps/details?id=br.com.stickersmanager)); Stickers Album Tracker.
3. **Onboarding checklist persistente in-dashboard** — Userpilot 2025 (Attention Insights +47% ativação trocando wizard por checklist; Impala 100%); Linear, Stripe Atlas, Notion.
4. **Pricing table com plano recomendado destacado** — sem "Contact Sales" pra plano caro. UXPlanet, [InfluenceFlow, 2026](https://influenceflow.io/resources/saas-pricing-page-best-practices-complete-guide-for-2026/) — pricing sem destaque converte 22% pior.
5. **Bottom navigation com 4-5 tabs** — Material Design / NN Group. Mínimo 48×48px. Active state inequívoco. Padrão "More" para >5 destinos.
6. **Skeleton loaders por seção** — reduzem tempo percebido em até 40% vs spinner. React 19 + Suspense granular ([Brilworks, 2026](https://www.brilworks.com/blog/future-of-reactjs/)).
7. **Stories-style vertical product feed** — Instagram Stories expandido 2025; TikTok swipe vertical; Pinterest infinite scroll.

### b. Sistemas de design referência

1. **shadcn/ui** ([ui.shadcn.com](https://ui.shadcn.com), [Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)) — alta aplicabilidade, custo incremental, Tailwind v4 nativo, dominante 2026 ([PkgPulse](https://www.pkgpulse.com/blog/shadcn-ui-vs-base-ui-vs-radix-components-2026): "ShadCN + Tailwind v4 + Next.js stack dominante"). Modelo copy-paste — sem lock-in. **Risco:** copia ~3.000 LOC pro repo (manutenção solo).
2. **Vercel Geist** ([vercel.com/geist](https://vercel.com/geist/introduction)) — fonte já adotada (custo zero). Componentes React não-Tailwind (não recomendado para o stack atual).
3. **Catalyst** ([tailwindcss.com/plus/ui-kit](https://tailwindcss.com/plus/ui-kit)) — comercial. Descartado em favor de shadcn/ui.

### c. Tendências 2025-2026

- **AI-assisted UX** (chat embutido, autocomplete inteligente) — análogo P8: autocomplete em busca de figurinhas + sugestão de preço via LLM.
- **RSC + Suspense granular** (Next 16, streaming por seção, skeleton per-section).
- **Skeleton + shimmer** — 40% de redução em tempo percebido.
- **Micro-interações ≤200-300ms em ações frequentes.**
- **View Transitions API** (Next 16 com `viewTransition: true`).
- **Dark mode default** (82% dos usuários mobile usam dark regularmente — [NN Group via AlterSquare, 2025](https://altersquare.medium.com/dark-mode-vs-light-mode-the-complete-ux-guide-for-2025-5cbdaf4e5366)).
- **Stories-style vertical feed** para descoberta de produtos.

### d. Anti-padrões a evitar

1. **Wizard de 4+ passos no onboarding** — Userpilot 2025 documenta abandono. Substituir por checklist in-app.
2. **Modal sobre modal** — destrói contexto e cria z-index hell ([LogRocket](https://blog.logrocket.com/ux-design/modal-ux-best-practices/)).
3. **"Contact Sales" no pricing** — afasta SMB que esperam self-service. Todos os planos devem ter preço visível.
4. **Bottom nav >5 tabs** — aumenta carga cognitiva.
5. **Animações >300ms em ações frequentes** — viram fricção, não prazer.
6. **Vitrine sem indicação de estoque antes do drill-down** — Etsy mostra "X disponível" no card. Usuário não deve ter que entrar pra descobrir vazio.

## 4. Direções candidatas

5 direções estratégicas distintas (não 20 ideias rasas). D1, D2, D3, D5 são combináveis; D4 é excludente durante a janela.

### Direção 1 — "Estancar sangria"

Cirurgia mínima nos 6-8 pontos fracos confirmados em §2. Não muda a "cara". Apenas fecha buracos.

- Touch targets 44×44px (vitrine + drawer)
- `alert()` → toast existente
- "Planos" no bottom nav (4 → 5 tabs)
- `focus:ring-amber-500/60` + `focus:ring-offset-2`
- Onboarding step 0 removido
- Inputs auth `text-base` (16px)
- Pricing table `text-zinc-*` → `text-gray-*`

**Esforço:** P (1-2 sem). **Risco:** muito baixo. **Encaixe Copa:** ✓ antes. **Persona:** Rodrigo + Camila.

### Direção 2 — "Promover o diferencial"

Lista de faltantes como CTA primário em 3 superfícies, chip bar sticky + bottom sheet de filtros (Baymard), Stories-style feed na landing pública do vendedor.

- CTA hero da vitrine pública
- URL `?paste-list=BRA1,BRA5,BRA12` (deep link compartilhável)
- Demo no onboarding
- Indicador de estoque por figurinha pré-drill-down

**Esforço:** M (3-4 sem). **Risco:** médio-alto (1.052 LOC sem testes). **Encaixe Copa:** parcial. **Persona:** Rodrigo + cliente final. **Adiada pós-Copa.**

### Direção 3 — "Onboarding-first"

Wizard 5 passos → 1 tela + checklist persistente in-dashboard.

- Single page: nome loja + slug + senha + álbum primário
- Painel ganha checklist persistente (5 itens, deep links)
- Item se marca sozinho via Server Action
- "Copiar link" como CTA visível desde o primeiro segundo

**Esforço:** M (1-2 sem). **Risco:** baixo-médio (greenfield rewrite). **Encaixe Copa:** ✓. **Persona:** Camila + Rodrigo.

### Direção 4 — "Adoção shadcn/ui sistêmica"

Substitui design ad-hoc por shadcn com tokens OKLCH unificados + componentes nativos Radix.

- ~15 componentes shadcn copiados pra `components/ui/`
- Tokens OKLCH único no `@theme`
- Refactor de `AuthInput`, drawer, modais
- A11y por padrão (Radix)

**Esforço:** G (4-6 sem). **Risco:** alto durante Copa. **Encaixe Copa:** **não — pós-Copa.** **Persona:** todas (indireto). **Adiada Q3/26.**

### Direção 5 — "Polimento de receita"

Foca apenas em conversão FREE→PRO.

- Pricing table com PRO destacado + self-service
- Modal de limite contextual com ROI
- "Planos" no bottom nav
- `alert()` → toast
- Banner inline 80% do limite

**Esforço:** P-M (2-3 sem). **Risco:** baixo. **Encaixe Copa:** ✓. **Persona:** Rodrigo + Paulo (decisão de compra).

### Trade-offs comparados

| Eixo | D1 | D2 | D3 | D4 | D5 |
|---|---|---|---|---|---|
| Cobre pontos fracos críticos | ~30% | ~40% | ~25% | ~90% | ~30% |
| Tempo até deploy 1º incremento | ~5d | ~12d | ~8d | ~25d | ~8d |
| Risco de regressão | Muito baixo | Médio-alto | Baixo-médio | Alto | Baixo |
| Move agulha conversão FREE→PRO | Pouco | Médio (top funil) | Alto (ativação) | Indireto | Alto (decisão) |
| Sustentabilidade pós-Copa | Baixa | Média | Alta | Muito alta | Média |
| Combinável | D2/D3/D5 | D1/D3/D5 | D1/D2/D5 | Excludente | D1/D2/D3 |
| Encaixe Copa 6 sem | ✓ | parcial | ✓ | ✗ | ✓ |

### Recomendação do arquiteto (decisão do operador)

**Combinar D1 + D3 + D5 — aceito pelo operador no DECISION POINT do Step 4.** Adiar D2 pós-Copa, D4 para Q3/26.

Sequência:
1. **Sem 1-2:** D1 (sangria — quick wins compostos)
2. **Sem 2-4:** D3 (onboarding — em paralelo parcial)
3. **Sem 4-6:** D5 (modal contextual com ROI antes do pico Copa)

**Discordância explícita:** D4 (shadcn/ui) é tentação errada agora. Fundador solo + zero budget + ~6 semanas + 2.000+ LOC sem testes na vitrine/estoque = refactor sistêmico é receita pra acidente em produção. Shadcn fica pra Q3, depois que D2 entregar testes.

## 5. Direção escolhida — aprofundamento

A direção D1+D3+D5 é uma sequência cronológica de 6 semanas: **D1 prepara o palco** (limpa quality issues), **D3 enche o palco** (mais sellers ativados de fato), **D5 cobra ingresso** (conversão FREE→PRO no momento de maior intent).

### a. Componentes-chave a redesenhar

#### D1 — Estancar sangria

| # | Caminho | Mudança | LOC |
|---|---------|---------|-----|
| 1 | `src/components/loja/store-album-view.module.css` | `cardQty` 26→44px, `ciCtrl` 22→44px, `cardAdd` 32→44px | ~15 |
| 2 | `src/app/painel/planos/page.tsx` | Remover `alert()`, usar `useToast`; `text-zinc-*` → `text-gray-*` | ~30 |
| 3 | `src/components/painel/painel-shell.tsx` (~linha 210) | Adicionar 5º item "Planos" ao `mobileNav` | ~8 |
| 4 | `src/components/auth/auth-input.tsx` | `focus:ring-amber-500/60` + `focus:ring-offset-2`; `text-sm` → `text-base` | ~4 |
| 5 | `src/app/onboarding/page.tsx` | Remover step 0 (linhas ~222-265) | ~50 removidas |

**Risco D1:** muito baixo. CSS/string/order — sem lógica.

#### D3 — Onboarding-first

| # | Caminho | Mudança | LOC |
|---|---------|---------|-----|
| 6 | `src/app/onboarding/page.tsx` | **Rewrite** 772 → ~250 LOC. Single page com 4 campos | -522 líquidos |
| 7 | `prisma/schema.prisma` | Adicionar `Seller.onboardingCompletedAt DateTime?` + `checklistDismissedAt DateTime?` | +2 campos |
| 8 | `src/app/painel/onboarding/actions.ts` (NEW) | Server Actions: `markChecklistItem`, `dismissChecklist`, `completeOnboarding` | ~80 |
| 9 | `src/components/painel/onboarding-checklist.tsx` (NEW) | Card com 5 itens (1 ✓ sempre, 4 acionáveis com deep links) | ~120 |
| 10 | `src/components/painel/painel-shell.tsx` | Slot condicional pro checklist | ~15 |
| 11 | `src/lib/seller-onboarding.ts` (NEW) | `getChecklistState(sellerId)` retorna 4 booleans | ~50 |

**Risco D3:** médio (rewrite). Mitigação: 3-4 testes happy path antes do rewrite.

#### D5 — Polimento de receita

| # | Caminho | Mudança | LOC |
|---|---------|---------|-----|
| 12 | `src/app/painel/planos/page.tsx` | Pricing table redesenhada — PRO destacado, sem "Contact Sales", CTA Stripe direto | ~80 |
| 13 | `src/lib/plan-limits.ts` | Em `checkStickerLimit/OrderLimit/AlbumLimit`: chamar `track('plan_limit_hit', {...})` antes do return false | ~6 × 3 |
| 14 | `src/components/painel/plan-limit-modal.tsx` (NEW) | Modal contextual com ROI calculado client-side | ~150 |
| 15 | `src/components/painel/usage-warning-banner.tsx` (NEW) | Banner inline quando `usage / limit >= 0.8` | ~60 |
| 16 | `src/lib/telemetry.ts` (NEW se Estrutura Fase 2 ainda não criou) | `track(event, props)` Vercel Analytics + Sentry breadcrumb | ~40 |
| 17 | `src/app/painel/{estoque,pedidos}/page.tsx` | Slot pra `<UsageWarningBanner />` | ~6 × 2 |

**Risco D5:** baixo-médio. Re-ativar plan limits cria fricção em sellers FREE existentes (mitigação em §e).

### b. Mockups conceituais

**Mockup 1 — Onboarding novo single-page (D3)** — Mobile 375px:

```
┌─────────────────────────┐
│  ←  Configurar loja     │
├─────────────────────────┤
│  Boas-vindas! Em 30s    │
│  você está vendendo.    │
│                         │
│  Nome da loja           │
│  ┌─────────────────────┐│
│  │ Cards do João       ││
│  └─────────────────────┘│
│                         │
│  Link da loja           │
│  figurinhaspro.com/loja/│
│  ┌─────────────────────┐│
│  │ cards-do-joao       ││
│  └─────────────────────┘│
│  ✓ Disponível           │
│                         │
│  Álbum principal        │
│  ◉ Copa 2026 (FIFA)     │
│  ○ Copa América 2026    │
│  ○ Pular — crio depois  │
│                         │
│  ┌─────────────────────┐│
│  │  Criar minha loja → ││
│  └─────────────────────┘│
│                         │
│  Já tem conta? Entrar   │
└─────────────────────────┘
```

Desktop ≥1024px: mesma estrutura, max-width 480px centralizado.

**Mockup 2 — Painel com checklist persistente (D3)** — Desktop ≥1024px:

```
┌──────────────────────────────────────────────────────────────┐
│  FigurinhasPro     [Estoque] [Pedidos] [Preços] [Planos] 👤 │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────── × Dispensar│
│  │  Faltam 3 passos pra sua primeira venda                  │
│  │  ▰▰▱▱▱  2/5                                              │
│  │                                                          │
│  │  ✓ Loja criada                                           │
│  │  ✓ Link copiado                                          │
│  │  ☐ Adicionar 10 figurinhas    [Adicionar agora →]        │
│  │  ☐ Definir preço base          [Definir preços →]        │
│  │  ☐ Receber primeira venda      (compartilhe seu link)    │
│  └──────────────────────────────────────────────────────────┘
│                                                              │
│  Resumo                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │ Estoque  │  │ Pedidos  │  │ Receita  │                    │
│  │   0      │  │    0     │  │  R$ 0    │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

Comportamento: card desaparece quando `onboardingCompletedAt != null` (5/5 ✓) ou `checklistDismissedAt != null` (botão "Dispensar"). Reaparece nunca — permanente fora.

**Mockup 3 — Modal de limite contextual com ROI (D5)** — Mobile 375px:

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │     ×             │  │
│  │                   │  │
│  │  Você atingiu     │  │
│  │  100/100 figuri-  │  │
│  │  nhas no FREE     │  │
│  │  ━━━━━━━━━━━━━━━  │  │
│  │  No PRO, você     │  │
│  │  teria adicionado │  │
│  │  as últimas       │  │
│  │  ┏━━━━━━━━━━━━━┓  │  │
│  │  ┃   15        ┃  │  │
│  │  ┃  figurinhas ┃  │  │
│  │  ┗━━━━━━━━━━━━━┛  │  │
│  │                   │  │
│  │  Estimativa GMV:  │  │
│  │  R$ 187,50        │  │
│  │  (15 × R$ 12,50)  │  │
│  │                   │  │
│  │ ┌───────────────┐ │  │
│  │ │ Assinar PRO   │ │  │
│  │ │ R$ 49/mês     │ │  │
│  │ └───────────────┘ │  │
│  │                   │  │
│  │  Continuar no FREE│  │
│  └───────────────────┘  │
└─────────────────────────┘
```

Trigger: disparado quando seller tenta adicionar figurinha #101. Antes do modal: `track('plan_limit_hit', {...})`.

**Mockup 4 — Bottom nav mobile com "Planos" (D1+D5)** — 375px:

```
┌─────────────────────────┐
│ [Estoque][Pedidos][Preços][Planos][Perfil]  │
│   📦      📋      💰     ⭐    👤            │
└─────────────────────────┘
                          ↑
                     NEW (item 3 do D1)
```

Ícone "Planos" com badge dourada quando seller é FREE com >80% uso.

**Mockup 5 — Pricing table redesenhada (D5)** — Desktop ≥1024px:

```
┌──────────────────────────────────────────────────────────────┐
│  Escolha seu plano                                           │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌─────────────────────┐  ┌──────────┐         │
│  │  FREE    │  │ ⭐ MAIS POPULAR     │  │UNLIMITED │         │
│  │  R$ 0    │  │       PRO           │  │          │         │
│  │          │  │     R$ 49/mês       │  │  R$ 149  │         │
│  │  • 100   │  │   ━━━━━━━━━━━━━━━   │  │  /mês    │         │
│  │    figs  │  │  • 1.000 figs       │  │  • ∞     │         │
│  │  • 1     │  │  • Albums custom    │  │  • Pri-  │         │
│  │   álbum  │  │  • Tiers de qtd     │  │    ority │         │
│  │  • Pre-  │  │  • Stripe checkout  │  │   support│         │
│  │    ços   │  │  • Bottom nav       │  │  • Tudo  │         │
│  │   simples│  │                     │  │   do PRO │         │
│  │ [Atual]  │  │ ┌─────────────────┐ │  │ ┌──────┐ │         │
│  │          │  │ │ Assinar PRO →  │ │  │ │ Falar│ │         │
│  │          │  │ └─────────────────┘ │  │ │  com │ │         │
│  │          │  │   7 dias grátis     │  │ │  time│ │         │
│  │          │  │                     │  │ └──────┘ │         │
│  └──────────┘  └─────────────────────┘  └──────────┘         │
│   sem ring    ring-2 ring-amber-500     sem ring             │
└──────────────────────────────────────────────────────────────┘
```

Mobile: uma coluna, PRO no topo (ordem rearranjada), FREE/UNLIMITED abaixo.

### c. Plano de migração — 7 PRs sequenciais

Premissa: 1 fundador solo, ~3h/dia úteis, ~15h/semana.

#### PR-A — D1 batch 1: Touch targets vitrine
- **Direção:** D1
- **Arquivos:** `src/components/loja/store-album-view.module.css` (apenas), screenshots Playwright pré/pós
- **Pronto:** 3 botões medem ≥44px no DevTools; Lighthouse a11y baseline + post (target ≥+5 pontos); screenshot mobile 375px
- **Risco:** layout quebrar em vitrine apertada. Mitigação: reduzir `gap` se necessário
- **Dependências:** nenhuma
- **Tempo:** ~1d (3h)

#### PR-B — D1 batch 2: Quality grab-bag
- **Direção:** D1
- **Arquivos:** `painel/planos/page.tsx` (alert→toast + zinc→gray), `painel-shell.tsx` (Planos no mobileNav), `auth-input.tsx` (focus + text-base), `onboarding/page.tsx` (remove step 0)
- **Pronto:** zero `alert(` em `painel/`; bottom nav mostra 5 itens em 375px; inputs auth font-size 16px (Safari iOS sem zoom); onboarding começa no step "Nome da loja"
- **Risco:** remover step 0 sem ajustar `STEPS` array — rewrite vem em PR-D, aqui só `STEPS.filter(...)`
- **Dependências:** nenhuma
- **Tempo:** ~2-3d (~7h)

#### PR-C — D3 schema + Server Actions
- **Direção:** D3
- **Arquivos:** `prisma/schema.prisma` (+ campos), `src/lib/seller-onboarding.ts` (NEW), `src/app/painel/onboarding/actions.ts` (NEW), 2-3 testes
- **Pronto:** `prisma db push` aplica sem warning; `getChecklistState` retorna booleans corretos pra sellers de teste; testes verdes; sem mudança de UI
- **Risco:** `onboardingStep` legado em conflito. Mitigação: ler schema antes; manter campos lado-a-lado
- **Dependências:** nenhuma
- **Tempo:** ~2d (~6h)

#### PR-D — D3 onboarding rewrite
- **Direção:** D3
- **Arquivos:** `onboarding/page.tsx` (rewrite 772 → ~250 LOC), testes de fluxo
- **Pronto:** 1 tela só (sem stepper); tempo signup→painel ≤30s; validação de slug em tempo real; 3 testes verdes; screenshots mobile + desktop
- **Risco:** sellers com onboarding parcial em estado inválido. Mitigação: query única que migra
- **Dependências:** PR-C
- **Tempo:** ~4-5d (~14h)

#### PR-E — D3 checklist persistente
- **Direção:** D3
- **Arquivos:** `onboarding-checklist.tsx` (NEW), `painel-shell.tsx` (slot)
- **Pronto:** seller novo vê 4/5 com "Loja criada" ✓; cada item se marca sozinho via `getChecklistState`; "Dispensar" funciona; card some quando 5/5 ou dispensado; screenshots
- **Risco:** detectar "primeiro link compartilhado" sem evento. Mitigação: botão "Copiar link" marca via Server Action ou item manual ("Marquei como compartilhado")
- **Dependências:** PR-C, PR-D
- **Tempo:** ~3d (~9h)

#### PR-F — D5 pricing table + modal contextual (caminho crítico)
- **Direção:** D5
- **Arquivos:** `painel/planos/page.tsx` (redesign), `plan-limit-modal.tsx` (NEW), `plan-limits.ts` (re-ativar limites + dispatch), `telemetry.ts` (NEW se Fase 2 ainda não criou)
- **Pronto:** PRO com ring + badge + Stripe Checkout direto; figurinha #101 dispara modal; modal mostra ROI calculado de `Order.history`; testes em `plan-limits.test.ts`; screenshots
- **Risco principal:** **re-ativar limites cria fricção em sellers FREE existentes acima de 100 figurinhas.** Mitigação: query antes do PR — se algum seller FREE tem >100, criar `Seller.grandfatheredFreeLimit DateTime?` ou heurística
- **Dependências:** Estrutura Fase 2 (telemetry.ts) idealmente. Se atrasar, criar versão minimalista aqui
- **Tempo:** ~4d (~12h)

#### PR-G — D5 banner 80% + integração
- **Direção:** D5
- **Arquivos:** `usage-warning-banner.tsx` (NEW), `painel/estoque/page.tsx` (slot), `painel/pedidos/page.tsx` (slot)
- **Pronto:** seller FREE com 80 figurinhas vê banner em estoque + pedidos; seller PRO nunca vê; CTA abre `/painel/planos`; `track('upsell_banner_view')` dispara; screenshots
- **Risco:** banner virar ruído. Mitigação: limitar a estoque + pedidos (alta intent), não em dashboard
- **Dependências:** PR-F
- **Tempo:** ~1-2d (~4h)

**Total:** ~17 dias úteis = **~3.5 semanas de trabalho efetivo** dentro de 6 semanas. Folga de ~2.5 semanas absorve atrasos + Estrutura Fase 1/2 pousarem.

### d. Métricas de sucesso

#### D1

| Métrica | Baseline | Target | Como medir |
|---|---|---|---|
| Lighthouse a11y mobile vitrine | desconhecido — rodar pré-PR-A | ≥90 | `npx lighthouse https://album-digital-ashen.vercel.app/loja/<slug>/<albumSlug>` |
| Bug reports "botão pequeno" / "não consegui clicar" | desconhecido | 0 nas 4 sem pós-PR | Inbox WhatsApp + email |
| Console errors em `/onboarding` (Sentry) | desconhecido | 0 errors únicos novos | Sentry pós-deploy PR-B |

#### D3

| Métrica | Baseline | Target | Como medir |
|---|---|---|---|
| Taxa de ativação (signup → 1ª figurinha em 7d) | desconhecido (G7) | ≥60% (hipótese declarada) | `COUNT(DISTINCT s.id) FILTER (WHERE i.id IS NOT NULL)` em janela 7d |
| Tempo signup → 1ª figurinha (mediana) | desconhecido | <24h | `MIN(i.createdAt) - s.createdAt` |
| Taxa de conclusão checklist (5/5) em 14d | n/a | ≥40% | `Seller.onboardingCompletedAt < createdAt + 14d` |

**Premissa:** target 60% é hipótese. SaaS B2C de e-commerce simples = 40-70%. Se 35-50% ainda é progresso vs baseline desconhecido.

#### D5

| Métrica | Baseline | Target | Como medir |
|---|---|---|---|
| Sellers PRO pagantes (cumulativo) | desconhecido — Stripe Dashboard, provavelmente 0-2 | ≥3 em 31/05; ≥10 em 31/07 (alinhado Marketing §3.b) | Stripe Dashboard → `subscription.status = active AND plan = PRO` |
| Taxa de conversão FREE→PRO em 30d (após 80% do limite) | n/a — sem banner | ≥15% | `SubscriptionEvent` × `plan_limit_hit` events em 30d |
| CTR modal contextual (vê → clica "Assinar PRO") | n/a | ≥25% | `plan_limit_modal_view` ÷ `plan_limit_modal_cta_click` |

**Premissa:** "10 sellers PRO em 31/07" depende **diretamente** da Copa trazer signups. Se Copa < 50 signups, target proporcional cai pra 5-7 PRO.

### e. Riscos e ressalvas

#### R1 — Cobertura de testes desigual entre direções
- **Onde:** D5 toca `plan-limits.ts` e `planos/page.tsx`. ADR 0005 (TDD) está em rollout
- **Mitigação:** PR-F escreve testes RED→GREEN; PR-D escreve testes do onboarding novo
- **Pivô:** se testes derem trabalho desproporcional Sem 2-3, fragmentar PR-D em D-1 rewrite + D-2 testes, com prazo definido pra dívida

#### R2 — Re-ativar plan limits cria fricção em sellers FREE existentes
- **Onde:** `plan-limits.ts` está com guards `true` (decisão histórica). PR-F re-ativa
- **Mitigação:** **antes** do PR-F, query `SELECT sellerId, COUNT(*) FROM Inventory GROUP BY sellerId HAVING COUNT(*) > 100`. Se houver sellers FREE acima do limite, **grandfather** via `Seller.grandfatheredFreeLimit` ou heurística "criado antes de 2026-04-01"
- **Pivô:** se ≥10 sellers acima, soft enforcement (só banner, sem bloquear) na 1ª iteração; bloqueio efetivo no Q3

#### R3 — Telemetria depende de Estrutura Fase 2
- **Onde:** `track('plan_limit_hit', ...)` precisa de `telemetry.ts` da Estrutura Fase 2
- **Mitigação:** se Fase 2 não pousou até início Sem 4, PR-F cria `telemetry.ts` minimalista (Vercel Analytics + Sentry breadcrumb apenas)
- **Pivô:** sem telemetria, métricas §d ficam parciais. Aceitar e documentar como "métrica diferida"

#### R4 — Trial PRO automático depende de Estrutura Fase 1 + Fase 4
- **Onde:** mockup 5 menciona "7 dias grátis" no PRO; ativar trial automático precisa de `Seller.trialEndsAt` (Fase 1) + cron downgrade (Fase 4)
- **Mitigação:** se ambas atrasarem, **manter copy "7 dias grátis" mas operar manualmente** — admin lança trial via Stripe Dashboard, downgrade pós-7d na unha. Volume baixo na Copa = viável (≤30 trials × 30s = 15min/dia)
- **Pivô:** se admin work crescer, automatizar Q3

#### R5 — Janela Copa em ~6 semanas — atraso de PR-F é fatal
- **Onde:** PR-F (D5 receita) é o de maior LOC e maior risco. Se atrasar pra Sem 6+, perde pico Copa (15/06-13/07)
- **Mitigação:** ordem de prioridade clara — **se algum PR precisar ser pulado, ordem decrescente: PR-G, PR-A, PR-B, PR-E, PR-D, PR-C, PR-F**. PR-F é último a ser cortado
- **Pivô:** se Sem 4 PR-D não merged, congelar D3 (deixar checklist pra v2) e correr pra D5. **Receita > ativação dentro da janela Copa**

## 6. Relatório executivo

**Direção escolhida:** D1 + D3 + D5 combinadas, em 7 PRs sequenciais (~17 dias úteis em 6 semanas). D2 (lista de faltantes promovida) e D4 (shadcn/ui sistêmico) adiadas pós-Copa e Q3/26 respectivamente.

**5 superfícies redesenhadas:**
1. **Vitrine pública** — touch targets 44px, foco visível, filtros mobile sticky (D1)
2. **Onboarding** — wizard 5 passos → single page + checklist persistente (D3)
3. **Painel** — bottom nav 5 tabs com "Planos", checklist persistente no topo (D1+D3)
4. **Página de planos** — pricing table com PRO destacado + Stripe self-service (D5)
5. **Modal de limite + banner 80%** — ROI contextual no momento de maior intent (D5)

**Caminho crítico:** PR-F (D5 receita) — único que toca lógica de receita ativa antes do pico Copa (15/06). Se PR-F atrasar pra Sem 6+, perde-se a janela de conversão da Copa.

**3 hipóteses centrais a validar:**

- **H1 (D5):** modal contextual com ROI converte FREE→PRO mais que pricing genérico — testada via CTR do modal (target ≥25%)
- **H2 (D3):** onboarding single-page + checklist reduz desistência D0 vs wizard 5-passos — testada via taxa de ativação (target ≥60% em 7d)
- **H3 (D5):** re-ativar plan limits durante Copa não cria atrito desproporcional com sellers FREE atuais — depende de query de grandfathering antes do PR-F

**4 gaps fechados nesta fase de design:**

- **GD1** — Touch targets vitrine abaixo de 44px (D1, PR-A)
- **GD2** — Filtros vitrine inacessíveis em mobile (adiado D2 pós-Copa)
- **GD3** — "Planos" ausente no bottom nav mobile (D1, PR-B)
- **GD4** — Onboarding wizard 5 passos faz Camila desistir (D3, PR-D)

**Próxima fase Oracle:** `/oracle:definicao-prototipo` — define escopo executável do protótipo (pasta separada / branch isolada / repo paralelo) a partir dos relatórios 01-04. Pré-requisitos: 01, 02, 03, 04 (✅).

**Itens fora desta fase mas que demandam atenção paralela:**

- **D2 (lista de faltantes promovida)** — diferencial-killer identificado em Marketing §5.d, mas refactor em `store-album-view.tsx` (1.052 LOC sem testes) é arriscado durante Copa. Adiar custa: vitrine continua subótima durante o pico de tráfego.
- **D4 (shadcn/ui sistêmico)** — adiado para Q3/26. Aceita-se 4-6 meses de design ad-hoc até lá.
- **Refactor de componentes gigantes** (`store-album-view.tsx`, `inventory-manager.tsx`, `precos-album-editor.tsx`) — pós-Copa, depois que `lib/` estiver coberto por testes.
- **WCAG completo** — não é prioridade declarada, mas violações graves (contraste muted-foreground em texto pequeno, foco em AuthInput) atacadas em D1.
