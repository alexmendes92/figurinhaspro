---
component: ConfirmDialog
created_at: 2026-05-11
updated_at: 2026-05-11
status: experimental
score: 5/10 (audit 2026-05-11)
---

# Intent — ui/confirm-dialog

Modal de confirmação binária (cancelar / confirmar). 2 variants — `default` (ação normal) e `danger` (destrutiva). Depende de `useDialog` hook custom para focus trap + ESC.

## Decisões não óbvias

### 2 variants (default + danger) só

**Escolhido:** `variant?: "danger" | "default"`.
**Rejeitado:** variants por intent (info, warning, success).
**Por quê:** modal de confirmação binária tem 2 modos relevantes: "ok, prossegue" e "atenção, destrutivo". Outras intenções viram modal diferente (toast pra info, snackbar pra success).

### `useDialog` hook custom (não Radix Dialog)

**Escolhido:** hook próprio em `src/lib/use-dialog.ts` que gerencia ESC + click outside + focus trap básico.
**Rejeitado:** `@radix-ui/react-dialog`.
**Por quê:** Radix Dialog é 8kb gzipped e traz Portal + Overlay que P8 não precisa. Hook custom em ~30 linhas cobre 90% dos casos. Trade-off: focus trap menos robusto (não cobre `<iframe>`).

### Backdrop com blur (não opacity simples)

**Escolhido:** `bg-black/60 backdrop-blur-sm`.
**Rejeitado:** `bg-black/80` simples.
**Por quê:** identidade visual P8 — backdrop blur deixa o modal "flutuando" sobre conteúdo legível mas atenuado. Trade-off: performance em mobile baixo-end.

## Trade-offs aceitos

- **`bg-[#0f1219]` hardcoded** — Pacote A consolida em `bg-card-elevated`.
- **`bg-red-500` (não `bg-danger-500`)** — usa Tailwind raw, não token semantic. Pacote B Fase 2 corrige.
- **Botões inline (não `<Button>` shadcn)** — duplica estilos. Pacote B Fase 2 migra.
- **Sem Portal** — modal renderiza inline no DOM tree do caller. `z-[100]` previne overlap, mas modais aninhados não funcionam.

## Não-negociáveis

- **`useDialog` gerencia ESC + click outside** — não reimplementar inline.
- **`onCancel` obrigatório** — modal SEM botão de cancelar é anti-pattern (usuário tem que poder sair).
- **`title` obrigatório** — modal sem título não comunica intent.
- **Touch target ≥ 44px** — `min-h-[44px]` nos botões (mobile-first).

## Questões em aberto

- **`role="alertdialog"` para variant=danger?** — Pacote B Fase 2 adiciona. Hoje quebra screen readers.
- **`aria-labelledby` + `aria-describedby`** — Pacote B Fase 2.
- **`isConfirming` prop pra disable durante mutation?** — Pacote B Fase 2 adiciona (decisão aprovada).
- **Migrar para `<Button>` shadcn?** — Pacote B Fase 2.
- **Portal nativo (`createPortal`)?** — protelar até cenário de modal aninhado aparecer.

## Supersedes

- **Pre-2026-04-21:** modais usavam botões inline com classes legadas `.btn-primary` / `.btn-ghost`, sem ESC handler, sem focus trap. Refactor para `useDialog` + componentização aconteceu antes da migração shadcn.
