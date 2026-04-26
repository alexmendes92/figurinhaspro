# Checklist visual de onboarding na vitrine (/painel/loja)

> Plano elaborado via /plan em 2026-04-26. Aguarda aprovação explícita antes de execução.

## Objetivo

Substituir o card de "Informações" da vitrine que mostra 3x "Nao configurado" mortos por um checklist visual de progresso ("Sua vitrine está X% configurada") com CTA por item ausente. Quando 100%, vira selo discreto e a seção colapsa.

## Critérios de aceitação

1. Header novo no topo de `/painel/loja` (acima do bloco "Link da vitrine"): "Sua vitrine está X% configurada" + barra de progresso âmbar com `role="progressbar"` + ARIA values
2. `%` = `round((filledCount / total) * 100)`, onde `filledCount` = número de campos com `value?.trim().length > 0` entre `[shopDescription, businessHours, paymentMethods]` e `total = 3`
3. 3 cards de item empilhados verticalmente, cada um com:
   - Indicador de status (preenchido = check verde / vazio = traço âmbar)
   - Label do campo: "Descrição da loja" / "Horário de atendimento" / "Métodos de pagamento"
   - CTA "Configurar agora" → âncora `<a href="#shopDescription">` que scrolla pro form do LojaEditor
4. Quando `filledCount === 3` (100%): seção vira selo discreto único "Vitrine pronta · 3 de 3 campos" (sem cards individuais)
5. Mobile: cards empilham (já vertical), CTAs com `min-h-[44px]`
6. TDD: função pura `computeOnboardingProgress(seller)` com 5 testes:
   - 0 campos preenchidos → `{ percent: 0, filledCount: 0, total: 3, missing: [3 ids] }`
   - 1 campo → `{ percent: 33, filledCount: 1, ... }`
   - 2 campos → `{ percent: 67, filledCount: 2, ... }`
   - 3 campos → `{ percent: 100, filledCount: 3, missing: [] }`
   - Whitespace-only (`"   "`) tratado como vazio

## Invariantes de domínio afetados

Nenhum. Mudança UI + função pura. Não toca: schema Prisma, auth/session, Order/Inventory/PriceRule.

## Edge cases

1. **Whitespace puro** (`"   "`) → conta como vazio (`.trim().length > 0` no contrato)
2. **Seller sem session** → página inteira já retorna `null` (linha 9). Componente novo nunca recebe seller null.
3. **LojaEditor sem âncora IDs** → necessário ler o componente e adicionar `id="shopDescription"` etc. nos containers das seções. Se layout não suporta âncora natural, fallback é scrollIntoView via JS pequeno (client component).
4. **A11y barra**: usar `<progress max="100" value={percent}>` ou `role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}` + label legível por screen reader.

## Arquivos impactados

**Criar:**

| Arquivo | Tipo | Função |
|---|---|---|
| `src/lib/onboarding-progress.ts` | Server-safe puro | `computeOnboardingProgress(input)` retorna `{ percent, filledCount, total, missing }` |
| `src/lib/onboarding-progress.test.ts` | Vitest node | TDD: 5 testes (0/1/2/3 + whitespace) |
| `src/components/painel/onboarding-checklist.tsx` | Server Component | Renderiza header + barra + 3 cards OU selo "100%" |

**Modificar:**

| Arquivo | Mudança |
|---|---|
| `src/app/painel/loja/page.tsx` | Adiciona `<OnboardingChecklist seller={seller} />` no topo (linha ~22, antes do "Link da vitrine") |
| `src/components/painel/loja-editor.tsx` | Adiciona `id="shopDescription"`, `id="businessHours"`, `id="paymentMethods"` nas seções correspondentes (depende do layout — Read primeiro) |

**Não modificar:**

- Schema Prisma (campos já existem)
- LojaEditor lógica de submit / state / forms
- Vitrine pública `/loja/[slug]`
- Auth

## Risco

**Baixo, contido a 1 página + 1 componente novo + ajuste de IDs no LojaEditor.**

- **Lógica `computeOnboardingProgress`**: 100% pura, 100% coverage via TDD
- **Server Component**: sem state, sem hooks, sem JS no client (âncora `<a href="#x">` é nativa)
- **LojaEditor**: ajuste de IDs é não-funcional (anchor target). Forms continuam funcionais.
- **Sem cobertura de testes nos arquivos UI editados** — único gate além de tsc/build é validação visual pós-deploy.

## Plano de execução

### Pre-flight

- [ ] Read `src/components/painel/loja-editor.tsx` pra entender layout das 3 seções e onde colocar IDs
- [ ] Confirmar baseline: `npm run test` 12/12 + `npm run build` exit 0 (já tá)

### Commit único — `feat(loja): checklist visual de onboarding da vitrine`

1. **RED**: criar `src/lib/onboarding-progress.test.ts` com 5 testes
2. **GREEN**: criar `src/lib/onboarding-progress.ts` minimal pra passar
3. Criar `src/components/painel/onboarding-checklist.tsx` (Server Component)
4. Modificar `src/app/painel/loja/page.tsx` pra renderizar `<OnboardingChecklist />` no topo
5. Modificar `src/components/painel/loja-editor.tsx` pra adicionar IDs de âncora nas 3 seções
6. **Gate** (auto via hook pre-commit `chore(hooks)` recente): `npm run test` + `npm run build`
7. Commit + push (PR #2 ganha mais 1 commit)

### Sem Playwright local

Validação visual segue bloqueada (sem credenciais de seller). Validar pós-deploy com sellers em diferentes estados:

- Seller FREE recém-criado (3/3 campos vazios) → 0%, 3 cards CTA
- Seller com 1-2 campos preenchidos → % parcial, cards mistos
- Seller com tudo preenchido → 100%, selo "Vitrine pronta"

## Pre-plan checklist

| # | Item | Status |
|---|---|---|
| 1 | Cria função/método novo? → plano lista teste ANTES | PASSA — RED→GREEN explícito |
| 2 | Bug fix? | N/A |
| 3 | Função extraível de UI? | PASSA — `computeOnboardingProgress` |
| 4 | Mudanças mesma unidade funcional? | PASSA — 1 commit |
| 5 | Commit revertível? | PASSA |
| 6 | Gate explícito? | PASSA — auto via hook |
| 7 | Mensagens imperativo PT-BR sem emoji? | PASSA |
| 8 | Memory consultado? | PASSA — pre-plan + worktree gotchas |

## Pendências bloqueantes pré-execução

Aguardo confirmação tua:

- (a) Plano OK?
- (b) Comportamento quando 100% — prefere selo discreto colapsável OU sumiço total da seção (zero ruído)?
- (c) Copy: "Sua vitrine está X% configurada" funciona, ou prefere outro tom (ex: "X de 3 itens prontos")?
- (d) Quando todos 3 campos preenchidos, faz sentido ainda renderizar o selo (info pra mostrar "tá tudo certo") ou esconde completamente?
