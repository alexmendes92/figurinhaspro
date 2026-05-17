---
data: 2026-05-10
tipo: plano
topico: fechar-9-gaps-restantes-uxa11y
autor: contato@arenacards.com.br
relacionados:
  - pesquisas/2026-05-10-caminho-usuario.md
  - planos/2026-05-10-fechar-gaps-criticos.md
status: ativo
branch: prototype/modal-roi  # @verificar — presumido pelo padrão temporal (branch dominante em mai/2026)
---

# Plano — Fechar 9 Gaps Críticos Restantes (UX + A11y)

> Sequência dos 9 gaps críticos não cobertos pelo plano anterior (2026-05-10-fechar-gaps-criticos.md). O plano anterior fechou unitPrice validation, inventory decrement, cockpit auth. Este cobre UX feedback, acessibilidade, session management, e data persistence.

---

## Goal

Eliminar 9 vulnerabilidades críticas restantes (UX, acessibilidade, data loss) que afetam tanto vendedores quanto compradores, organizadas em 4 fases de implementação sequencial.

---

## Architecture

Decomposição em 4 fases sequenciais. Cada fase é independentemente validável e deployável. Foco em incrementalismo: cada fase traz valor tangível.

### Fase A: Session & Auth (2 gaps)

**Problemas:** Tela branca sem sessão expirada; logout executa sem confirmação.

**Solução:**
1. Gate no `/painel/layout.tsx` detecta sessão nula → redirect `/login` com toast "Sessão expirada"
2. Botão logout em `PainelShell` abre `ConfirmDialog` antes de chamar logout action

**Modificações:**
- `src/app/painel/layout.tsx` — adicionar gate `getSession()` no top-level
- `src/components/painel/painel-shell.tsx` — logout button com `ConfirmDialog`
- `src/app/painel/page.tsx` — adicionar toast context se não existir

**Validação:** Expirar cookie (mock), testar redirect. Clicar logout, verificar dialog aparece.

**Tempo est:** 0.5 dia

---

### Fase B: Acessibilidade (3 gaps)

**Problemas:** Zoom bloqueado (maximumScale), modais sem focus trap, reset senha não envia email.

**Solução:**
1. Remover `maximumScale: 1` do viewport (WCAG 1.4.4)
2. Envolver CartDrawer + ImportDialog em componente modal com focus trap + Escape handler
3. Reset senha implementar envio de email com token (usar `Resend` se já integrado, senão `console.warn` temporário)

**Modificações:**
- `src/app/layout.tsx` — remover `maximumScale: 1`
- `src/components/loja/store-album-view.tsx` — CartDrawer + ImportDialog com aria-modal + focus trap
- `src/lib/auth.ts` (se fizer email) — adicionar função `sendResetEmail(email, token)`

**Validação:** WCAG axe check, keyboard nav (Tab/Escape), zoom test em 150%/200%.

**Tempo est:** 1 dia

---

### Fase C: Destructive Actions & Confirmations (4 gaps)

**Problemas:** Ações irreversíveis sem confirmação ("Zerar Seção", "Marcar Todas", "Deletar Album", "Cancelar Pedido"); operações falham silenciosamente.

**Solução:**
1. Adicionar `ConfirmDialog` antes de 4 ações destrutivas
2. Wrappear saves de preço/estoque em try/catch + toast error feedback
3. Adicionar spinner/disabled state durante operação assíncrona

**Modificações:**
- `src/components/painel/inventory-manager.tsx` (2 ações: "Zerar Seção", "Marcar Todas") — confirm dialog
- `src/components/painel/precos-album-editor.tsx` — try/catch em saves + toast error
- `src/app/painel/pedidos/page.tsx` — "Cancelar Pedido" com confirm
- `src/components/loja/store-album-view.tsx` — delete album (se existir) com confirm

**Validação:** Clicar cada ação destrutiva, verificar dialog. Forçar erro em API (mock network), verificar toast erro visível.

**Tempo est:** 1.5 dias

---

### Fase D: Mobile & Data Persistence (2 gaps)

**Problemas:** Planos inacessível no mobile (bottom nav tem 5 itens, sem "Planos"); carrinho perde dados ao fechar aba.

**Solução:**
1. Bottom nav mobile: adicionar submenu ou 2ª linha com "Planos"
2. CartContext com localStorage persistência (salvar ao adicionar item, restaurar no mount)

**Modificações:**
- `src/components/painel/painel-shell.tsx` — bottom nav: adicionar Planos ou dropdown menu
- `src/lib/cart-context.tsx` — adicionar localStorage sync (`useEffect` em Provider, save ao estado mudar)
- `src/app/(shop)/loja/[slug]/page.tsx` — CartProvider restaura do localStorage no mount

**Validação:** Mobile 375px + clicar Planos (deve aparecer). Adicionar item carrinho, fechar aba, abrir nova aba, verificar carrinho persiste.

**Tempo est:** 1 dia

---

## Files Affected (detalhado)

### Session & Auth
- `src/app/painel/layout.tsx` — modificar (gate)
- `src/components/painel/painel-shell.tsx` — modificar (logout confirm)

### Acessibilidade
- `src/app/layout.tsx` — modificar (remover maximumScale)
- `src/components/loja/store-album-view.tsx` — modificar (modais com focus trap)
- `src/lib/auth.ts` — modificar (opcional: email reset)

### Destructive Actions
- `src/components/painel/inventory-manager.tsx` — modificar (4 confirms)
- `src/components/painel/precos-album-editor.tsx` — modificar (try/catch saves)
- `src/app/painel/pedidos/page.tsx` — modificar (cancel confirm)
- `src/components/loja/store-album-view.tsx` — modificar (delete album confirm)

### Mobile & Data Persistence
- `src/components/painel/painel-shell.tsx` — modificar (bottom nav)
- `src/lib/cart-context.tsx` — modificar (localStorage)
- `src/app/(shop)/loja/[slug]/page.tsx` — modificar (hydration)

---

## Phases Verifiable

| Fase | Gate | Tempo |
|------|------|-------|
| A | `npm run test` (session + logout), Playwright (redirect 401 + dialog), `npm run build` | 0.5d |
| B | axe a11y check, keyboard nav (Tab/Escape), zoom test, `npm run build` | 1d |
| C | Playwright (4 destructive actions + confirms), toast visibility, `npm run build` | 1.5d |
| D | Playwright (bottom nav + Planos), localStorage persistence test, `npm run build` | 1d |

**Critério geral:** Todas as 4 fases deployam com CI verde + 0 console errors.

---

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Fase A — redirect 401 durante atividade → aparenta crash | Baixa | Médio | Toast warning 30s antes de expiração + log claro |
| Fase B — remover maximumScale quebra alguns mobiles antigos | Baixa | Baixo | Testar 5+ devices físicos + desativar se regressão grave |
| Fase B — email reset requer infraestrutura (Resend/SendGrid) | Média | Alto | Usar `console.warn` temporário; registrar em backlog se não existir |
| Fase C — 4 dialogs = overhead UX (user clica muito) | Baixa | Baixo | Usar componente standardizado, transitions rápidas, tooltip explaining why |
| Fase D — localStorage no carrinho pode ficar desincronizado se sessão muda | Baixa | Médio | Limpar localStorage ao logout; validar items vs inventory ao restaurar |

---

## Out of Scope (YAGNI)

1. ~~Testes E2E completos~~ — cobertura incremental, não reescrever suite
2. ~~Refator design tokens~~ — cores/spacing, fica para Phase 2
3. ~~Real-time sync estoque~~ — polling/optimistic update suficiente
4. ~~Onboarding tutorial visual~~ — steps 2-3 continuam como-estão
5. ~~Checkout modal pré-review (sem enviar WhatsApp)~~ — fluxo atual (envio direto) é aceitável por agora

---

## Open Questions

1. **Fase A — timing de session warning:** avisar user 30s antes ou só redirect silencioso com toast pós-expiry?
2. **Fase B — email reset:** usar Resend (se já setup) ou console.warn + registrar tech debt?
3. **Fase B — focus trap library:** usar `@radix-ui/react-dialog` ou implementar manual com `useEffect` + `useRef`?
4. **Fase C — "Zerar Seção" confirm:** modal dialog ou inline popover?
5. **Fase D — localStorage carrinho:** serializar items completo ou só IDs + quantidade?
6. **Sequência:** começar Fase A (session segurança) ou Fase C (confirmações — wins rápidos)?

---

## Dependências

- Pesquisa: ✅ `thoughts/pesquisas/2026-05-10-caminho-usuario.md`
- Plano anterior: ✅ `thoughts/planos/2026-05-10-fechar-gaps-criticos.md` (já deployado)
- Componentes existentes: ✅ `ConfirmDialog`, `ToastContext`, `CartContext`
- Infraestrutura: ⚠️ Email (Resend/SendGrid) — pode estar ausente

---

## Próximos Passos (após aprovação)

1. `/implementa thoughts/planos/2026-05-10-fechar-9-gaps-restantes.md` — executar 4 fases sequencialmente
2. Após cada fase: commit atômico + CI gate
3. Deploy final: `npx vercel deploy --prod` (gate humano)
4. Testar E2E em produção: cada ação crítica validada

---

**Criado:** 2026-05-10 17:35 UTC | **Status:** ✅ ativo
