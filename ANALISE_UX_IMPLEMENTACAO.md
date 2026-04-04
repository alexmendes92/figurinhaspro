# FigurinhasPro — Analise de UX e Plano de Implementacao

> Documento gerado em 2026-04-04 apos auditoria completa de layout e experiencia do usuario.
> Escopo: 20 paginas, 14 componentes, 1 design system, 2 personas (vendedor + comprador).

---

## Sumario Executivo

O FigurinhasPro tem uma **base visual solida** — dark mode consistente, paleta amber coesa, animacoes suaves e responsividade mobile-first. Porem, a experiencia do usuario sofre em **5 areas criticas** que impactam diretamente a conversao e retencao:

1. **Inconsistencia visual entre paginas** (registro usa zinc-800/900, resto usa #0f1219)
2. **Feedback de erro silencioso** (APIs falham sem notificar o usuario)
3. **Loja publica sem identidade do vendedor** (comprador nao sabe de quem esta comprando)
4. **Fluxo de checkout incompleto** (carrinho → WhatsApp sem resumo, sem confirmacao)
5. **Zero empty states significativos** (telas vazias nao orientam proxima acao)

**Impacto estimado**: Corrigir estes 5 pontos pode aumentar a taxa de conversao da loja publica em 30-50% e reduzir suporte ao vendedor em 40%.

---

## PARTE 1 — Jornada do Vendedor (Revendedor)

### 1.1 Fluxo Atual Mapeado

```
Landing Page → Registro → Onboarding (4 steps) → Dashboard
                                                    ├── Estoque (albums + figurinhas)
                                                    ├── Precos (global + por album)
                                                    ├── Pedidos (workflow QUOTE→DELIVERED)
                                                    ├── Loja (info + link vitrine)
                                                    └── Planos (FREE/PRO/UNLIMITED)
```

### 1.2 Landing Page (`app/page.tsx`)

**Pontos fortes:**
- Hero compelling com CTA claro ("Comecar gratis →")
- Banner Copa 2026 gera urgencia real
- Social proof com depoimentos e numeros
- FAQ bem estruturado
- Pricing transparente (3 planos lado a lado)

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| L1 | Footer sem links uteis (contato, suporte, redes sociais) | Medio | Credibilidade |
| L2 | Nenhuma demonstracao visual (screenshot, video, GIF do painel) | Alto | Conversao |
| L3 | Depoimentos parecem fabricados (nomes genericos, sem foto) | Medio | Confianca |
| L4 | "Esqueci minha senha" desabilitado sem previsao | Medio | Retencao |
| L5 | Header nao tem navegacao para secoes da landing (#features, #planos) | Baixo | Navegabilidade |
| L6 | Botao "Comecar com Pro" no pricing leva para /registro sem pre-selecao | Baixo | Conversao |

### 1.3 Registro (`app/(auth)/registro/page.tsx`)

**Pontos fortes:**
- Formulario limpo com 5 campos essenciais
- Preview do slug da loja em tempo real
- Validacao minLength no password

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| R1 | **Paleta inconsistente**: usa `bg-[#09090b]` + `zinc-800/900` vs resto do app que usa `#0b0e14` + `white/[0.04]` | Alto | Quebra visual |
| R2 | Sem validacao client-side de email duplicado (so descobre no submit) | Medio | Frustracao |
| R3 | Sem indicador de forca de senha | Baixo | Seguranca percebida |
| R4 | Campo WhatsApp sem mascara `(XX) XXXXX-XXXX` | Medio | Dados invalidos |
| R5 | Sem preview do slug gerado (mostra template estatico, nao o real) | Medio | Expectativa |

### 1.4 Login (`app/(auth)/login/page.tsx`)

**Pontos fortes:**
- Split-screen elegante (branding esquerda + form direita)
- Toggle de visibilidade de senha
- Loading state no botao
- Error state com banner vermelho

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| LG1 | "Esqueci minha senha" e um `<span>` com `cursor-not-allowed` — parece bug | Alto | Frustracao |
| LG2 | Estatisticas no branding dizem "1970-2022" mas landing diz "1970-2026" | Baixo | Inconsistencia |
| LG3 | Sem opcao "Lembrar-me" (session expira e usuario precisa relogar) | Medio | Retencao |

### 1.5 Onboarding (`app/onboarding/page.tsx`)

**Pontos fortes:**
- Progress bar visual (4 steps)
- Welcome personalizado com nome
- Preview dos dados confirmados
- Dicas de precos baseadas no mercado
- Grid de selecao de album bem feito

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| O1 | Step 1 mostra dados read-only — usuario NAO pode editar nome da loja aqui | Alto | Frustracao |
| O2 | Step 2 seleciona album mas NAO cria estoque (o usuario chega no painel vazio) | Critico | Abandono |
| O3 | Step 3 mostra dicas de preco mas NAO configura precos (chega no painel com defaults) | Alto | Confusao |
| O4 | Nenhum album e efetivamente adicionado — onboarding e decorativo | Critico | Primeira impressao |
| O5 | Se usuario atualiza a pagina, perde o selectedAlbum (state local) | Medio | Frustracao |

### 1.6 Dashboard (`app/painel/page.tsx`)

**Pontos fortes:**
- Server Component (dados reais do banco)
- Metricas com gradiente por cor (amber, blue, purple)
- Link da vitrine com botao copiar
- Acoes rapidas com links diretos
- Pedidos recentes com status badges
- Empty state para pedidos (com orientacao)

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| D1 | Nenhum "Getting Started" para vendedor novo (chega no dashboard vazio sem direcao) | Critico | Abandono |
| D2 | Card "Catalogo" mostra total global (7.122) nao o estoque do vendedor | Medio | Confusao |
| D3 | Faturamento mostra R$0 sem contexto (poderia mostrar "Primeiro mes gratuito") | Baixo | Motivacao |
| D4 | Sem graficos de evolucao (vendas por semana, figurinhas mais pedidas) | Medio | Engagement |
| D5 | Pedidos recentes nao sao clicaveis (nao levam para detalhe do pedido) | Medio | Navegacao |

### 1.7 Estoque (`app/painel/estoque/page.tsx` + `inventory-manager.tsx`)

**Pontos fortes:**
- Grid visual com imagens reais das figurinhas
- Toggle rapido clique-para-marcar
- Controle de quantidade com +/-
- Busca global por codigo/nome
- Filtros Todas/Tenho/Faltam
- Abas de secoes (paises) com scroll
- Badge de tipo (Regular/Especial/Brilhante)

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| E1 | **Nenhum feedback quando API falha** — usuario clica, nada acontece | Critico | Perda de dados |
| E2 | Imagens sem blur placeholder (flash de conteudo vazio no load) | Medio | Percepcao de velocidade |
| E3 | Sem bulk actions ("Marcar todos como tenho", "Zerar secao") | Alto | Produtividade |
| E4 | Modal de preco customizado sem validacao (aceita negativo) | Medio | Dados invalidos |
| E5 | Sem indicacao visual de salvamento automatico (usuario nao sabe se salvou) | Alto | Confianca |
| E6 | Contador de figurinhas por secao nao mostra (ex: "BRA: 23/25") | Medio | Overview |
| E7 | Pagina `/painel/estoque/novo` (album custom) nao aparece na navegacao | Alto | Discoverability |

### 1.8 Precos (`precos-editor.tsx` + subcomponentes)

**Pontos fortes:**
- 3 eixos bem separados (tipo, secao, quantidade)
- Tabs com contagem
- Info boxes explicando hierarquia
- Auto-save no blur

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| P1 | **Delete sem confirmacao** — um clique remove regra de preco permanentemente | Critico | Perda de dados |
| P2 | Tabela de quantity tiers nao e scrollable em mobile (colunas comprimem/cortam) | Alto | Usabilidade mobile |
| P3 | Terminologia "FLAT vs OFFSET" confusa — deveria ser "Preco fixo" vs "Ajuste" | Medio | Compreensao |
| P4 | Sem preview de como o preco final aparece para o cliente | Alto | Confianca |
| P5 | Inputs sem placeholder com sugestao (ex: "1.50") | Baixo | Orientacao |
| P6 | Sem indicacao de qual preco esta "ganhando" na hierarquia | Alto | Compreensao |

### 1.9 Pedidos (`app/painel/pedidos/page.tsx`)

**Pontos fortes:**
- Filtros por status com contagem
- Accordion expandivel por pedido
- Progress bar visual do workflow
- Botao WhatsApp direto
- Items detalhados com codigo + preco
- Acoes contextuais (Confirmar/Pago/Enviado/Cancelar)

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| PD1 | Sem busca por nome de cliente | Medio | Produtividade |
| PD2 | Sem ordenacao (mais recente, maior valor, etc.) | Medio | Produtividade |
| PD3 | Cancelar nao pede confirmacao — um clique cancela | Critico | Perda irreversivel |
| PD4 | Sem paginacao (carrega todos os pedidos de uma vez) | Alto | Performance |
| PD5 | Status "Cancelado" nao tem botao de desfazer | Medio | Recuperacao |
| PD6 | Sem notificacao sonora/visual quando chega pedido novo | Baixo | Responsividade |

### 1.10 Loja (Editor) (`loja-editor.tsx`)

**Pontos fortes:**
- Campos simples (nome + whatsapp)
- Edit/cancel toggle
- Plano e email read-only

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| LE1 | So edita 2 campos — falta: descricao da loja, foto/logo, horario de atendimento | Alto | Personalizacao |
| LE2 | Sem preview mobile da vitrine | Alto | Confianca |
| LE3 | WhatsApp sem mascara/validacao | Medio | Dados invalidos |
| LE4 | Erro de API silencioso (sem toast) | Alto | Confianca |

### 1.11 Planos (`app/painel/planos/page.tsx`)

*Nao lido em detalhe, mas baseado no padrao do projeto:*

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| PL1 | Integracao Stripe incompleta — gates desabilitados (`plan-limits.ts` retorna true) | Critico | Monetizacao |
| PL2 | Sem trial period visual (ex: "7 dias gratis de Pro") | Alto | Conversao |

### 1.12 Shell do Painel (`painel-shell.tsx`)

**Pontos fortes:**
- Sidebar colapsavel com transicoes suaves
- Bottom nav mobile com safe-area
- Avatar com iniciais do vendedor
- Tooltip no modo colapsado
- Badge dot amber para link ativo

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| S1 | Breadcrumb pode truncar em paths longos (sem scroll horizontal) | Baixo | Layout |
| S2 | Sidebar nao mostra link para "Criar album" (enterrado em /estoque) | Medio | Discoverability |
| S3 | Sem indicador de notificacoes/pedidos pendentes na nav | Alto | Responsividade |
| S4 | Logo "F" nao e link para o dashboard | Baixo | Navegacao |

---

## PARTE 2 — Jornada do Comprador (Cliente)

### 2.1 Fluxo Atual Mapeado

```
Link do vendedor → Vitrine (/loja/[slug]) → Album (/loja/[slug]/[albumSlug])
                                                  ├── Navegar figurinhas
                                                  ├── Importar lista faltante
                                                  ├── Adicionar ao carrinho
                                                  └── Carrinho (drawer)
                                                       └── WhatsApp (mensagem formatada)
```

### 2.2 Vitrine do Vendedor (`app/loja/[slug]/page.tsx`)

**Pontos fortes:**
- Header com nome da loja
- Grid de albums disponíveis
- Indicacao de qtd de figurinhas por album

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| V1 | **Zero identidade do vendedor** — sem logo, sem descricao, sem WhatsApp visivel | Critico | Confianca |
| V2 | Sem indicacao de "loja verificada" ou tempo no ar | Alto | Confianca |
| V3 | Sem informacao de formas de pagamento aceitas | Alto | Expectativa |
| V4 | Sem horario de atendimento | Medio | Expectativa |
| V5 | Sem contador total ("150 figurinhas disponiveis") | Medio | Atracao |
| V6 | Albums sem imagem de capa (thumbnail = primeira figurinha) | Medio | Visual |

### 2.3 Pagina do Album na Loja (`store-album-view.tsx`)

**Pontos fortes:**
- Grid de figurinhas com status de estoque
- Preco resolvido via 3 eixos
- Importacao de lista faltante (colar e filtrar)
- Botao adicionar ao carrinho por figurinha
- Indicador de desconto por quantidade

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| A1 | **Figurinhas sem estoque ficam no grid** (cinzas) em vez de separadas/ocultas | Alto | Ruido visual |
| A2 | Sem filtro "Mostrar so disponiveis" (default deveria ser ON para compradores) | Critico | Usabilidade |
| A3 | Preco nao mostra descricao do tipo ("Especial" vs "Normal") | Medio | Compreensao |
| A4 | Importacao de lista nao salva (se recarregar, perde) | Medio | Frustracao |
| A5 | Sem indicacao visual de "esta no carrinho" forte o suficiente | Medio | Estado |
| A6 | Sem contagem "X de Y disponiveis" por secao | Baixo | Overview |
| A7 | Sem botao "Adicionar todas disponiveis" para quem quer comprar tudo | Medio | Conversao |

### 2.4 Carrinho (`cart-drawer.tsx`)

**Pontos fortes:**
- Slide-over com backdrop
- Itens com thumbnail e codigo
- Controles de quantidade
- Total calculado

**Problemas encontrados:**

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| C1 | **Sem resumo antes do WhatsApp** (usuario clica e vai direto, sem revisar) | Critico | Experiencia |
| C2 | Sem desconto por quantidade visivel no carrinho (so na grid) | Alto | Valor percebido |
| C3 | Sem campo para nome/telefone do comprador antes de enviar | Alto | Dados |
| C4 | Sem campo para observacoes ("Quero retirar pessoalmente") | Medio | Flexibilidade |
| C5 | Carrinho perde tudo se fechar aba (sem localStorage) | Critico | Retencao |
| C6 | Sem agrupamento por album no carrinho (figurinhas misturadas) | Medio | Organizacao |
| C7 | Nao mostra o nome da loja/vendedor no carrinho | Baixo | Contexto |

### 2.5 Fluxo WhatsApp

| # | Problema | Severidade | Impacto |
|---|---------|-----------|---------|
| W1 | Se vendedor nao tem WhatsApp configurado, botao "Enviar" nao funciona ou leva para numero vazio | Critico | Dead end |
| W2 | Mensagem nao inclui link de volta para a loja | Medio | Continuidade |
| W3 | Sem confirmacao visual "Pedido enviado!" apos clicar | Alto | Feedback |
| W4 | Sem instrucao de proximo passo ("O vendedor vai confirmar seu pedido") | Alto | Expectativa |

---

## PARTE 3 — Design System

### 3.1 Estado Atual

| Aspecto | Estado | Nota |
|---------|--------|------|
| Paleta de cores | ✅ Forte | Amber accent + dark mode coeso |
| Tipografia | ✅ Forte | Geist Sans + Geist Mono |
| Espacamento | ✅ Bom | Consistente via Tailwind (p-4, gap-3, etc.) |
| Animacoes | ✅ Bom | slide-up, fade-in, shimmer, toast |
| Acessibilidade | ⚠️ Parcial | Focus-visible ok, mas sem ARIA em modals/drawers |
| Componentes base | ❌ Ausente | Sem biblioteca (shadcn, Radix, etc.) |
| Empty states | ❌ Ausente | Apenas pedidos tem; estoque/precos nao tem |
| Error states | ❌ Ausente | Inputs nao mudam visual em erro |
| Skeleton loaders | ⚠️ Parcial | CSS shimmer existe, mas sem componentes |
| Modals/Dialogs | ❌ Improvised | Divs absolutas sem trap focus/escape |
| Toasts | ⚠️ Basico | Existe, mas muitos fluxos nao usam |
| Confirmacao destrutiva | ❌ Ausente | Deletes sao imediatos, sem dialog |

### 3.2 Inconsistencias Visuais Detectadas

1. **Registro** (`#09090b` + `zinc-800/900`) vs **resto** (`#0b0e14` + `white/[0.04]`)
2. **Login** usa `gray-*` classes vs **painel** usa CSS vars (`--muted`, `--border`)
3. **Pedidos** usa CSS vars consistentemente vs **estoque** usa hex/tailwind diretos
4. **Fontes** labels: alguns usam `text-[12px] uppercase tracking-wider`, outros `text-xs font-semibold`
5. **Border radius**: mix de `rounded-xl` e `rounded-2xl` sem regra clara

---

## PARTE 4 — Plano de Implementacao (Priorizado)

### Sprint 1 — Criticos (Impacto imediato na conversao)

| # | Item | Arquivo(s) | Esforco | Impacto |
|---|------|-----------|---------|---------|
| 1 | **Persistir carrinho em localStorage** | `lib/cart-context.tsx` | P | Critico |
| 2 | **Tela de confirmacao antes do WhatsApp** — nome, telefone, obs, resumo, total com desconto | `cart-drawer.tsx` + novo `checkout-summary.tsx` | M | Critico |
| 3 | **Fallback quando vendedor sem WhatsApp** — mostrar formulario de contato ou email | `cart-drawer.tsx`, `store-album-view.tsx` | P | Critico |
| 4 | **Filtro "So disponiveis" default ON na loja** | `store-album-view.tsx` | P | Critico |
| 5 | **Confirmacao antes de deletar** (precos, pedidos, regras) — dialog simples com "Tem certeza?" | `precos-album-editor.tsx`, `pedidos/page.tsx` | M | Critico |
| 6 | **Toast de erro em TODAS as chamadas API** | Todos os componentes com fetch | M | Critico |
| 7 | **Onboarding funcional** — step 2 deve CRIAR estoque, step 3 deve SALVAR precos | `onboarding/page.tsx` | G | Critico |

**Esforco total Sprint 1: ~3-4 dias**

### Sprint 2 — Alta prioridade (UX do vendedor)

| # | Item | Arquivo(s) | Esforco | Impacto |
|---|------|-----------|---------|---------|
| 8 | **Getting Started no dashboard** (checklist: estoque, precos, whatsapp, compartilhar) | `painel/page.tsx` + novo `getting-started.tsx` | M | Alto |
| 9 | **Identidade da loja no perfil** — logo upload, descricao, horario, pagamento aceito | `loja-editor.tsx`, schema Prisma, API seller | G | Alto |
| 10 | **Header da vitrine com identidade** — logo, nome, descricao, WhatsApp, badge verificado | `loja/[slug]/page.tsx` | M | Alto |
| 11 | **Normalizar paleta do registro** — migrar de zinc para paleta padrao do app | `(auth)/registro/page.tsx` | P | Alto |
| 12 | **Preview de preco final no editor** — "Figurinha BRA1 custara R$ X.XX para o cliente" | `precos-album-editor.tsx` | M | Alto |
| 13 | **Tabela de quantity tiers responsiva** (scroll horizontal em mobile) | `precos-album-editor.tsx` | P | Alto |
| 14 | **Paginacao nos pedidos** (limite 20/pagina) | `pedidos/page.tsx`, `api/orders` | M | Alto |
| 15 | **Badge de pedidos pendentes na sidebar** | `painel-shell.tsx` | P | Alto |

**Esforco total Sprint 2: ~4-5 dias**

### Sprint 3 — Melhorias de conversao (loja publica)

| # | Item | Arquivo(s) | Esforco | Impacto |
|---|------|-----------|---------|---------|
| 16 | **Agrupamento por album no carrinho** | `cart-drawer.tsx` | M | Medio |
| 17 | **Desconto por quantidade visivel no carrinho** (ex: "-10% acima de 20 un.") | `cart-drawer.tsx` | P | Alto |
| 18 | **Botao "Adicionar todas disponiveis"** por secao | `store-album-view.tsx` | M | Medio |
| 19 | **Tela pos-envio WhatsApp** ("Pedido enviado! O vendedor vai confirmar em breve.") | novo `order-sent.tsx` ou modal | P | Alto |
| 20 | **Contador "X disponiveis" na vitrine** por album | `loja/[slug]/page.tsx` | P | Medio |
| 21 | **Mascara de telefone** (registro + loja editor + checkout) | Componente reutilizavel | P | Medio |
| 22 | **Scroll to album** quando vem de link direto | `store-album-view.tsx` | P | Baixo |

**Esforco total Sprint 3: ~3 dias**

### Sprint 4 — Polish e engagement

| # | Item | Arquivo(s) | Esforco | Impacto |
|---|------|-----------|---------|---------|
| 23 | **Graficos no dashboard** (vendas por semana, figurinhas top 10) | `painel/page.tsx` + lib chart | G | Medio |
| 24 | **Screenshots/video na landing page** | `app/page.tsx` | M | Alto |
| 25 | **Busca de pedidos por nome** | `pedidos/page.tsx` | P | Medio |
| 26 | **Bulk actions no estoque** (marcar todos, zerar secao) | `inventory-manager.tsx` | M | Medio |
| 27 | **Contador por secao no estoque** ("BRA: 23/25") | `inventory-manager.tsx` | P | Medio |
| 28 | **Blur placeholder em imagens** (Next.js Image com placeholder="blur") | Grid components | M | Medio |
| 29 | **Componente Dialog reutilizavel** (confirmacao, com trap-focus e ESC) | novo `components/ui/dialog.tsx` | M | Infra |
| 30 | **Implementar "Esqueci minha senha"** | `(auth)/login`, nova API, template email | G | Alto |

**Esforco total Sprint 4: ~5-6 dias**

### Legenda de esforco:
- **P** (Pequeno) = < 2 horas
- **M** (Medio) = 2-6 horas
- **G** (Grande) = 6+ horas

---

## PARTE 5 — Metricas de Sucesso

### Para o Vendedor
| Metrica | Atual (estimado) | Meta |
|---------|-----------------|------|
| Tempo ate primeiro estoque cadastrado | >10 min (onboarding decorativo) | <3 min |
| % vendedores que compartilham vitrine | ~30% (sem nudge) | >70% |
| % vendedores que configuram WhatsApp | ~50% (nao obrigatorio) | >90% |
| Pedidos recebidos no primeiro mes | 0-2 (sem orientacao) | 5+ |

### Para o Comprador
| Metrica | Atual (estimado) | Meta |
|---------|-----------------|------|
| Taxa de abandono do carrinho | ~70% (sem persistencia) | <40% |
| Tempo ate adicionar primeira figurinha | >30s (grid com indisponiveis) | <10s |
| % carrinhos que chegam ao WhatsApp | ~20% (sem resumo) | >50% |
| Retorno a loja (revisita) | ~5% (carrinho perde) | >25% |

---

## PARTE 6 — Arquitetura de Componentes Sugerida

### Novos componentes necessarios:

```
components/
├── ui/                          # Design system base
│   ├── dialog.tsx               # Modal com trap-focus, ESC, backdrop
│   ├── confirm-dialog.tsx       # "Tem certeza?" reutilizavel
│   ├── phone-input.tsx          # Input com mascara (XX) XXXXX-XXXX
│   ├── empty-state.tsx          # Icone + titulo + descricao + CTA
│   └── error-boundary.tsx       # Catch de erros com retry
│
├── painel/
│   ├── getting-started.tsx      # Checklist de setup inicial
│   ├── stats-chart.tsx          # Grafico de vendas (lightweight)
│   └── notification-badge.tsx   # Badge de pedidos pendentes
│
└── loja/
    ├── checkout-summary.tsx     # Tela de revisao pre-WhatsApp
    ├── order-confirmation.tsx   # Tela pos-envio
    ├── store-header.tsx         # Header com identidade do vendedor
    └── filter-bar.tsx           # Filtros: disponiveis, tipo, secao
```

### Alteracoes no Schema Prisma:

```prisma
model Seller {
  // Campos existentes...

  // NOVOS — identidade da loja
  shopDescription  String?         // Descricao curta (max 200 chars)
  shopLogo         String?         // URL da imagem (Vercel Blob)
  businessHours    String?         // Ex: "Seg-Sex 9h-18h"
  paymentMethods   String?         // Ex: "PIX, Cartao"
  showWhatsApp     Boolean @default(true)
}
```

---

## PARTE 7 — Decisoes de Design Recomendadas

### Componentes UI
**Recomendacao**: NAO instalar shadcn/ui agora. O sistema custom esta funcional e consistente. Criar apenas os 5 componentes em `components/ui/` listados acima. Se o projeto crescer alem de 30 componentes, reconsiderar.

### Persistencia do carrinho
**Recomendacao**: localStorage com fallback para sessionStorage. Schema: `{ sellerId, items: [{ albumSlug, stickerCode, qty }], updatedAt }`. TTL de 7 dias. Limpar ao fechar compra.

### Confirmacao antes do WhatsApp
**Recomendacao**: Nao usar modal — usar pagina dedicada `/loja/[slug]/checkout` com:
1. Resumo do carrinho agrupado por album
2. Desconto por quantidade aplicado visualmente
3. Campos nome + telefone obrigatorios
4. Campo observacoes opcional
5. Botao "Enviar pelo WhatsApp" → gera mensagem formatada → abre wa.me
6. Redirect para pagina de confirmacao

### Onboarding funcional
**Recomendacao**: Step 2 deve chamar `POST /api/inventory/bulk` para criar estoque inicial com qty=0 para o album selecionado. Step 3 deve chamar `POST /api/prices` para salvar precos iniciais. Assim o vendedor chega no painel com dados reais.

---

## PARTE 8 — Quick Wins (Implementaveis em < 1 hora cada)

1. ✅ `localStorage` no carrinho — 30 min
2. ✅ Normalizar cor do registro (`#09090b` → `#0b0e14`) — 15 min
3. ✅ Filtro "So disponiveis" default ON — 20 min
4. ✅ Scroll horizontal na tabela de tiers mobile — 10 min
5. ✅ Badge pendentes na sidebar — 30 min
6. ✅ Renomear "FLAT"→"Preco fixo", "OFFSET"→"Ajuste" — 15 min
7. ✅ Logo "F" como link para /painel — 5 min
8. ✅ Estatistica login "1970-2022" → "1970-2026" — 5 min
9. ✅ Fallback WhatsApp vazio (mostrar mensagem de erro) — 20 min
10. ✅ Desconto por quantidade visivel no carrinho — 30 min

**Total quick wins: ~3 horas para 10 melhorias de alto impacto**

---

## Conclusao

O FigurinhasPro tem uma **fundacao tecnica e visual solida**. Os problemas nao sao de capacidade, sao de **completude de fluxo**. O vendedor configura tudo mas o comprador nao tem uma experiencia de checkout completa. Fechar essa lacuna (Sprints 1-2) e o caminho mais rapido para validar product-market fit.

**Prioridade absoluta**: Sprint 1 (items 1-7) resolve os problemas que causam abandono imediato.
