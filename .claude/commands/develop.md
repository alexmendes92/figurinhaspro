Implementar "$ARGUMENTS" seguindo o ciclo TDD integrado:

## Passo 1 — Testes proporcionais a complexidade

Avalie o tipo de mudanca:
- **Logica de negocio** (checkout, ownership, deducao, precos, Firestore) → testes rigorosos cobrindo happy path + edge cases
- **UI/layout** (CSS, componentes visuais, animacoes) → verificacao visual no browser, testes opcionais
- **Utilitarios** (formatacao, parsing, helpers) → testes unitarios com inputs variados

Escreva os testes ANTES da implementacao.

## Passo 2 — Red

Rode `npx vitest run` — os testes novos DEVEM falhar.
Se algum teste novo ja passa, o teste esta errado ou a feature ja existe. Investigue.

## Passo 3 — Green

Implemente o MINIMO de codigo para os testes passarem.
Codigo feio que passa > codigo bonito que falha.

## Passo 4 — Verificacao

Rode `npx vitest run` — TODOS os testes (novos + existentes) devem passar.
Se testes existentes quebraram, a implementacao tem side effects. Corrija.

## Passo 5 — Refactor

Melhore o codigo SEM mudar comportamento:
- Remova duplicacoes
- Melhore nomes
- Extraia funcoes se necessario
Rode `npx vitest run` apos CADA mudanca de refactor.

## Passo 6 — Build + TypeCheck

```bash
npm run build && npx tsc --noEmit
```
Se falhar, corrija antes de prosseguir.

## Passo 7 — Commit

Faca commit atomico. O hook pre-commit roda vitest automaticamente.
Formato: `tipo(escopo): descricao em PT-BR`

Se a feature tem multiplas partes, commite cada parte separadamente:
- `test(checkout): adicionar testes para calculo de frete`
- `feat(checkout): implementar calculo de frete`
- `refactor(checkout): extrair logica de CEP para utilitario`
