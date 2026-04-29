---
data: 2026-04-27
tipo: plano
topico: painel-loja-estrutura
autor: contato@arenacards.com.br
relacionados:
  - pesquisas/2026-04-27-painel-loja-estrutura.md
status: rascunho
---

# Plano — melhorar a estrutura de `/painel/loja`

> Status `rascunho` até decisão humana sobre quais candidatos entram. Não passa para `/implementa` enquanto as **Open questions principais** não forem respondidas.

## Goal

Direção pendente. A pesquisa identificou 8 candidatos de "melhoria de estrutura" em `/painel/loja` (entendido como página + componentes diretos: `OnboardingChecklist`, `LojaEditor`, stats, link da vitrine, preços). Antes de virar plano de execução, preciso saber **qual subset entra nessa rodada**.

## Estado atual (resumo da pesquisa)

Ordem de blocos em `src/app/painel/loja/page.tsx` (post-pull, `6fed020`):

1. Header `<h1>Minha Loja</h1>` + subtítulo.
2. `<OnboardingChecklist>` — 3 campos (`shopDescription`, `businessHours`, `paymentMethods`).
3. Card "Link da sua vitrine" (variante `accent-dim`).
4. Stats grid 3-col (Figurinhas / Pedidos / Álbuns).
5. `<LojaEditor>` — modo leitura/edição via `useState` local.
6. Card "Preços na vitrine".

Anomalias documentadas em §0–§7 da pesquisa.

## Candidatos de melhoria

Cada item tem id, descrição, arquivos afetados, esforço e risco. **Recomendo** assinala onde há ganho funcional claro (não estética).

| # | Candidato | Arquivos afetados | Esforço | Risco | Recomendo? |
|---|-----------|-------------------|---------|-------|------------|
| **C1** | **Conectar `?edit=1#field` do checklist ao `LojaEditor`** — hoje clicar "Configurar" rola pra âncora mas **não ativa** o modo edição (`LojaEditor.editing` é `useState(false)`). É bug funcional do checklist. | `src/app/painel/loja/page.tsx` (ler `searchParams` + passar prop), `src/components/painel/loja-editor.tsx` (aceitar `initialEditing`/`focusField`, `useEffect` para focar input do hash) | M | baixo | ✅ |
| **C2** | **Adicionar `router.refresh()` após save no `LojaEditor`** — hoje o save apenas atualiza estado client; Server Component pai fica desatualizado. Reload da página mostra dados certos, mas dentro da SPA o checklist (Server Component) **não recalcula** progresso após save. | `src/components/painel/loja-editor.tsx` | S | baixo | ✅ |
| **C3** | **Stat "Álbuns: 13" é literal hardcoded** — não conta `CustomAlbum` do vendedor. Trocar por `albums.length + (await db.customAlbum.count(...))`. | `src/app/painel/loja/page.tsx` | S | baixo | ✅ |
| **C4** | **Mostrar itens preenchidos do checklist** com check verde, em vez de só listar `missing`. Hoje quando 2/3 estão completos só aparece 1 item — UX assimétrica e confusa pra quem volta na página. | `src/components/painel/onboarding-checklist.tsx` | S | baixo | ⚪ |
| **C5** | **Substituir `fetch PATCH /api/seller` por Server Action** com `revalidatePath('/painel/loja')`. Resolve C2 de forma estrutural + remove validação manual sem Zod em `api/seller/route.ts`. | `src/components/painel/loja-editor.tsx`, novo `src/app/painel/loja/actions.ts`, manter `api/seller/route.ts` ou deletar | M-L | médio | ⚪ |
| **C6** | **Reordenar blocos** — ex: mover `OnboardingChecklist` pra dentro/junto do `LojaEditor`, ou agrupar "Status da vitrine" (link + checklist + stats) num único card. Decisão de design. | `src/app/painel/loja/page.tsx`, possível CSS | M | baixo | ⚪ |
| **C7** | **Validação Zod em `api/seller/route.ts`** — hoje validação é manual campo-a-campo. Se C5 entrar, isso é absorvido. Standalone se mantiver REST. | `src/app/api/seller/route.ts` | S | baixo | ⚪ |
| **C8** | **A11y do `LojaEditor`**: `id` em cada input batendo com hash do checklist (necessário pra C1 funcionar bem); focus management ao entrar em edit mode; `aria-describedby` para help text. | `src/components/painel/loja-editor.tsx` | S | baixo | ⚪ (entra junto com C1) |

Legenda: S=small (≤30min), M=medium (1-2h), L=large (>2h). Risco assume teste antes do commit (gate `npm run test → tsc → build`).

## Architecture (depende da seleção)

- **C1 + C8 juntos**: page faz `await searchParams`, lê `edit` e hash. Como hash não chega ao server, page passa apenas `initialEditing` quando `?edit=1`. Hash é lido client-side via `useEffect` no `LojaEditor`, que faz `inputRef.current?.focus()` no campo correspondente. Cada input ganha `id={fieldName}`.
- **C2 standalone**: importa `useRouter` em `LojaEditor`, chama `router.refresh()` no `then` do fetch. Não conflita com nada.
- **C3 standalone**: query extra `db.customAlbum.count({ where: { sellerId } })` no `Promise.all`; somar com `albums.length`.
- **C4**: `OnboardingChecklist` itera `FIELDS` em vez de `missing`, e marca cada item visualmente conforme `isFilled(input[field])`.
- **C5 (se entrar)**: criar `src/app/painel/loja/actions.ts` com Server Action `updateLoja(formData)` validando via Zod, fazendo `db.seller.update`, `revalidatePath`. `LojaEditor` usa `useFormStatus` ou form action direto.
- **C6**: discussão de design; sem código pré-definido.

## Phases (preliminar — calibrado após seleção)

Para o subset **C1 + C2 + C3 + C8** (recomendação default):

1. **RED — testes de caracterização** que documentam comportamento atual:
   - `onboarding-checklist.test.tsx`: clicar item gera href `?edit=1#shopDescription` (já passa).
   - `loja-editor.test.tsx`: novo teste — quando `initialEditing=true` e `focusField="shopDescription"`, render começa em edit mode com input focado.
   - Validação: `npm run test` deve mostrar testes novos vermelhos.
2. **GREEN C1+C8** — `LojaEditor` aceita `initialEditing` + `focusField`, focar via ref+useEffect; `id={field}` em cada input.
3. **GREEN C1 (page side)** — `MinhaLojaPage` lê `await searchParams`, passa props.
4. **GREEN C2** — `router.refresh()` no save handler.
5. **GREEN C3** — query `db.customAlbum.count` + soma no stat.
6. **REFACTOR** — extrair magic strings (`"shopDescription"`...) para constante compartilhada com `OnboardingChecklist` (já existe em `src/lib/onboarding-progress.ts`: `OnboardingFieldId`).
7. **VALIDATE** — manual via `npm run dev` + browser: clicar "Configurar" abre edit + foca campo + salva + checklist some sem reload.
8. **UPDATE SPEC** — adicionar parágrafo em `CLAUDE.md > Cockpit Comercial` ou criar seção curta sobre "Onboarding da loja"; comentário inline em `LojaEditor` apontando o link com checklist.
9. **COMMIT** — 1 commit por fase atômica que builda (C1+C8 → 1 commit; C2 → 1 commit; C3 → 1 commit). Hook gate roda `test → tsc → build`.

## Risks

- **Hash não chega ao server** (Next.js limitation conhecida). Sem `useEffect` client, foco não funciona via SSR. **Mitigação**: aceitar como design — server lê apenas `?edit=1`, hash é puramente client-side.
- **`router.refresh()` em Server Component pai re-roda 3 queries Prisma + render**. Em página simples como essa é negligível, mas vale notar.
- **C3 muda contagem visível** ("13" → talvez "13" ou "47"). Pode confundir vendedor que se acostumou com o número. **Mitigação**: aceitar como correção.
- **Pre-commit gate** (`npm run test`) — se algum teste existente quebrar pelo refactor, commit bloqueia. **Mitigação**: rodar `bin/precommit` localmente antes.
- **React Compiler + useEffect**: ainda válido em React 19/RC, sem caveat para focus management.

## Out of scope (YAGNI)

- C5 (Server Action) — refactor maior, fora dessa rodada.
- C6 (reordenação visual) — decisão de design, exige especificação separada.
- C7 (Zod no api/seller) — só vale junto com C5.
- Mexer no `GettingStarted` (checklist do dashboard `/painel`) — outro componente, outro escopo.
- Alterar schema Prisma (`Seller`).
- Migrar `LojaEditor` pra Server Component.

## Open questions (BLOQUEANTES)

1. **Subset escolhido**: aceita o default **C1 + C2 + C3 + C8** ou prefere outro mix? Os candidatos C4 / C5 / C6 / C7 ficam fora?
2. **Modo de edição via `?edit=1`**: abre **todos** os campos do `LojaEditor` (igual ao botão "Editar" hoje) ou só o campo da hash?
3. **Após salvar com `?edit=1` no URL**: limpar via `router.replace('/painel/loja')` ou deixar o param? Limpar é mais limpo; manter facilita debug do user.
4. **TDD strict?** A pesquisa registrou que `LojaEditor` não tem testes. C1 vai exigir teste novo. OK escrever os testes ausentes nessa rodada? Ou só caracterização do que vai mudar?
5. **C3 — quando o vendedor não tem nenhum CustomAlbum**: stat mostra `13` (igual hoje) ou `13 + 0 = 13`? Trivial mas registro.

---

## Próximo passo

Responde as Open questions (mínimo Q1) e atualizo este plano: status → `ativo`, Phases recalibradas para o subset escolhido, e aí `/implementa` consegue rodar.
