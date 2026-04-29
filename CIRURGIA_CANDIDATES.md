# CIRURGIA_CANDIDATES.md — Top candidatos a refactor

> Gerado por `/akita-bootstrap-auto` em 2026-04-27. **NÃO executa Fase B.4** (cirurgia) em modo AUTO. Lista candidatos pro humano escolher quando houver rede de caracterização verde.
>
> Pré-requisito de cada cirurgia: testes em `CHARACTERIZATION_TESTS.md` rodando antes E depois.

---

## #1 — `src/lib/albums.ts` (44.781 LOC)

**O que é**: dado hardcoded de álbuns + figurinhas (anos 2014, 2018, 2022, 2026, etc.). É TS puro com export de objetos gigantes. Não é código de lógica.

**Por que dói**:
- Bundle Next.js carrega o arquivo se algum Server Component importar o objeto inteiro.
- IDE trava em `Read` — agente IA estoura context window.
- Mudanças (correção de figurinha errada, novo álbum) viram diff de ±50 linhas no meio de 44k.
- Git blame inútil — linhas se renumeram a cada inserção.

**Por que é o **melhor** primeiro candidato**:
- **Não é refactor de código** — é migração de dado. Não muda nenhum comportamento de função pura.
- API pública (`getAlbumBySlug`, `getAllAlbums`, etc — confirmar nomes reais) pode ser mantida idêntica enquanto o backing store muda de TS-literal pra DB.
- Rede de caracterização é direta: snapshot dos retornos das funções públicas antes e depois.

**Plano de cirurgia (NÃO executar agora)**:

1. Schema Prisma: tabela `Album` (id, slug, year, title, sectionsJson) + `AlbumSticker` (albumId, code, type, sectionName, position).
2. Script de seed que **lê o `albums.ts` atual** e gera as rows.
3. Reescrever `getAlbumBySlug` etc. para query Prisma cached (`'use cache'` + `cacheTag(albumSlug)`).
4. Manter `albums.ts` como `albums.legacy.ts` por 1 release pra rollback.
5. Deletar depois que prod confirmou estável.

**Risco**: queries síncronas → assíncronas. Toda chamadora precisa virar `await getAlbumBySlug(slug)`. Pode ser que algumas vivam em escopo síncrono (ex: render top-level). Auditar consumidores antes.

**Esforço estimado**: 1-2 dias com testes prontos. Sem testes prontos: roleta-russa.

---

## #2 — Editores de preço (3 arquivos paralelos, ~2.000 LOC combinados)

**Arquivos**:
- `src/components/painel/precos-editor.tsx` (~456 LOC)
- `src/components/painel/precos-album-editor.tsx` (~823 LOC)
- `src/components/painel/precos-global-editor.tsx` (LOC TBD)

**O que é**: 3 UIs Client (provavelmente, dado o domínio interativo) que editam:
- `precos-global-editor` → `PriceRule` global
- `precos-album-editor` → `PriceRule` por álbum + `SectionPriceRule` + `QuantityTier` (3 abas)
- `precos-editor` → ?? (versão antiga? wrapper?)

**Por que dói**:
- Inferência forte de duplicação: form + state + API call + tabela de preview existe em todos os 3.
- Mudança de schema (ex: novo tipo de sticker) força edição em 3 lugares.
- `precos-editor.tsx` parece ser legado (nome menos específico). Verificar se ainda é usado.

**Plano de cirurgia (NÃO executar agora)**:

1. **Antes de tocar**: confirmar via `Grep` em `src/app/painel` quem renderiza qual editor. Se `precos-editor.tsx` não é importado em lugar nenhum, é dead code → delete.
2. Extrair sub-componentes compartilhados para `src/components/painel/precos/` (ex: `<PriceRuleRow>`, `<SectionRuleForm>`, `<QuantityTierTable>`).
3. Cada editor de tela vira ~150 LOC orquestrando os sub-componentes.
4. Caracterização: testes E2E (Playwright) das 3 telas — clicar em cada aba, salvar, ver toast, recarregar e ver persistência.

**Risco**: editores têm estado local complexo. Se faltar teste E2E, regressões silenciosas em "não salva ao apertar Enter" / "não valida número negativo" são prováveis.

**Esforço estimado**: 2-3 dias com E2E pronto.

---

## #3 — Visualizadores de álbum (2 arquivos, ~2.000 LOC combinados)

**Arquivos**:
- `src/components/loja/store-album-view.tsx` (1.052 LOC)
- `src/app/albuns/[year]/album-viewer.tsx` (914 LOC)

**O que é**:
- `store-album-view`: storefront público — vendedor mostra figurinhas em estoque com botão "comprar"
- `album-viewer`: galeria pública — qualquer um vê o álbum sem comprar

**Por que dói**:
- Layout grid de figurinhas, agrupamento por seção, hover de detalhe → quase certamente compartilhado mas duplicado.
- Lógica de "qual sticker mostrar" diverge (storefront filtra por inventory > 0; galeria mostra tudo).

**Plano de cirurgia**:

1. Extrair `<AlbumGrid>` puro pra `src/components/album-grid/` — recebe `stickers: Sticker[]` + `renderCell: (s) => ReactNode`.
2. `store-album-view` passa cells com botão "comprar".
3. `album-viewer` passa cells só com info.
4. Caracterização: visual regression nas duas páginas (Playwright screenshot diff).

**Risco**: ambos são >900 LOC com props complexos. Strangler pattern (mudar consumidor por consumidor) é mais seguro que big-bang.

**Esforço estimado**: 2 dias.

---

## Não-candidatos (por enquanto)

| Arquivo | LOC | Por que não cirurgia agora |
|---|---|---|
| `src/components/painel/inventory-manager.tsx` | 1.036 | Em uso intensivo, churn alto. Esperar feature freeze. |
| `src/app/page.tsx` | 859 | Landing/marketing — mexer = SEO + analytics regression. Refactor cosmético, não estrutural. |
| `src/app/onboarding/page.tsx` | 772 | Onboarding muda toda semana. Cirurgia agora vira retrabalho. |
| `src/app/teste/page.tsx` | 659 | Página de **debug**. Verificar se ainda está em prod e considerar **deletar** em vez de refactorar. |
| `src/app/api/comercial/seed/route.ts` | 599 | Seed idempotente, executado raramente. Aceitar tamanho. |

---

## Critério de parada (Akita)

Em modo Akita disciplinado: **uma cirurgia por vez**. Termina #1, valida em prod por ~1 semana, **depois** vai pra #2. Nada de "já que estou aqui, faço as 3".

Combinar com regra do escoteiro: cada feature nova que toca os arquivos da lista de não-candidatos carrega 1 melhoria pequena (em commit separado).
