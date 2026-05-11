---
data: 2026-05-11
tipo: plano
topico: phone-input-forms-a11y
autor: alexmendes92
projeto: P8-FigurinhasPro
relacionados:
  - thoughts/reviews/2026-05-11-design-system-audit.md
status: ativo
sha: 71a03ba
branch: prototype/modal-roi
iteracoes: 0
pacote: C
aprovado-em: 2026-05-11T23:25
ordem-execucao: 4 (D → A → B → C)
decisoes-aprovadas:
  - "F1 descoberta de callers é obrigatória antes de mudar contrato"
  - "Validar comprimento (11 dígitos BR), não regex completo"
  - "Label como prop simples (string), não composition"
  - "Cor do error: text-danger-400"
  - "F4 (FormField) só se Rule of Three confirmar"
---

# Plano C — `PhoneInput` ganha `error` + `aria-invalid` + `disabled` + label slot

## Goal

Promover o primitive `PhoneInput` de "input burro" (só valor + auto-format BR) para input acessível e completo: aceita `error`, `disabled`, `label`, expõe `aria-invalid` e `aria-describedby` quando há erro, e usa tokens semânticos (`text-muted-foreground` em vez de `text-gray-600` hardcoded). Como subproduto, extrair `<FormField>` wrapper se padrão se repetir em `auth-input.tsx`.

## Pesquisa-base

- [thoughts/reviews/2026-05-11-design-system-audit.md](../reviews/2026-05-11-design-system-audit.md) — Priority Action 5 (PhoneInput score 5/10, gaps: error, label, disabled, aria-invalid, hardcoded gray)

## Architecture

Camadas afetadas: `src/components/ui/phone-input.tsx` (primitive), callers que usam PhoneInput (precisam passar `error` quando validação falha), opcionalmente `src/components/ui/form-field.tsx` (wrapper novo se padrão emergir do `auth-input.tsx`).

Decisões:
1. **API mínima**: adicionar `error?: string`, `disabled?: boolean`, `label?: string` em `PhoneInputProps`. `id` é gerado via `useId()` para acoplar `<label htmlFor>` + `aria-describedby` do error message.
2. **Tokens semânticos**: trocar `text-white`, `placeholder:text-gray-600`, `text-sm` por `text-foreground`, `placeholder:text-muted-foreground`, `text-body` (token de tipografia).
3. **Wrapper `<FormField>`** (opcional, F3): se `auth-input.tsx` tiver mesmo padrão (label + input + error), extrair primitive compartilhado.

## Files affected

### Modify

| Arquivo | Mudança |
|---|---|
| `src/components/ui/phone-input.tsx` | Adicionar props `error`, `disabled`, `label`; gerar id via `useId()`; renderizar `<label>` + `<input aria-invalid aria-describedby>` + `<p id=errId>{error}</p>` quando aplicável; trocar `text-white`/`text-gray-600` por tokens |
| Callers de `PhoneInput` | Onde já existe validação (provavelmente formulários de registro/perfil), passar `error={fieldError}` |

### Create

| Arquivo | Função |
|---|---|
| `src/components/ui/__tests__/phone-input.test.tsx` | Testar (a) `error="Telefone inválido"` → `aria-invalid=true`; (b) `aria-describedby` resolve pra `<p>{error}</p>`; (c) sem error → sem `aria-invalid`; (d) `disabled=true` → input bloqueado; (e) auto-format permanece funcionando |

### Conditional create (Fase 3 opcional)

| Arquivo | Quando criar |
|---|---|
| `src/components/ui/form-field.tsx` | Apenas se `auth-input.tsx` tiver padrão idêntico (label+input+error+aria) |

## Phases

### Fase 1 — Identificar callers de `PhoneInput`

- **Não é TDD** — é descoberta. Spike rápido: `grep "import.*PhoneInput" src/` + `grep "<PhoneInput" src/` → lista de arquivos que vão precisar passar `error`.
- **Critério de saída:** lista escrita inline no plano (rascunho atualizado via `/p8-master:itera`). Sem código.
- **Tempo estimado:** 5 minutos.

### Fase 2 — Implementar API nova com TDD

- **RED:** Criar `phone-input.test.tsx` com 5 testes (ver "Create"). Todos vermelhos.
- **GREEN:** (1) Adicionar interface props expandida; (2) `const id = useId(); const errId = useId();`; (3) Render condicional de `<label htmlFor={id}>{label}</label>` quando `label` definido; (4) Input com `id={id}`, `disabled={disabled}`, `aria-invalid={!!error}`, `aria-describedby={error ? errId : undefined}`; (5) Render condicional de `<p id={errId} className="text-small text-danger-400 mt-1">{error}</p>` quando `error`. Substituir classes raw por tokens semânticos.
- **REFACTOR:** Limpar a função `formatPhone` (sem mudanças — só verificação de que continua 4-20 linhas). Confirmar que React Compiler não regressa nada (rodar `npm run dev` e clicar no input).
- **Critério de saída:** 5 testes verdes + tsc + build + `/p8-master:ui-review onboarding` (rota que tipicamente usa PhoneInput).

### Fase 3 — Propagar `error` para callers (depende da Fase 1)

- **RED:** Para cada caller identificado em F1, escrever teste (em `*.test.tsx` do caller ou novo) que valida cenário: "input inválido → mensagem `Telefone inválido` visível + screen reader anuncia (testado via `getByText` + role)". Vermelhos.
- **GREEN:** No caller, ligar a validação (Zod ou state local) ao prop `error`. Exemplo: `<PhoneInput name="phone" value={form.phone} onChange={...} error={form.errors.phone} label="Telefone" />`.
- **REFACTOR:** Se `auth-input.tsx` tiver mesmo shape, considerar extrair `<FormField>`.
- **Critério de saída:** test + tsc + build verde.

### Fase 4 (opcional) — Extrair `<FormField>` wrapper

- Só se F3 expor padrão de **3 ocorrências** (Rule of Three do code-style global). Senão protelar.
- **RED:** `form-field.test.tsx` validando composition (label + slot pra input + error).
- **GREEN:** Implementar como composition (children + props).
- **REFACTOR:** Migrar PhoneInput e auth-input pra usar FormField internamente.

## Risks

- **Quebra de callers que já passam `className`** — hoje PhoneInput aceita `className` no input. Adicionar wrapper `<div>` em volta (pra label/error) muda DOM. Mitigação: `className` continua indo no `<input>`, novo wrapper recebe className própria (`wrapperClassName`?).
- **`auth-input.tsx` tem teste próprio** — se padrão divergir muito, F4 fica fora de escopo. Não forçar.
- **Form Actions do Next 16** — alguns callers podem usar `<form action={serverAction}>`. PhoneInput é controlled (`value` + `onChange`). Confirmar que continua funcionando em form não-controlled (input nativo via `name` propagado).
- **Validação serverless** — error pode vir de Zod no server. Caller passa via prop ou via `useFormState`. Não muda PhoneInput.

## Out of scope (YAGNI)

1. **DDI (código de país)** — PhoneInput hoje só BR. Internacional fica para outro pacote (precisa lib tipo `libphonenumber-js`).
2. **Mask via lib externa** — implementação atual com regex está OK. Não trocar por `react-input-mask` etc.
3. **`<EmailInput>` ou outros inputs especializados** — fora de escopo (mas se F4 acontecer, ficam mais fáceis depois).
4. **`auth-input.tsx` refatorar para usar FormField** — só na F4 e só se Rule of Three se confirmar.
5. **Migrar `text-gray-*` em outros componentes** — sticky do audit, fica para um pacote dedicado a tokens semânticos.

## Open questions

1. **Quais callers usam `PhoneInput` hoje?** F1 vai descobrir. Suspeitas: `onboarding/page.tsx`, `painel/loja/page.tsx` (perfil de loja), formulários de cadastro de cliente em `cart-drawer.tsx`.
2. **Validação de telefone BR é regex `/^\(\d{2}\) \d{4,5}-\d{4}$/`?** Confirmar com user se vale validar formato no input (sugestão: validar só comprimento — 11 dígitos — para permitir colar com/sem formatação).
3. **Label slot ou prop `label`?** Recomendo prop simples (`label: string`) — composition fica para o FormField (F4) se acontecer.
4. **Cor do error: `text-danger-400` ou `text-danger-500`?** Comum em design systems é 500 sobre dark, 400 sobre dark com contrast adjusted. Audit não decidiu — sugerir 400 (já é o token semantic de `--color-danger`).

## Critério de "feito"

- F1: lista de callers identificada e documentada
- F2: 5 testes do PhoneInput verdes + visual idêntico ao anterior quando `error`/`label` não passados (backward compat)
- F3: cada caller propagando `error` corretamente — manual smoke em pelo menos 1 rota (ex: `/onboarding`)
- F4: se aconteceu, FormField com cobertura de teste
- Pre-commit gate verde
- Audit re-rodado: PhoneInput sobe de 5/10 → 8/10
