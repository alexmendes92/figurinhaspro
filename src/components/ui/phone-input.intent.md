---
component: PhoneInput
created_at: 2026-05-11
updated_at: 2026-05-11
status: experimental
score: 5/10 (audit 2026-05-11)
---

# Intent — ui/phone-input

Input especializado pra telefone brasileiro com auto-format `(11) 99999-9999`. Componente controlled-only — não gerencia state interno além da formatação.

## Decisões não óbvias

### Auto-format BR via regex inline (não lib externa)

**Escolhido:** função `formatPhone` interna com regex e slice.
**Rejeitado:** `react-input-mask`, `libphonenumber-js`.
**Por quê:** P8 atende só Brasil; formato é fixo; lib externa seria 20kb+ pra resolver problema de 5 linhas. Quando expandir pra internacional, reavaliar.

### Controlled-only (sem fallback uncontrolled)

**Escolhido:** `value` + `onChange` obrigatórios.
**Rejeitado:** detectar uncontrolled e usar `useState` interno.
**Por quê:** Server Actions do Next 16 frequentemente expõem `name` no input nativo. PhoneInput preserva `name` (`type="tel"`), permitindo submit em forms tradicionais OU controlled via Zod/state — caller escolhe.

### Sem máscara visual (caracteres formatados ficam no `value`)

**Escolhido:** value é a string formatada `"(11) 99999-9999"`, não dígitos puros.
**Rejeitado:** value como dígitos `"11999999999"` + display formatado.
**Por quê:** simplifica o submit do form (caller recebe exatamente o que vê). Trade-off: caller precisa `value.replace(/\D/g, "")` se quiser dígitos puros pro banco.

## Trade-offs aceitos

- **`text-gray-600` no placeholder** — não usa token semantic ainda. Pacote C migra para `text-muted-foreground`.
- **Sem `error` / `disabled` / `label` slot ainda** — Pacote C adiciona.
- **`className` vai no input, não no wrapper** — caller que precisar mudar wrapper sofre acoplamento. Wrapper só nasce no Pacote C (quando label/error chegam).

## Não-negociáveis

- **`type="tel"`** — semântica + teclado mobile correto.
- **`autoComplete` não declarado** — caller controla (formulário de registro usa `tel`, perfil usa `off`).
- **Format BR fixo** — não regredir pra "internacional flexível" sem decisão arquitetural.

## Questões em aberto

- **`error` + `aria-invalid` + `disabled`** — Pacote C aprovado, em fila.
- **DDI internacional** — fora de escopo enquanto P8 atende só Brasil.
- **Validação no input ou no caller?** — recomendação: caller valida via Zod, passa `error` quando inválido. PhoneInput não rejeita digitação.
