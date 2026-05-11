---
component: Button
created_at: 2026-05-11
updated_at: 2026-05-11
status: stable
score: 8/10 (audit 2026-05-11)
---

# Intent — ui/button

Primitive base pra todo botão da aplicação. Substitui as classes legadas `.btn-primary`/`.btn-ghost` definidas em `globals.css` (removidas na Fase 2.7 — ver Pacote A).

## Decisões não óbvias

### Variants em `cva` + `asChild` Radix (não `forwardRef` nativo)

**Escolhido:** `cva` para variants (`primary`, `secondary`, `ghost`, `danger`, `link`) × sizes (`sm`, `md`, `lg`, `icon`) + `asChild` polimórfico via Radix `<Slot>`.
**Rejeitado:** classes manuais via `clsx`; `forwardRef` (React 19 dispensa).
**Por quê:** `cva` centraliza variants num objeto inspecionável, type-safe via `VariantProps`. `asChild` permite `<Button asChild><Link href="...">X</Link></Button>` herdar estilos sem aninhar `<button>` dentro de `<a>` (anti-pattern semântico).

### Primary = gradient amber Panini (não cor sólida)

**Escolhido:** `bg-gradient-to-r from-accent-500 to-accent-600 text-black hover:from-accent-400 hover:to-accent-500`.
**Rejeitado:** `bg-accent-500` sólido.
**Por quê:** identidade visual P8 — laranja Panini com profundidade. `text-black` (não `text-white`) porque accent é claro o suficiente; contrast AAA sobre fundo amber-500.

### `focus-visible:ring` obrigatório em todas as variants

**Escolhido:** `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background` no base do cva (aplica a todas).
**Rejeitado:** ring opcional por variant.
**Por quê:** a11y é não-negociável. Variants que não tiverem foco visível são rejeitadas no review.

## Trade-offs aceitos

- **5 variants × 4 sizes = 20 combinações** — algumas raramente usadas (`link size="icon"`). Não impede uso.
- **Sem state `loading` ainda** — adicionado no Pacote B (planejado). Hoje, caller duplica lógica `disabled + custom text`.

## Não-negociáveis

- **`focus-visible:ring-accent`** em todas as variants.
- **`disabled:pointer-events-none disabled:opacity-50`** — comportamento consistente.
- **`asChild` continua funcionando** em variants futuras (não quebrar polimorfismo).
- **Tokens semânticos** (`bg-accent-500`, `bg-card`) — nunca hardcode hex em nova variant.

## Questões em aberto

- **Loading state** — Pacote B planeja adicionar `isLoading?: boolean` + spinner Lucide `Loader2`. Quando aprovado, mover daqui para Decisões.
- **Variant `outline`?** — hoje `ghost` cobre borda transparente. Adicionar `outline` (border visível, fundo neutro) se 3+ call sites pedirem.
- **Size `xs` (h-6)?** — hoje `sm` é o menor. Adicionar se aparecer em badges interativos.
