---
data: 2026-05-11
tipo: plano
topico: intent-md-primitives-ui
autor: alexmendes92
projeto: P8-FigurinhasPro
relacionados:
  - thoughts/reviews/2026-05-11-design-system-audit.md
  - src/components/loja/store-album-view.intent.md
status: ativo
sha: 71a03ba
branch: prototype/modal-roi
iteracoes: 0
pacote: D
aprovado-em: 2026-05-11T23:25
ordem-execucao: 1 (D → A → B → C — rodar PRIMEIRO para documentar estado atual)
decisoes-aprovadas:
  - "Template inline neste plano + .claude/templates/primitive-intent.md"
  - "Score do audit dentro do frontmatter"
  - "Status: experimental | stable | deprecated (convenção design system)"
  - "Rodar D antes de A/B/C — documenta estado atual"
---

# Plano D — `intent.md` para os 4 primitives `src/components/ui/`

## Goal

Padronizar formato `intent.md` (já provado em `loja/store-album-view.intent.md`) para os 4 primitives existentes em `src/components/ui/` (`button`, `phone-input`, `empty-state`, `confirm-dialog`). Cada arquivo documenta **decisões não óbvias, trade-offs aceitos, não-negociáveis, questões em aberto** — cobre 80% do valor de Storybook sem custo de manter Storybook num projeto onde tooling extra é trade-off ruim.

## Pesquisa-base

- [thoughts/reviews/2026-05-11-design-system-audit.md](../reviews/2026-05-11-design-system-audit.md) — Priority Action 6 (docs score 2/10, sem Storybook, 1 intent.md existente)
- [src/components/loja/store-album-view.intent.md](../../src/components/loja/store-album-view.intent.md) — template de referência (estrutura: Decisões não óbvias / Trade-offs aceitos / Não-negociáveis / Questões em aberto / Supersedes)

## Architecture

Camadas afetadas: **apenas `src/components/ui/`** — sem código de runtime, sem testes formais (mas frontmatter tem que ser parseável). Nenhuma mudança em build, deploy ou comportamento.

Decisão de formato:
- **Frontmatter YAML obrigatório:** `component`, `created_at`, `updated_at`, `status`, `score` (do audit), `variant` (opcional — só pra variantes formalizadas).
- **Seções H2 obrigatórias:** Decisões não óbvias, Trade-offs aceitos, Não-negociáveis, Questões em aberto. Seção opcional: Supersedes.
- **Tom**: prosa curta, decisões explicadas com "Por quê", referência a arquivos/linhas reais.

## Files affected

### Modify

Nenhum.

### Create

| Arquivo | Conteúdo |
|---|---|
| `src/components/ui/button.intent.md` | API de variants (5×4 = 20 combinações), por que `asChild` (polimorfismo Radix), por que tokens `accent-*` no primary, futuro `isLoading` (se Pacote B aprovado) |
| `src/components/ui/phone-input.intent.md` | Por que auto-format BR só (escopo P8), por que controlled, decisão de `error` / `aria-invalid` (se Pacote C aprovado), trade-off contra DDI |
| `src/components/ui/empty-state.intent.md` | Por que action polimórfico (href OU onClick), por que não usar `<Button>` ainda (decisão protelada — vale promover), por que sem variants (escolha minimalista) |
| `src/components/ui/confirm-dialog.intent.md` | Por que 2 variants (danger/default) só, decisão de `useDialog` (focus trap), futuro `role="alertdialog"` (se Pacote B aprovado), trade-off contra `<Dialog>` primitive |

### Delete

Nenhum.

## Phases

### Fase 1 — Template `intent.md` para primitives `ui/`

- **RED:** Adicionar teste em `src/__tests__/docs.test.ts` (criar se não existe) que faz glob `src/components/ui/*.intent.md` e valida pra cada match: (a) tem frontmatter parseável; (b) campos obrigatórios presentes (`component`, `created_at`, `status`); (c) tem 4 H2 obrigatórias. Falha vermelha (0 arquivos hoje).
- **GREEN:** Criar arquivo template em `templates/primitive-intent.md` (ou inline neste plano como referência) com a estrutura padrão.
- **REFACTOR:** N/A.
- **Critério de saída:** template definido, teste de docs funcionando (`expect(files.length).toBeGreaterThanOrEqual(0)` — neutro nesta fase).

### Fase 2 — Redigir `button.intent.md`

- **RED:** Esperar `docs.test.ts` ficar vermelho exigindo `button.intent.md` quando arquivo `button.tsx` existe (regra: todo primitive em `ui/` deve ter intent.md).
- **GREEN:** Redigir doc cobrindo: motivação (centralizar variants em vez de classes legadas `.btn-*`), API (5 variants × 4 sizes + `asChild`), trade-offs aceitos (não usar `forwardRef` porque React 19 dispensa), não-negociáveis (`focus-visible:ring-accent` é obrigatório em qualquer variant futura), questões em aberto (loading state — referenciar Pacote B se aprovado).
- **REFACTOR:** Conferir consistência de tom com `store-album-view.intent.md`.
- **Critério de saída:** docs.test.ts verde + arquivo legível (mostrar pra user antes de aprovar fase).

### Fase 3 — Redigir `phone-input.intent.md`

- Mesmo padrão da F2.
- **Conteúdo:** decisões de auto-format BR (regex inline, não lib externa); controlled-only; trade-off contra DDI internacional; futuro `error` + `aria-invalid` (referenciar Pacote C se aprovado); decisão de manter `<input>` HTML5 type=tel sem custom widget.

### Fase 4 — Redigir `empty-state.intent.md`

- **Conteúdo:** decisão de receber `icon` como string (path SVG) em vez de componente React (simplicidade); action polimórfico (href OU onClick); por que não usa `<Button>` ainda (pendente migração); por que sem variants (KISS — todo empty state é igual hoje); abertura: vale adicionar variant `error` quando lista falha ao carregar?

### Fase 5 — Redigir `confirm-dialog.intent.md`

- **Conteúdo:** 2 variants justificadas (danger = destrutivo, default = ok); `useDialog` hook custom (focus trap + ESC); decisão de portal (não usa Portal hoje — `<div className="fixed inset-0 z-[100]">` — trade-off: vale migrar pra Radix Portal); futuro a11y (`role="alertdialog"` — Pacote B); supersedes: ter sido botões inline antes da Fase 2.7.

## Risks

- **Doc vira mentira** se não atualizada após mudanças no código — risco real em projeto Tier A. **Mitigação:** adicionar `lib-currency.md` style — todo PR que muda primitive precisa tocar o intent.md (regra dura do pre-commit em `revisor` agent).
- **Frontmatter inconsistente** entre os 4 docs — mitigação: template fixo na F1.
- **Tom desigual** se redigido sob pressão — mitigação: redigir todos os 4 num só burst, depois revisar conjunto.

## Out of scope (YAGNI)

1. **Storybook** — fora. `intent.md` é a escolha.
2. **`intent.md` para componentes de domínio** (`painel/*`, `loja/*` exceto store-album-view) — fora; só primitives `ui/` hoje.
3. **Render visual da doc** (MDX em `/internal/design-system` page) — fora; ler em IDE é suficiente.
4. **Validação rigorosa do frontmatter** (script Python tipo Oracle) — F1 cobre o mínimo (parseável + campos chave); validação completa fica como tarefa futura.
5. **Tradução PT-EN** dos intent.md — escrevem em PT-BR (consistência com codebase).

## Open questions

1. **Template inline neste plano ou arquivo separado em `templates/`?** Recomendo: inline aqui + arquivo definitivo em `.claude/templates/primitive-intent.md` (escopo do plugin p8-master, não do repo P8).
2. **Score do audit dentro do frontmatter?** Sim — facilita auditoria "este primitive ainda está abaixo de 7/10?".
3. **`status: rascunho | aprovado | revisado` ou `experimental | stable | deprecated`?** Recomendo o segundo (semântica de design system convencional).
4. **Vale rodar Pacote D ANTES de B e C?** Pode — `intent.md` documenta o **estado atual** dos primitives, depois é atualizado quando B/C mudarem a API. Inclusive força clareza ao planejar B/C (escrever o intent expõe gaps).

## Critério de "feito"

- 4 arquivos `*.intent.md` criados em `src/components/ui/`
- `docs.test.ts` verde validando estrutura
- Frontmatter consistente entre os 4 (mesmo schema)
- Documentação reflete o **estado atual** (não o futuro com `isLoading` ou `error` — esses são "questões em aberto" se Pacotes B/C ainda não rodaram)
- Pre-commit gate verde (test + tsc + build — `.md` não afeta tsc, mas teste valida estrutura)
- Audit re-rodado: Docs sobe de 2/10 → 6/10 (não vai 10 porque ainda falta JSDoc inline + componentes de domínio sem intent)
