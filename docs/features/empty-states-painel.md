# Empty states do painel — pedidos vazio + álbum sem estoque

> Plano elaborado via `/plan` em 2026-04-26. Aguarda aprovação explícita antes de execução.

## Objetivo

Trocar dois "becos sem saída" do painel por CTAs operáveis que destravem a primeira semana de uso do lojista:

- **`/painel/pedidos` com 0 pedidos** vira kit de divulgação operável (link da vitrine + QR code + 3 templates de mensagem WhatsApp)
- **Card de álbum com 0 figurinhas em `/painel/estoque`** troca o "0/X · 0%" morto por CTA "Adicionar estoque →"

## Critérios de aceitação

### Tela 1 — `/painel/pedidos` empty state

1. Quando `filtered.length === 0` E `filter === "all"`, renderiza `<EmptyOrdersKit shopUrl={...} />` no lugar do bloco atual ("Nenhum pedido ainda…")
2. EmptyOrdersKit mostra:
   - URL completa da vitrine (`https://album-digital-ashen.vercel.app/loja/<shopSlug>`) em font mono + botão **Copiar link** (clipboard API)
   - QR code SVG da URL (160×160 desktop, 120×120 mobile) com botão **Baixar PNG**
   - 3 cards de template WhatsApp empilhados verticalmente, cada um com texto preview + botão **Copiar mensagem**. Templates: (a) grupo de colecionadores, (b) cliente antigo individual, (c) caption Instagram Stories
3. Quando `filter !== "all"` e filtered está vazio, mantém empty state atual minimalista ("Nenhum pedido com esse status") — não polui filtros vazios com kit de divulgação
4. Toast de sucesso ao copiar link/template (via `useToast` existente)
5. Mobile: blocos empilham, QR reduz, botões touch ≥44px

### Tela 2 — card de álbum com `inStock === 0` em `/painel/estoque`

6. Em `estoque/page.tsx`, quando `inStock === 0`, a região inferior do card (linhas 178-210, "barra de progresso") é substituída por:
   - Texto pequeno "Sem estoque ainda" (zinc-500) + ícone seta-direita + texto "Adicionar →" (âmbar)
7. Card continua sendo um único `<Link>` para `/painel/estoque/${slug}` — não introduz hover-state nested
8. Quando `inStock > 0`, comportamento atual preservado integralmente (barra de progresso + %)

## Invariantes de domínio afetados

Nenhum. Mudança puramente UI. Não toca:

- Lógica de Order/OrderItem
- Cálculo de preços (`price-resolver.ts`)
- Schema Prisma
- Sessão/auth (apenas leitura de `seller.shopSlug`)

## Edge cases

1. **Seller sem `shopSlug` definido** (raro pós-onboarding): renderizar kit com aviso "Configure o slug em /painel/loja" e desabilitar copy/QR. Confirmar via Read de `auth.ts`+schema se shopSlug é nullable. Hipótese: é `not null` após onboarding.
2. **Lojista com pedidos cancelados em todos os filtros**: `filter === "all"` mostra `orders.length` total (inclui cancelados → kit não aparece). Comportamento correto: quem já recebeu pedido (mesmo cancelado) não precisa mais de kit. Confirmar se intencional.
3. **Clipboard API indisponível** (browser antigo / contexto inseguro): `navigator.clipboard?.writeText` com fallback `document.execCommand("copy")` ou aviso "Copie manualmente: <texto>"
4. **Acessibilidade do QR**: `<svg role="img">` + `aria-label="QR code para <URL>"` + URL textual visível ao lado

## Arquivos impactados

**Criar:**

| Arquivo | Tipo | Função |
|---|---|---|
| `src/lib/share-templates.ts` | Server-safe puro | `whatsappGroupTemplate(url)`, `whatsappOldClientTemplate(url)`, `instagramStoriesCaption(url)` |
| `src/lib/share-templates.test.ts` | Vitest node | TDD: 3 funções × asserts (URL substituída, sem emoji, PT-BR, length razoável) |
| `src/components/painel/pedidos/empty-orders-kit.tsx` | Client | UI do kit (link+copy, QR, 3 templates) |
| `src/app/painel/pedidos/pedidos-client.tsx` | Client | Conteúdo atual de page.tsx, recebe `shopUrl: string` como prop |

**Modificar:**

| Arquivo | Mudança |
|---|---|
| `src/app/painel/pedidos/page.tsx` | Vira Server Component shell (~10 linhas): `getSession()` → monta `shopUrl` → renderiza `<PedidosClient shopUrl={shopUrl} />` |
| `src/app/painel/estoque/page.tsx` | Branch JSX condicional quando `inStock === 0` no card (linhas ~178-210) |
| `package.json` + `package-lock.json` | Adiciona `react-qr-code` (~3KB, sem deps suspeitas) |

**Não modificar:**

- API `/api/orders`
- Estilos globais
- Outros componentes do painel
- Schema Prisma

## Risco

**Baixo, contido a 2 telas.**

- **Refactor pedidos/page.tsx Server↔Client split**: risco de regressão de comportamento. Mitigação: pedidos-client.tsx é cópia 1:1 do conteúdo atual + recebe prop. Validar via Playwright: (a) lista com pedidos renderiza igual, (b) busca/filtros funcionam, (c) cancelamento abre dialog. **Não há teste de integração existente** → dependo de Playwright manual.
- **Adição de `react-qr-code`**: lib estável (>500k downloads/semana), ~3KB, MIT, sem deps suspeitas. Confirmar via Context7 antes de instalar. Alternativa zero-dep (SVG próprio) seria overkill.
- **Card de álbum vazio**: branch isolado, sem regressão possível em álbuns com `inStock > 0`.
- **Cobertura de testes existente nos arquivos editados**: zero. Único gate além de tsc/build é Playwright manual + suite nova de share-templates.

## Plano de execução

### Pre-flight

- [ ] `npm install` no worktree (verificar `.env.local` presente, ver `reference_worktree_setup_gotchas.md`)
- [ ] `npm run build` baseline verde
- [ ] `npm run test` baseline verde
- [ ] Context7: `react-qr-code` — confirmar API atual (export default, props, server-safe?)
- [ ] Read `src/lib/auth.ts` + `schema.prisma` → confirmar `Seller.shopSlug` é not null pós-onboarding

### Commit 1 — `feat(pedidos): kit de divulgacao no empty state`

1. **RED**: criar `src/lib/share-templates.test.ts` com 3 testes (assertam funções inexistentes → fail)
2. **GREEN**: criar `src/lib/share-templates.ts` minimal pra passar
3. `npm install react-qr-code`
4. Criar `src/components/painel/pedidos/empty-orders-kit.tsx`
5. Criar `src/app/painel/pedidos/pedidos-client.tsx` (cópia 1:1 do `page.tsx` atual + prop `shopUrl: string`)
6. Reescrever `src/app/painel/pedidos/page.tsx` como Server Component shell
7. Substituir empty state atual por `<EmptyOrdersKit shopUrl={shopUrl} />` em `pedidos-client.tsx` quando `filter === "all"`
8. **Gate**: `npm run lint && npm run test && npx tsc --noEmit && npm run build`
9. **Playwright**: dev server em :3009, `/painel/pedidos` com seller sem pedidos → screenshot do kit + click copiar link + verificar toast
10. `git add` específico → commit → push → `vercel deploy --prod`

### Commit 2 — `feat(estoque): cta "adicionar estoque" em cards de album vazio`

1. Modificar `src/app/painel/estoque/page.tsx` linhas ~178-210: branch condicional `inStock === 0`
2. Sem teste novo (mudança Server Component JSX condicional)
3. **Gate**: `npm run lint && npm run test && npx tsc --noEmit && npm run build`
4. **Playwright**: `/painel/estoque` → confirmar 1+ card com `inStock === 0` mostra CTA E 1+ card com `inStock > 0` mantém barra (regressão)
5. `git add` específico → commit → push → `vercel deploy --prod`

## Pre-plan checklist (rodado)

| # | Item | Status |
|---|---|---|
| 1 | Cria função/método novo? → plano lista teste ANTES da implementação | PASSA — RED→GREEN explícito em share-templates |
| 2 | Bug fix? → plano lista teste de regressão ANTES do fix | N/A — feature de UI, não bug |
| 3 | Função extraível de UI/handler ficaria mais testável isolada? | PASSA — share-templates extraído de inline |
| 4 | Mudanças são da mesma unidade funcional? Senão, 2+ commits | PASSA — 2 telas distintas → 2 commits |
| 5 | Cada commit é revertível isoladamente sem quebrar build? | PASSA — auto-contidos |
| 6 | Plano lista o gate explícito antes de cada commit? | PASSA — lint+test+tsc+build |
| 7 | Mensagens de commit no imperativo, em PT-BR, sem WIP/fix stuff/emoji? | PASSA |
| 8 | Consultei `memory/` deste projeto antes do plano? | PASSA — `feedback_pre_plan_checklist.md` lido |

## Pendências bloqueantes pré-execução

Aguardo confirmação do humano em:

- (a) Plano OK?
- (b) Alguma das 3 funcionalidades do kit (link / QR / templates) está fora de escopo?
- (c) Templates de WhatsApp: rascunho proposto abaixo, ou você prefere ditar copy?
- (d) URL base da vitrine é `https://album-digital-ashen.vercel.app/loja/<slug>` (vi no CLAUDE.md) ou tem custom domain configurado?

### Rascunho dos 3 templates WhatsApp (em PT-BR, sem emoji)

**(a) Grupo de colecionadores**

> Pessoal, montei uma loja online com meu estoque de figurinhas. Tem o que falta no álbum de vocês?
>
> {shopUrl}
>
> Pedido fica reservado por 30 minutos. Pagamento via WhatsApp.

**(b) Cliente antigo individual**

> Oi, montei uma vitrine online com tudo que tenho disponível. Confere se tem as suas:
>
> {shopUrl}
>
> Qualquer dúvida, é só responder aqui.

**(c) Caption Instagram Stories**

> Loja online no ar. Filtra o que falta no seu álbum e pede direto:
>
> {shopUrl}
