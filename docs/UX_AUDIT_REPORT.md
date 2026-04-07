# Auditoria UX Consolidada -- FigurinhasPro (P8)

**Data:** 2026-04-05
**Agentes auditores:** 9 (Arquitetura de Informacao, Onboarding, Hierarquia Visual, Consistencia, Fluxos Criticos, Feedback/Estados, Acessibilidade WCAG, Adversarial/Frustrado, Benchmarking)
**Sintetizado por:** Agent 10

---

## A) Resumo Executivo

O FigurinhasPro tem uma base solida de design (dark mode coeso, tokens CSS, responsividade mobile-first, componentes auth padronizados) e um posicionamento unico no mercado brasileiro como SaaS para vendedores de figurinhas. Contudo, a auditoria revela **problemas criticos de integridade de dados e feedback** que podem causar perda silenciosa de pedidos e estoque. Os achados mais graves sao: checkout fire-and-forget que perde pedidos sem feedback, acoes destrutivas no estoque sem confirmacao, saves de preco sem tratamento de erro, e a API de pedidos aceitando precos do client (vulnerabilidade financeira). A infraestrutura para corrigir a maioria destes problemas ja existe (ToastContext, ConfirmDialog, Stripe SDK) -- o trabalho e de integracao, nao de construcao. O score geral de UX estimado e **52/100**, com pontos fortes em design visual e fluxo basico de compra, mas debilidades serias em acessibilidade (58/100 WCAG), consistencia de tokens, e robustez de estados de erro.

---

## B) Top 10 Problemas Mais Criticos

| # | Problema | Sev. | Impacto (1-5) | Esforco | Arquivo(s) Principal(is) | Agentes |
|---|---------|------|:---:|:---:|---|---|
| 1 | **Checkout fire-and-forget**: POST /api/orders sem await, carrinho zerado antes de confirmacao, pedido pode ser perdido silenciosamente | CRITICO | 5 | PP | `components/loja/store-album-view.tsx:857-878` | 5, 6, 8 |
| 2 | **Order API aceita precos do client**: unitPrice vem do body sem recalculo server-side, permitindo manipulacao financeira | CRITICO | 5 | P | `app/api/orders/route.ts` | 8 |
| 3 | **"Zerar Secao" no estoque sem confirmacao**: um toque apaga dezenas de figurinhas, sem undo, sem ConfirmDialog | CRITICO | 4 | PP | `components/painel/inventory-manager.tsx` | 5, 6, 8 |
| 4 | **Saves de preco sem try/catch**: precos globais e por album salvam silenciosamente em caso de erro (vendedor opera com precos que nao sabe se foram salvos) | CRITICO | 4 | PP | `components/painel/precos-global-editor.tsx`, `components/painel/precos-album-editor.tsx` | 6 |
| 5 | **Tela branca no painel sem sessao**: paginas /painel/* retornam null se sessao expirada, sem redirect para /login, sem mensagem | CRITICO | 5 | P | `app/painel/page.tsx`, `app/painel/estoque/page.tsx`, todos /painel/* | 5, 8 |
| 6 | **maximumScale: 1 bloqueia zoom**: viola WCAG 1.4.4, impede usuarios com baixa visao de ampliar no iOS | CRITICO | 3 | PP | `app/layout.tsx:23` | 7 |
| 7 | **Reset de senha nao envia email**: console.log do token em producao, usuario recebe "Verifique seu email" mas nada chega | CRITICO | 4 | M | `app/api/auth/forgot-password/route.ts:31-32` | 2 |
| 8 | **Modais da loja sem focus trap / role dialog**: import, checkout e carrinho sem aria-modal, sem Escape handler, sem focus trap (WCAG 2.1.1 + 4.1.2) | ALTO | 3 | P | `components/loja/store-album-view.tsx:656,708,841` | 7 |
| 9 | **Optimistic update no inventario sem rollback**: se POST falha, UI mostra quantidade diferente do banco, sem reversao automatica | ALTO | 4 | P | `components/painel/inventory-manager.tsx` | 8 |
| 10 | **Planos inacessivel no mobile**: bottom nav com 5 itens exclui "Planos", usuario mobile nao consegue fazer upgrade | ALTO | 4 | PP | `components/painel/painel-shell.tsx:30` | 1, 5, 8 |

---

## C) Plano de Sprints

### Sprint 1 -- Quick Wins (1 dia, ~8h)

Itens que podem ser resolvidos com poucas linhas e impacto imediato.

| # | Problema | Arquivo(s) | Solucao | Esforco |
|---|---------|-----------|---------|:---:|
| S1.1 | Checkout fire-and-forget | `components/loja/store-album-view.tsx:857-878` | Adicionar `await` no fetch, mover limpeza de carrinho para apos resposta 200, adicionar catch com toast.error e retry. | PP |
| S1.2 | Saves de preco sem try/catch | `components/painel/precos-global-editor.tsx`, `components/painel/precos-album-editor.tsx` | Envolver cada fetch de save em try/catch, adicionar `toast.error("Erro ao salvar preco")` no catch. | PP |
| S1.3 | "Zerar Secao" sem confirmacao | `components/painel/inventory-manager.tsx` | Adicionar `ConfirmDialog` (ja existe em `components/ui/confirm-dialog.tsx`) antes de executar `clearSection()`. | PP |
| S1.4 | maximumScale: 1 | `app/layout.tsx:23` | Remover `maximumScale: 1` do export `viewport`. | PP |
| S1.5 | alert() nativo em Planos | `app/painel/planos/page.tsx:111,133` | Substituir `alert(...)` por `toast.error(...)` usando o ToastContext existente. | PP |
| S1.6 | Planos no mobile bottom nav | `components/painel/painel-shell.tsx:30` | Adicionar "Planos" como 6o item ou substituir por menu "Mais" (overflow). | PP |
| S1.7 | AuthError sem role="alert" | `components/auth/auth-error.tsx` | Adicionar `role="alert"` no div container. | PP |
| S1.8 | Toast sem aria-live | `components/toast.tsx` | Adicionar `aria-live="polite" aria-atomic="true"` no container fixo. | PP |
| S1.9 | Onboarding step 3 -- erro silencioso | `app/onboarding/page.tsx` (catch do step 3) | Adicionar `toast.error("Erro ao configurar precos")` no catch. | PP |
| S1.10 | Background divergente em /albuns | `app/albuns/page.tsx` | Trocar `bg-[#09090b]` por `bg-background`. | PP |
| S1.11 | Inputs de busca sem aria-label | `components/loja/store-album-view.tsx:411`, `app/painel/pedidos/page.tsx:133` | Adicionar `aria-label="Buscar figurinha"` nos inputs de busca. | PP |
| S1.12 | Botoes de fechar/remover sem aria-label | `components/loja/store-album-view.tsx:717,775`, `components/painel/inventory-manager.tsx:64` | Adicionar `aria-label` descritivo em cada botao icone. | PP |
| S1.13 | Loading no botao de checkout | `components/loja/store-album-view.tsx` (submit checkout) | Adicionar estado `submitting` que desabilita o botao e mostra spinner, prevenindo cliques duplos. | PP |
| S1.14 | Texto minimo 10px (eliminar text-[9px]) | `components/painel/inventory-manager.tsx`, `components/loja/store-album-view.tsx` | Substituir `text-[9px]` por `text-[10px]` em nomes de sticker e precos. Global find-replace. | PP |

**Total Sprint 1: ~14 itens, ~6-8h de trabalho.**

---

### Sprint 2 -- Alto Impacto (2-3 dias)

Itens que exigem mais logica mas resolvem problemas estruturais.

| # | Problema | Arquivo(s) | Solucao | Esforco |
|---|---------|-----------|---------|:---:|
| S2.1 | Order API aceita precos do client | `app/api/orders/route.ts` | Recalcular `unitPrice` server-side usando `resolveUnitPrice()` de `lib/price-resolver.ts`. Ignorar preco enviado pelo client. | P |
| S2.2 | Tela branca sem sessao no painel | Todos os `app/painel/*/page.tsx` | Substituir `if (!seller) return null` por `if (!seller) redirect("/login")` com import de `next/navigation`. Ou implementar no `app/painel/layout.tsx` centralizado. | P |
| S2.3 | Optimistic update sem rollback | `components/painel/inventory-manager.tsx` | Salvar valor anterior antes do update, no catch reverter `stockMap` e informar usuario. | P |
| S2.4 | Focus trap e role dialog nos modais | `components/loja/store-album-view.tsx:656,708,841` | Adicionar `role="dialog" aria-modal="true"`, focus trap (cycle Tab), handler Escape. Ou extrair componente Modal reutilizavel. | P |
| S2.5 | Reset de senha nao envia email | `app/api/auth/forgot-password/route.ts:31-32` | Integrar Resend SDK para envio real do token por email. | M |
| S2.6 | Precos default inconsistentes (registro vs onboarding) | `app/api/auth/register/route.ts:59-66`, `app/onboarding/page.tsx:39` | Criar `lib/default-prices.ts` como unica fonte. Ou nao criar PriceRules no registro e deixar so pro onboarding. | P |
| S2.7 | "Marcar todas" sobrescreve quantidades | `components/painel/inventory-manager.tsx` | Adicionar ConfirmDialog: "Isso definira todas as figurinhas para quantidade 1. Quantidades maiores serao reduzidas." | PP |
| S2.8 | Status de pedido sem maquina de estados | `app/api/orders/[id]/route.ts` | Definir mapa de transicoes validas (QUOTE->CONFIRMED->PAID->SHIPPED->DELIVERED, qualquer->CANCELLED). Rejeitar invalidas com 400. | P |
| S2.9 | Seller sem telefone -> WhatsApp URL quebrada | `components/loja/store-album-view.tsx` | Se `sellerPhone` ausente/invalido, desabilitar checkout e mostrar mensagem de contato indisponivel. | PP |
| S2.10 | Unificar componente Modal | `components/painel/inventory-manager.tsx`, `components/loja/store-album-view.tsx`, `components/ui/confirm-dialog.tsx` | Criar `components/ui/modal.tsx` com bg/border/radius/focus-trap padrao. Migrar os 3+ estilos existentes. | P |
| S2.11 | Unificar componente Input do painel | Multiplos componentes do painel | Criar `PanelInput` com estilos consistentes (rounded-lg, zinc-900, zinc-700) ou estender AuthInput com variante "panel". | P |
| S2.12 | Touch targets +/- abaixo de 44px | `components/painel/inventory-manager.tsx`, `components/loja/store-album-view.tsx` | Adicionar `min-h-[44px] min-w-[44px]` nos botoes +/- de quantidade. | PP |
| S2.13 | Logout sem confirmacao (toque acidental) | `components/painel/painel-shell.tsx` | Adicionar ConfirmDialog antes de executar POST /api/auth/logout. | PP |
| S2.14 | Deletar album com pedidos ativos | `app/api/albums/[id]/route.ts` | Antes do DELETE, verificar pedidos nao-finalizados. Bloquear se existirem. | P |
| S2.15 | Login com senhas plaintext (fallback legado) | `app/api/auth/login/route.ts` | Script one-time para migrar senhas plaintext para bcrypt. Remover fallback de comparacao direta. | P |

**Total Sprint 2: ~15 itens, ~2-3 dias.**

---

### Sprint 3 -- Melhorias Estruturais (1+ semana)

| # | Problema | Arquivo(s) | Solucao | Esforco |
|---|---------|-----------|---------|:---:|
| S3.1 | Padronizar tokens de borda e background | `app/globals.css`, multiplos componentes | Migrar hardcodes (`border-zinc-800`, `bg-[#0f1219]`, etc.) para `var(--border)`, `var(--card)`. Declarar novos tokens `--bg-input`, `--border-input`, `--bg-modal`. | G |
| S3.2 | Padronizar botao primario (4+ implementacoes) | `app/globals.css`, multiplos componentes | Consolidar `.btn-primary` como unica fonte. Usar `cn("btn-primary", ...)` em vez de recriar inline. | G |
| S3.3 | Verificar-email: implementar ou remover | `app/(auth)/verificar-email/page.tsx`, `app/api/auth/` | Implementar envio real via Resend + verificacao de token no fluxo de registro. Ou remover a pagina. | G |
| S3.4 | Carrinho legado (dead code) + dois sistemas | `lib/cart-context.tsx`, `components/cart-drawer.tsx` | Auditar uso real. Se nao usado, remover. Se usado, consolidar com carrinho do store-album-view. | M |
| S3.5 | Contraste de cores insuficiente (--muted, zinc-600, placeholders) | `app/globals.css`, multiplos componentes | Ajustar `--muted` de `#71717a` para `#9ca3af` (ou mais claro). Placeholders de `text-zinc-600` para `text-zinc-500`. Auditar com ferramenta de contraste. | G |
| S3.6 | Empty states ad-hoc (5+ implementacoes) | Multiplos componentes | Migrar todos os empty states inline para usar `components/ui/empty-state.tsx` existente. | M |
| S3.7 | Revalidacao de carrinho ao carregar (7 dias stale) | `components/loja/store-album-view.tsx` | Ao restaurar do localStorage, verificar estoque e precos atuais via API. Avisar se algo mudou. | M |
| S3.8 | Sidebar de secoes no mobile (loja publica) | `components/loja/store-album-view.tsx` | Adicionar botao flutuante "Secoes" ou drawer lateral para navegacao rapida em albums grandes. | M |
| S3.9 | Skip link para conteudo principal | `components/painel/painel-shell.tsx` | Adicionar `<a href="#main-content" className="sr-only focus:not-sr-only">` + `id="main-content"` no main. | PP |
| S3.10 | Bulk inventory bypassa limites de plano | `app/api/inventory/bulk/route.ts` | Adicionar `checkStickerLimit()` antes da transacao. Checar total existente + novo contra limite. | P |
| S3.11 | h1 da loja publica com text-sm (subtamanho) | `components/loja/store-album-view.tsx` | Trocar para `text-base sm:text-lg font-bold` para titulo principal da pagina publica. | PP |
| S3.12 | Breadcrumb nao traduz slugs | `components/painel/painel-shell.tsx:178-183` | Mapear slugs conhecidos para nomes humanos. Para albums, buscar nome do album pelo slug. | P |
| S3.13 | /albuns como ilha sem link de entrada | `app/albuns/page.tsx` | Adicionar link na landing page (footer ou secao "13 Copas") e no footer da loja publica. | PP |
| S3.14 | /teste exposta em producao | `app/teste/page.tsx` | Proteger com check de NODE_ENV ou mover para rota protegida. | PP |
| S3.15 | Onboarding step 1 read-only sem utilidade | `app/onboarding/page.tsx:172-222` | Tornar editavel (permitir corrigir nome/slug) ou eliminar o step, indo direto de boas-vindas para selecao de album. | P |
| S3.16 | Padronizar padding do painel | Todas as paginas /painel/* | Adotar `p-4 sm:p-6 lg:p-8` como padrao. Corrigir estoque (falta sm:) e planos (px-6 py-10 unico). | PP |
| S3.17 | Heading hierarquia inconsistente | `components/loja/store-album-view.tsx` | Corrigir: h1 (album) -> h2 (secao) -> conteudo. Remover h3 sem h2 intermediario. | PP |
| S3.18 | font-weight inconsistente nos h1 do painel | `app/painel/page.tsx`, `app/painel/estoque/page.tsx`, etc. | Padronizar: font-bold OU font-black em todos os h1. Escolher um. | PP |

**Total Sprint 3: ~18 itens, ~1-2 semanas.**

---

### Backlog (Nice-to-have, baixa prioridade)

| # | Problema | Arquivo(s) | Notas |
|---|---------|-----------|-------|
| BL.1 | Remover diretorios vazios (/orcamento, /(marketing)) | `app/loja/[slug]/orcamento/`, `app/(marketing)/` | Limpeza de estrutura |
| BL.2 | Tela de Conta/Perfil (editar email, senha) | Novo: `app/painel/conta/page.tsx` | Feature nova |
| BL.3 | Link cruzado Estoque <-> Precos por album | `app/painel/estoque/[albumSlug]`, `app/painel/precos/[albumSlug]` | Navegacao cruzada |
| BL.4 | Renomear "Loja" na sidebar para "Minha Vitrine" | `components/painel/painel-shell.tsx` | Reduzir ambiguidade |
| BL.5 | Telefone com mascara de input | `app/(auth)/registro/page.tsx`, `components/painel/loja-editor.tsx` | Validacao de formato |
| BL.6 | Fetch wrapper com retry + timeout | Global | Resiliencia de rede |
| BL.7 | Repensar auto-redirect na loja publica | `app/loja/[slug]/page.tsx:26-28` | Mostrar catalogo antes de redirecionar |
| BL.8 | Unificar headers das paginas publicas | `app/page.tsx`, `app/albuns/page.tsx`, etc. | Componente nav compartilhado |
| BL.9 | CopyLinkButton com try/catch no clipboard | `components/painel/copy-link-button.tsx`, `components/painel/album-stats-card.tsx` | Fallback visual |
| BL.10 | Usar `<Image>` em vez de `<img>` no estoque | `app/painel/estoque/page.tsx:98` | Otimizacao Next.js |
| BL.11 | color-scheme meta tag | `app/layout.tsx` | Dark mode nativo do browser |
| BL.12 | Textos sem acento na landing e 404 | `app/page.tsx`, `app/not-found.tsx` | Acessibilidade TTS |
| BL.13 | PasswordStrength vs minLength inconsistentes | `components/auth/auth-password-strength.tsx`, `app/(auth)/registro/page.tsx` | "Fraca" aceita, confunde |
| BL.14 | Onboarding: saves sequenciais -> Promise.all | `app/onboarding/page.tsx:343-353` | Performance em rede lenta |
| BL.15 | Sticker toggle zera quantidade > 1 com 1 toque | `components/painel/inventory-manager.tsx` | Toggle so 0<->1, qty > 1 exige input |
| BL.16 | Preco salva no blur com valor parcial | `components/painel/precos-global-editor.tsx` | Debounce + validacao antes do save |
| BL.17 | Variante `warning` para toast | `lib/toast-context.tsx` | Diferenciar de error |
| BL.18 | aria-pressed nos botoes de figurinha (loja) | `components/loja/store-album-view.tsx:593-597` | Estado de carrinho acessivel |
| BL.19 | role="meter" na barra de forca de senha | `components/auth/auth-password-strength.tsx` | WCAG 1.4.1 |
| BL.20 | Planos: desabilitar todos os botoes quando 1 carregando | `app/painel/planos/page.tsx` | Prevenir cliques simultaneos |

---

## D) Padroes Recorrentes

Problemas sistemicos que aparecem em multiplos lugares do codebase:

### 1. Silent Failures (Falhas Silenciosas)
**Onde:** precos-global-editor, precos-album-editor, onboarding step 3, checkout, CopyLinkButton
**Padrao:** fetch() sem try/catch, erro nao comunicado ao usuario. O app finge que deu certo.
**Causa raiz:** Ausencia de wrapper de fetch com error handling padrao.
**Fix sistemico:** Criar `lib/api-client.ts` com fetch wrapper que lanca excepcao em respostas nao-200, inclui timeout, e retorna erro tipado.

### 2. Acoes Destrutivas Sem Confirmacao
**Onde:** Zerar secao, Marcar todas, Logout, Toggle de quantidade, Deletar album
**Padrao:** operacoes irreversiveis executam em 1 clique sem ConfirmDialog ou undo.
**Causa raiz:** ConfirmDialog existe (`components/ui/confirm-dialog.tsx`) mas e sub-utilizado (usado apenas em cancelar pedido e deletar regra de preco).
**Fix sistemico:** Auditoria de todas as acoes destrutivas, adicionar ConfirmDialog onde `consequence > 1 item afetado`.

### 3. Inconsistencia de Design Tokens
**Onde:** backgrounds de card (3+ hex distintos), bordas (3 padroes), inputs (2 sistemas), modais (3 estilos), botoes primarios (4+ implementacoes)
**Padrao:** componentes mais antigos usam Tailwind classes hardcoded; mais recentes usam CSS variables.
**Causa raiz:** evolucao organica sem padrao de design system enforced.
**Fix sistemico:** Declarar tokens adicionais (`--bg-input`, `--border-input`, `--bg-modal`), criar componentes base (Input, Modal, Button) e migrar progressivamente.

### 4. Touch Targets Insuficientes
**Onde:** botoes +/- no inventario (36x32px), +/- no carrinho (32x32px), logout (28x28px), fechar carrinho (32x32px), limpar busca (~24px)
**Padrao:** botoes de acao secundaria ficam abaixo de 44px.
**Causa raiz:** design desktop-first nesses componentes especificos.
**Fix sistemico:** Criar classe utilitaria `.touch-target { min-height: 44px; min-width: 44px; }` e aplicar em todos os botoes interativos.

### 5. Ausencia de Feedback de Sucesso em Operacoes
**Onde:** PriceModal fecha sem feedback, Novo album redireciona silenciosamente, Login redireciona sem confirmacao, Onboarding avanca sem confirmacao visual
**Padrao:** operacao completa sem feedback explicito de sucesso.
**Causa raiz:** o redirect ou fechamento do modal e interpretado como "sucesso implicito", mas nem sempre.
**Fix sistemico:** Padrao: toda operacao de save/create deve ter feedback explicito (`toast.success` ou animacao) antes de navegar/fechar.

### 6. Dados Confiados do Client
**Onde:** Order API (precos), status de pedido (sem validacao de transicao), bulk inventory (bypassa limites)
**Padrao:** server aceita dados do client sem revalidacao server-side.
**Causa raiz:** foco inicial em velocidade de desenvolvimento, validacao deixada para depois.
**Fix sistemico:** Auditar todos os endpoints POST/PATCH. Server DEVE recalcular/revalidar dados criticos (precos, quantidades, transicoes de estado).

---

## E) Metricas de Saude

### Score Geral UX Estimado: **52/100**

| Area | Score | Justificativa |
|------|:---:|---|
| **Acessibilidade (WCAG)** | 45/100 | maximumScale:1, modais sem focus trap, cor como unico indicador, contraste insuficiente em muted text, multiplos inputs sem label |
| **Consistencia Visual** | 50/100 | Tokens CSS existem mas adocao desigual: 3+ backgrounds, 4+ botoes primarios, 3 estilos de modal, 2 sistemas de input |
| **Feedback ao Usuario** | 45/100 | Silent failures em saves criticos (precos, checkout), acoes destrutivas sem confirmacao, mock de email que engana o usuario |
| **Fluxos Criticos** | 55/100 | Registro -> onboarding -> painel funciona bem. Checkout tem risco de perda de dados. Gerenciamento de estoque e eficiente mas fragil (sem rollback) |
| **Hierarquia Visual** | 65/100 | Sistema de cor amber coeso, tipografia com 3 niveis claros, cards bem proporcionados. Problemas pontuais de font-weight e tamanho minimo |
| **Informacao / Navegacao** | 55/100 | Mapa de rotas logico, findability boa (2-3 cliques), mas /albuns orfa, Planos inacessivel no mobile, breadcrumb nao traduz slugs |

### Distribuicao dos Achados

| Severidade | Quantidade |
|-----------|:---:|
| CRITICO | 12 |
| ALTO | 18 |
| MEDIO | 22 |
| BAIXO | 15 |
| **Total achados unicos** | **67** |

### Componentes Mais Problematicos

| Componente | Achados | Mais grave |
|-----------|:---:|---|
| `components/loja/store-album-view.tsx` | 14 | Checkout fire-and-forget, touch targets, modais sem a11y |
| `components/painel/inventory-manager.tsx` | 10 | Acoes destrutivas sem confirm, optimistic sem rollback, touch targets |
| `app/onboarding/page.tsx` | 7 | Step read-only inutil, precos inconsistentes, saves parciais |
| `components/painel/painel-shell.tsx` | 6 | Planos excluido do mobile, logout sem confirm, tooltips touch |
| `app/painel/planos/page.tsx` | 4 | alert() nativo, loading state ausente |

---

## F) Recomendacoes Arquiteturais

### 1. Criar API Client Padrao (`lib/api-client.ts`)
**Impacto:** Resolve silent failures, retry, timeout, e error handling em todo o app de uma vez.
Wrapper de fetch com: tipagem generica, throw em respostas nao-200, AbortController timeout (10s), toast.error automatico no catch, retry com backoff (max 3). Todos os componentes client migram de `fetch()` direto para `apiClient.post/get/patch()`.

### 2. Extrair Design System em Componentes Base
**Impacto:** Resolve inconsistencia de tokens, inputs, modais e botoes.
Criar: `components/ui/modal.tsx` (unico estilo, focus trap, Escape), `components/ui/panel-input.tsx` (padrao painel), `components/ui/action-button.tsx` (primario/ghost/danger padronizado). Migrar progressivamente, comecando pelos mais usados.

### 3. Centralizar Protecao de Rotas
**Impacto:** Resolve tela branca sem sessao em todas as paginas do painel.
Implementar verificacao de sessao no `app/painel/layout.tsx` com redirect para /login. Elimina a necessidade de check individual em cada page.tsx.

### 4. Validacao Server-Side Rigorosa
**Impacto:** Resolve manipulacao de precos, bypass de limites, transicoes invalidas.
Criar `lib/validators/` com: `validateOrderPrices()` (recalcula precos), `validateStatusTransition()` (maquina de estados), `validatePlanLimits()` (checa limites em todas as rotas de inventario).

### 5. Sistema de Notificacoes por Email (Resend)
**Impacto:** Resolve reset de senha que nao envia email, verificacao fake, e habilita notificacoes de novos pedidos/mudanca de status.
Integrar Resend SDK uma vez em `lib/email.ts` com templates para: reset de senha, verificacao de email, novo pedido, status atualizado. Reutilizado em todas as rotas relevantes.

---

*Fim do relatorio consolidado. 67 achados unicos, 12 criticos, distribuidos em 4 sprints sugeridos. Infraestrutura para correcao da maioria ja existe no codebase.*
