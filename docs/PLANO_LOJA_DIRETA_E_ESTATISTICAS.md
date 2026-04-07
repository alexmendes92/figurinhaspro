# FigurinhasPro — Plano Revisado: Loja Direta + Dashboard de Estatisticas

> Data: 04/04/2026 | Status: PROPOSTA | Escopo: loja publica + painel
> Objetivo: abrir a loja direto nas figurinhas sem perder contexto da loja e adicionar um dashboard confiavel de analise de albuns completos.

---

## 1. Resumo Executivo

Este plano substitui a proposta inicial por uma versao mais segura para a arquitetura atual do projeto.

As duas metas continuam as mesmas:

1. **Loja publica abrir direto no album**, eliminando o clique intermediario na capa.
2. **Dashboard de estatisticas** para medir cobertura, albuns completos e bloqueadores do proximo album.

Porem, a implementacao precisa corrigir 4 pontos que o plano anterior subestimava:

1. A rota `/loja/[slug]` hoje nao e so uma listagem de capas. Ela tambem carrega a **identidade da loja**.
2. O `StoreAlbumView` ja concentra carrinho, busca, importacao e checkout. Qualquer mudanca de navegacao ali precisa ser tratada com cuidado.
3. A logica de catalogo do seller ja esta **duplicada** em varias paginas. Adicionar mais uma copia vai piorar manutencao.
4. O dashboard pode crescer demais em payload se enviar listas completas de faltantes para todos os albuns de uma vez.

---

## 2. Premissas e Decisoes de Produto

### 2.1 Loja publica

- Ao acessar `/loja/[slug]`, o comprador deve cair direto no album mais relevante.
- A listagem de capas continua existindo em `/loja/[slug]?browse=true`.
- A rota do album deve continuar exibindo informacoes da loja:
  - nome da loja
  - descricao
  - horario
  - formas de pagamento
  - CTA de WhatsApp

### 2.2 Album padrao

O conceito de "primeiro album" precisa virar regra de negocio explicita.

**Regra recomendada**:

1. Album com maior quantidade de figurinhas disponiveis.
2. Em caso de empate, usar a ordenacao atual:
   - estaticos por ano decrescente
   - customizados no final

Isso evita abrir um album pouco relevante apenas por ordem de lista.

### 2.3 Definicao matematica de album completo

Para um album com `T` figurinhas e quantidades `q1, q2, ..., qT`:

```ts
completedAlbums = min(q1, q2, ..., qT)
```

Interpretacao:

- O seller possui `N` albuns completos se tiver pelo menos `N` unidades de **todas** as figurinhas do album.
- Os **bloqueadores do proximo album** sao as figurinhas cuja quantidade e igual a `completedAlbums`.

Exemplo:

- Se 669 figurinhas tem `qty >= 2`
- E 1 figurinha tem `qty = 1`
- Entao `completedAlbums = 1`
- E essa figurinha com `qty = 1` e bloqueadora do proximo album

### 2.4 Escopo de faltantes

O filtro "mostrar todos os faltantes vs apenas os bloqueadores" sai do escopo inicial.

Motivo:

- Com a definicao acima, a informacao mais valiosa para completar o proximo album sao os **bloqueadores**.
- Se precisarmos de uma segunda visao depois, ela deve ser outra regra clara, como por exemplo:
  - figurinhas com `qty = 0`
  - figurinhas abaixo de uma meta configuravel

---

## 3. Problemas Reais da Base Atual

### 3.1 A landing da loja nao pode sumir

A rota `/loja/[slug]` hoje faz mais do que listar albums. Ela tambem mostra a identidade do vendedor.

Se aplicarmos um `redirect()` puro sem extrair essa estrutura, o comprador perde:

- descricao da loja
- horario de atendimento
- metodos de pagamento
- CTA de WhatsApp

### 3.2 Navegacao atual quebraria semanticamente

O `StoreAlbumView` tem links que hoje assumem que `/loja/[slug]` e a tela de capas:

- botao de voltar no header
- CTA "Ver outros albuns" na confirmacao

Depois do redirect automatico, esses links passariam a redirecionar de volta para o album padrao, nao para a listagem de capas.

### 3.3 Secao inicial pode abrir vazia

Hoje o `StoreAlbumView` inicia com:

```ts
const [activeSection, setActiveSection] = useState(0)
```

Mas o menu esconde secoes sem estoque.

Resultado:

- o album pode ter estoque
- a primeira secao pode estar vazia
- o usuario abre a pagina e ve "nenhuma figurinha desta secao em estoque"

Isso precisa ser corrigido junto com a nova UX.

### 3.4 Catalogo do seller esta duplicado

A montagem de catalogo do seller com:

- albums estaticos
- albums customizados
- contagem por `albumSlug`
- ordenacao

ja aparece em:

- loja publica
- painel de estoque
- painel de precos

Adicionar mais uma implementacao para estatisticas aumentaria divergencia futura.

### 3.5 Payload do dashboard pode crescer demais

Se cada card receber a lista inteira de `missingForNext`, um seller com muitos albuns configurados vai enviar muito dado desnecessariamente na primeira renderizacao.

Precisamos limitar isso com:

- resumo server-side no card
- lista detalhada sob expansao

---

## 4. Arquitetura Recomendada

### 4.1 Novo helper server-side

Criar:

`lib/seller-albums.ts`

Responsabilidades:

- carregar seller por `shopSlug` ou `sellerId`
- carregar albums customizados
- juntar catalogo estatico + customizado
- calcular contagem por `albumSlug`
- ordenar albums
- devolver summaries minimos reutilizaveis

Estrutura sugerida:

```ts
export interface SellerAlbumSummary {
  slug: string
  title: string
  year: string
  flag: string
  host: string
  totalStickers: number
  inStockTypes: number
  isCustom: boolean
}
```

Funcoes sugeridas:

```ts
getSellerAlbumsCatalog(...)
getDefaultStoreAlbum(...)
getSellerConfiguredAlbums(...)
```

### 4.2 Novo shell compartilhado da loja publica

Criar:

`components/loja/public-store-shell.tsx`

Responsabilidades:

- header da loja
- identidade do vendedor
- bloco com descricao/horario/pagamento
- CTA de WhatsApp
- footer da loja

Beneficio:

- `/loja/[slug]` e `/loja/[slug]/[albumSlug]` passam a compartilhar a mesma identidade visual
- o redirect nao remove contexto da loja

### 4.3 Dashboard com calculo server-side e interacao client leve

Criar:

- `app/painel/estatisticas/page.tsx`
- `components/painel/album-stats-card.tsx`

Separacao:

- Server Component: calcula todos os agregados
- Client Component: apenas expande/colapsa, copia lista e anima interface

---

## 5. Plano de Implementacao

### Fase 1 — Fundacao compartilhada

**Objetivo**: reduzir duplicacao antes de adicionar novas telas.

#### 5.1 Criar helper de catalogo do seller

**Novo arquivo**

- `lib/seller-albums.ts`

**Entregas**

- carregar albums estaticos + customizados
- montar summaries por seller
- expor album padrao com regra explicita
- reutilizar contagens por album

**Arquivos que devem passar a usar esse helper**

- `app/loja/[slug]/page.tsx`
- `app/loja/[slug]/[albumSlug]/page.tsx`
- `app/painel/estoque/page.tsx`
- `app/painel/precos/page.tsx`

#### 5.2 Criar shell compartilhado da loja

**Novo arquivo**

- `components/loja/public-store-shell.tsx`

**Entregas**

- extrair header e footer da loja publica
- receber seller + children
- manter o visual existente
- evitar perda de identidade na rota do album

---

### Fase 2 — Loja abre direto no album

**Objetivo**: eliminar o clique intermediario sem degradar navegacao.

#### 5.3 Atualizar a rota `/loja/[slug]`

**Arquivo**

- `app/loja/[slug]/page.tsx`

**Mudancas**

- tipar com `PageProps<'/loja/[slug]'>` ou usar `searchParams: Promise<...>`
- usar `await searchParams`
- aplicar regra:
  - sem albums disponiveis: renderiza empty state
  - com `browse=true`: renderiza grid de capas
  - sem `browse=true`: `redirect()` para o album padrao

**Observacao importante**

Essa rota continua existindo como pagina browse/fallback.

#### 5.4 Atualizar a rota `/loja/[slug]/[albumSlug]`

**Arquivo**

- `app/loja/[slug]/[albumSlug]/page.tsx`

**Mudancas**

- reutilizar helper de catalogo do seller
- carregar `availableAlbums` minimos
- passar summaries para o `StoreAlbumView`
- renderizar pagina dentro do `PublicStoreShell`

#### 5.5 Adicionar pills de albums no topo

**Arquivo**

- `components/loja/store-album-view.tsx`

**Mudancas**

- receber `availableAlbums`
- renderizar pills horizontais logo abaixo da busca
- destacar album atual
- esconder a strip se houver apenas 1 album
- usar links para `/loja/[sellerSlug]/[albumSlug]`

#### 5.6 Corrigir navegacao do `StoreAlbumView`

**Arquivo**

- `components/loja/store-album-view.tsx`

**Mudancas obrigatorias**

- botao de voltar deve apontar para `/loja/[sellerSlug]?browse=true`
- CTA "Ver outros albuns" deve apontar para `/loja/[sellerSlug]?browse=true`

#### 5.7 Corrigir secao inicial

**Arquivo**

- `components/loja/store-album-view.tsx`

**Mudanca**

Inicializar `activeSection` com a primeira secao que tenha ao menos 1 figurinha em estoque.

Regra sugerida:

```ts
const firstAvailableSectionIndex = album.sections.findIndex(
  (sec) => sec.stickers.some((s) => (stockMap[s.code]?.quantity || 0) > 0)
)
```

Fallback:

- se nenhuma secao tiver estoque, usar `0`

---

### Fase 3 — Dashboard de estatisticas

**Objetivo**: mostrar cobertura e capacidade real de montar albuns completos.

#### 5.8 Criar a pagina de estatisticas

**Novo arquivo**

- `app/painel/estatisticas/page.tsx`

**Responsabilidades**

- ler seller autenticado
- reutilizar helper de catalogo/configuracao do seller
- buscar `inventory` completa do seller, incluindo `qty = 0`
- considerar apenas albums configurados para o seller
- calcular resumo global
- renderizar grid de cards

#### 5.9 Algoritmo por album

Para cada album configurado:

```ts
const allStickers = album.sections.flatMap((section) => section.stickers)

const quantities = allStickers.map(
  (sticker) => inventoryMap.get(`${album.slug}:${sticker.code}`) ?? 0
)

const completedAlbums = quantities.length > 0 ? Math.min(...quantities) : 0

const blockersForNext = allStickers
  .filter((_, index) => quantities[index] === completedAlbums)
  .map((sticker) => ({
    code: sticker.code,
    name: sticker.name || sticker.code,
    type: sticker.type || "regular",
  }))

const inStock = quantities.filter((qty) => qty > 0).length
const totalUnits = quantities.reduce((sum, qty) => sum + qty, 0)
const coveragePercent =
  allStickers.length > 0 ? Math.round((inStock / allStickers.length) * 100) : 0
```

#### 5.10 Resumo global da pagina

Os cards do topo devem incluir:

- total de albuns completos somados
- total de unidades em estoque
- album mais avancado
- total de albuns configurados

Regra para "album mais avancado":

1. maior `completedAlbums`
2. em empate, maior `coveragePercent`
3. em empate, maior `totalUnits`

#### 5.11 Criar card expansivel

**Novo arquivo**

- `components/painel/album-stats-card.tsx`

**Props recomendadas**

```ts
{
  albumSlug: string
  albumTitle: string
  albumYear: string
  albumFlag: string
  isCustom: boolean
  totalStickers: number
  inStock: number
  totalUnits: number
  coveragePercent: number
  completedAlbums: number
  blockersCount: number
  blockersPreview: Array<{ code: string; name: string; type: string }>
  blockersFullText: string
}
```

**Comportamentos**

- expandir/colapsar
- copiar lista
- transicao suave
- sem fetch adicional na primeira versao

#### 5.12 Limitar payload da lista de bloqueadores

Na primeira entrega:

- card recebe `blockersPreview` para renderizacao
- `blockersFullText` vem pronto para copia

Nao enviar objetos excessivos para uso decorativo.

Se o payload crescer demais em sellers grandes, segunda iteracao:

- carregar detalhes apenas ao expandir

---

### Fase 4 — Integracao na navegacao do painel

**Objetivo**: tornar estatisticas parte real do produto.

#### 5.13 Atualizar shell do painel

**Arquivo**

- `components/painel/painel-shell.tsx`

**Mudancas**

- adicionar item `Estatisticas` no `nav`
- posicionar entre `Precos` e `Pedidos`
- no `mobileNav`, substituir `Precos` por `Stats`

**Nova navegacao mobile**

- Inicio
- Estoque
- Stats
- Pedidos
- Loja

`Precos` continua acessivel por:

- sidebar desktop
- menu lateral mobile

---

## 6. UI e Comportamento Esperado

### 6.1 Loja publica

Fluxo final:

```text
Entrar em /loja/[slug]
  -> redirect para /loja/[slug]/[albumSlugPadrao]
  -> ver identidade da loja no topo
  -> ver busca + pills de album
  -> ver figurinhas disponiveis imediatamente
```

Escape hatch:

```text
/loja/[slug]?browse=true
  -> grid de capas tradicional
```

### 6.2 Dashboard de estatisticas

Blocos:

1. Header com titulo e cards-resumo
2. Grid de albuns com analytics
3. Lista expansivel de bloqueadores por album

Regras visuais:

- reaproveitar o mesmo fallback de capa usado em estoque/precos
- reutilizar escala de cor de progresso:
  - verde `>= 80%`
  - amber `>= 30%`
  - zinc `< 30%`
- badges de tipo devem vir de `getStickerTypeConfig()`

---

## 7. Arquivos Impactados

### Novos arquivos

- `lib/seller-albums.ts`
- `components/loja/public-store-shell.tsx`
- `app/painel/estatisticas/page.tsx`
- `components/painel/album-stats-card.tsx`

### Arquivos modificados

- `app/loja/[slug]/page.tsx`
- `app/loja/[slug]/[albumSlug]/page.tsx`
- `components/loja/store-album-view.tsx`
- `components/painel/painel-shell.tsx`
- `app/painel/estoque/page.tsx`
- `app/painel/precos/page.tsx`

### Modificacoes opcionais recomendadas

- `app/painel/page.tsx`

Opcional para adicionar CTA rapido de acesso a estatisticas no dashboard principal.

---

## 8. Fora de Escopo Nesta Entrega

Itens que parecem proximos, mas devem ficar fora para manter a entrega enxuta:

- misturar figurinhas de varios albuns numa unica grade
- mudar o escopo do carrinho para multi-album
- filtros avancados de estatisticas alem de bloqueadores
- fetch lazily-loaded de bloqueadores via API dedicada
- graficos temporais de vendas
- preferencia persistida de album padrao por seller

---

## 9. Verificacao

### 9.1 Verificacao automatizada disponivel hoje

O projeto atualmente expoe apenas:

- `npm run build`
- `npm run lint`

Nao ha Playwright, Vitest ou Jest configurados no momento.

### 9.2 Checklist tecnico

- `npm run build`
- `npm run lint`

### 9.3 Checklist manual

#### Loja publica

- acessar `/loja/[slug]` com seller que tem estoque
- confirmar redirect para `/loja/[slug]/[albumPadrao]`
- confirmar que a identidade da loja continua visivel na rota do album
- confirmar que `/loja/[slug]?browse=true` abre a grade de capas
- confirmar que as pills trocam de album corretamente
- confirmar que voltar e "Ver outros albuns" levam para `?browse=true`
- confirmar que a primeira secao aberta tem estoque
- confirmar que o carrinho continua isolado por `sellerSlug + albumSlug`

#### Estatisticas

- acessar `/painel/estatisticas`
- validar `completedAlbums` com estoque real de pelo menos 2 albuns
- validar `coveragePercent`
- validar `blockersForNext`
- validar o botao "Copiar lista"
- validar o comportamento com:
  - album sem estoque
  - album com qty 0 em tudo
  - album parcialmente completo
  - album customizado

---

## 10. Ordem Recomendada de Execucao

1. Criar `lib/seller-albums.ts`
2. Extrair `PublicStoreShell`
3. Ajustar `app/loja/[slug]/page.tsx`
4. Ajustar `app/loja/[slug]/[albumSlug]/page.tsx`
5. Atualizar `StoreAlbumView` com:
   - pills
   - links `?browse=true`
   - primeira secao com estoque
6. Criar `app/painel/estatisticas/page.tsx`
7. Criar `album-stats-card.tsx`
8. Atualizar `painel-shell.tsx`
9. Rodar `lint` e `build`
10. Fazer smoke test manual

---

## 11. Criterios de Aceite

Esta entrega so deve ser considerada pronta se:

1. A loja abrir direto em figurinhas sem perder identidade do vendedor.
2. A listagem de capas continuar acessivel via `?browse=true`.
3. O `StoreAlbumView` nao tiver regressao de navegacao.
4. A secao inicial nunca abrir vazia quando houver estoque no album.
5. O dashboard de estatisticas calcular corretamente:
   - cobertura
   - albuns completos
   - bloqueadores do proximo album
6. A pagina nova respeitar o visual premium ja existente no painel.
7. `npm run build` passar sem erro.

---

## 12. Conclusao

O plano revisado mantem a intencao original, mas troca uma implementacao "simples no papel" por uma implementacao sustentavel dentro da arquitetura atual.

O ganho principal desta versao e evitar tres regressões provaveis:

1. perder a identidade da loja ao redirecionar direto para o album
2. quebrar a navegacao de retorno para a grade de capas
3. espalhar mais duplicacao de logica de catalogo pelo projeto

Com essa estrutura, a loja publica fica mais direta para o comprador e o painel ganha uma pagina de analise com valor real para o seller, sem comprometer a base existente.
