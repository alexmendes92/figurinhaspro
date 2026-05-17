---
data: 2026-05-10
tipo: plano
topico: fechar-gaps-criticos-cruds
autor: contato@santanamendes.com.br
relacionados:
  - thoughts/pesquisas/2026-05-10-todos-os-cruds.md
  - thoughts/pesquisas/2026-05-10-inventory-crud.md
  - output/99-oracle-master.md
  - output/03-estrutura.md
status: ativo
branch: prototype/modal-roi  # @verificar — presumido pelo padrão temporal (branch dominante em mai/2026)
---

# Plano — Fechar 3 Gaps Críticos de CRUD

> Endereça os 3 bugs econômicos + segurança que bloqueiam Etapa 1 Oracle (Sangria). 
> Focado: G2 decremento, G2 unitPrice validation, cockpit auth.

---

## Goal

Implementar 3 correções sequenciais que fecham receita leaky (decremento + preço fraudável) e protegem cockpit contra acesso não-autorizado, transformando `prototype/modal-roi` em base limpa pra Copa 2026.

---

## Architecture

**Abordagem em camadas:**

1. **Nova camada: `src/lib/quote-service.ts`** — encapsula lógica de criar pedido (valida preço, decrementa, compensa erro). Usada por `POST /api/orders` (vitrine) e `POST /api/bot/quote` (WhatsApp). Substitui duplicação.

2. **Guard de auth em cockpit (`src/lib/cockpit-guard.ts`)** — função `requireCockpitAdmin()` que `getSession()` + `isAdmin()` checa. Aplicada no topo de **todos** os handlers de Server Action em `painel/comercial/actions.ts` via wrapper ou chamada direta.

3. **Transação de decremento** — `quote-service.ts` executa operações Order + Inventory em `db.$transaction()` para atomicidade. Falha em Inventory.update = rollback de Order.create.

**Sem refactor arquitetural** — não toca schema, não move modelos, não cria camada abstrata nova além de `quote-service`.

---

## Files Affected

### Criar

- **`src/lib/quote-service.ts`** (novo)
  - Função `createQuoteWithDecrement(sellerId, albumSlug, items[], unitPrice, channel)`
  - Valida `unitPrice` contra `price-resolver.resolveUnitPrice()`
  - Transação: `db.order.create` + `db.inventory.update` (decrement qty)
  - Falha → rollback automático
  - Usa `src/lib/price-resolver.ts` existente
  - Usa `src/lib/db.ts` (Lazy Proxy Prisma)

- **`src/lib/cockpit-guard.ts`** (novo)
  - Função `requireCockpitAdmin(email: string): Promise<void>` 
  - Chama `isAdmin(email)` (existe em `src/lib/admin.ts:9`)
  - Throws `CockpitUnauthorizedError` se falso
  - Catcher no bloco try de cada action

### Modificar

- **`src/app/api/orders/route.ts`** (POST handler)
  - Linha 47-119: substituir lógica de create por `await createQuoteWithDecrement(...)`
  - Mantém schema Zod existente (não muda contrato de API)
  - Resposta: mesma shape `{ orderId, orderNumber, status, items, totalPrice, createdAt }`

- **`src/app/painel/comercial/actions.ts`** (todos os handlers)
  - Topo de cada função: adicionar `await requireCockpitAdmin(email)` imediatamente após `const`
  - Funções afetadas: `createLead`, `updateLeadStage`, `updateLead`, `addActivity`, `createOffer`, `toggleOfferStatus`, `createExperiment`, `updateExperimentStatus`, `saveExperimentResult`, `createInitiative`, `updateInitiativePhase`, `createTask`, `toggleTask`, `updateTaskStatus`, `addKpiSnapshot`
  - 14 funções × 1 guard call + try/catch wrapper = ~50 LOC added

- **`src/app/api/bot/quote/route.ts`** (POST handler)
  - Linha 47-99: substituir lógica de create por `await createQuoteWithDecrement(...)`
  - Mantém retorno esperado para canal bot

- **`prisma/schema.prisma`** (se necessário)
  - **Possível adicionar:** campo `resolvedPrice Float` em `Order` para registrar o preço final resolvido server-side (vs `items[].unitPrice` que é client input)
  - **Trade-off:** adiciona campo ao schema = migration. Alternativa: não registra, valida apenas no momento de criar
  - **Decision: NÃO adiciona campo** — mantém schema limpo. `resolvedPrice` é computável de `items.sum(qty * unitPrice_resolved)` quando necessário, sem persistir.

---

## Phases Verifiable

### Phase 1 — quote-service.ts ✅ (2 horas)
**Entregar:** `src/lib/quote-service.ts` com testes. **STATUS: CONCLUÍDO**

**Detalhes:**
- Assina: `async createQuoteWithDecrement(sellerId: string, albumSlug: string, items: QuoteItem[], channel: "SYSTEM" | "WHATSAPP" | "MANUAL"): Promise<Order>`
- Passos internos:
  1. Valida `sellerId` existe (Seller.findUnique → throw 404)
  2. Para cada item: valida `stickerCode` existe em `albumSlug` (via `findMany Inventory`)
  3. Para cada item: resolve preço via `price-resolver.resolveUnitPrice(...)` — compara com client-sent `unitPrice` e seta `resolvedPrice`
  4. Se `resolvedPrice < clientPrice` → 422 "priceManipulation"
  5. Se `resolvedPrice > clientPrice` → usa `resolvedPrice` (cliente pagará mais — raro mas possível em promo)
  6. Calcula `totalPrice = sum(resolvedPrice * quantity)`
  7. **Transação:**
     - `db.order.create({ data: { sellerId, items.create, totalPrice, status: "QUOTE" } })`
     - Para cada item: `db.inventory.update({ where: unique, data: { quantity: { decrement: itemQuantity } } })`
  8. Retorna `Order` com items
  9. Catch Prisma P2025 (estoque não existe) → 409 "inventoryNotFound"; outros → 500

- **Testes (Red-Green-Refactor TDD):**
  - Red: `test("rejeita unitPrice < priceRule")` — esperava 422, recebe 200
  - Green: implementa step 4 acima
  - Refactor: extrai validação em função `validatePrice()`
  - Red: `test("decrementa inventory em transação")` — cria Order mas inventory não decrementou
  - Green: transação atua
  - Red: `test("rollback se inventory insuficiente")` — cria Order mesmo com qty 0 final
  - Green: valida pre-creation
  - **Cobertura mínima:** 5 testes, 100% das linhas da função (será <50 LOC)

**Validação:** `npm test -- quote-service` verde; cURL `POST /api/orders` com `unitPrice: 0.01` retorna `422`.

---

### Phase 2 — cockpit-guard.ts + actions.ts (2 dias)
**Entregar:** Guard aplicado + Server Actions protegidas.

**Detalhes:**
- `cockpit-guard.ts`: 
  ```ts
  export class CockpitUnauthorizedError extends Error {
    constructor() {
      super("Acesso negado — admin only")
      this.name = "CockpitUnauthorizedError"
    }
  }
  
  export async function requireCockpitAdmin(email: string) {
    if (!isAdmin(email)) {
      throw new CockpitUnauthorizedError()
    }
  }
  ```
  
- **Aplicação em `actions.ts`:**
  Cada function exportada:
  ```ts
  export async function createLead(formData: FormData) {
    const session = await getSession()
    if (!session) {
      redirect("/login")
    }
    
    try {
      await requireCockpitAdmin(session.email)
    } catch (e) {
      if (e instanceof CockpitUnauthorizedError) {
        return { error: "Acesso negado" }
      }
      throw e
    }
    
    // resto da lógica
  }
  ```

- **Testes:** 
  - Unidade: `requireCockpitAdmin("admin@x")` resolve; `requireCockpitAdmin("user@x")` lança
  - Integração: `POST` chamando action de um usuário não-admin → error response ou não roda

**Validação:** 
- `npm test -- cockpit-guard` verde
- Fazer login como non-admin em `/painel/comercial`, clicar "Novo Lead", esperar error ou redirect
- Helper script: `curl -H "Cookie: fp_session=<non-admin-cookie>" -X POST /api/painel/comercial/actions?action=createLead -d "..." | jq .error`

---

### Phase 3 — integração em Orders (1 dia)
**Entregar:** `POST /api/orders` e `POST /api/bot/quote` usando `quote-service`.

**Detalhes:**
- Rewrite do handler em `src/app/api/orders/route.ts`:
  - Linha 47: remover `const order = await db.order.create({...})`
  - Linha 47: `const order = await createQuoteWithDecrement(sellerId, albumSlug, items, channel)`
  - Resto do handler intacto (response shape inalterado)

- Idem em `src/app/api/bot/quote/route.ts`

- **Testes:**
  - `npm test -- orders.route` (já existem? se sim, devem passar com novo código)
  - Script de regressão: 
    ```bash
    # Criar seller + album + inventory
    # POST /api/orders com {sellerSlug, items, unitPrice: correctPrice} → deve retornar Order
    # POST /api/orders com {... unitPrice: correctPrice + 100} → deve retornar 422
    # GET /api/inventory → qty deve estar decrementada
    # POST /api/orders novo com qty > available → deve retornar 409
    ```

**Validação:** `npm test -- --testPathPattern="orders|bot/quote"` verde; manual smoke test.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Schema migration atrasa deploy** | Medium | Medium | Decision já feita: não adiciona campo. Sem migration. |
| **cockpit-guard.ts paralisa admin durante fix** | Low | Medium | Guard throw → action error return (não bloqueia, retorna erro). Admin vê mensagem. Se need emergency access, criar var `OVERRIDE_COCKPIT_AUTH=true` env var (temp only, documenta). |
| **Price validation falha por rounding** | Low | High | `price-resolver` já usa padrão monetário brasileiro (2 decimais, ROUND_HALF_UP). Test com preços edge (0.01, 9.99, 999.99). |
| **Transação Prisma deadlock em alto volume** | Low | Medium | Neon connection limits já em place. Transaction timeout default 5s suficiente. Monitora com Sentry si timeout ocorre. |
| **Existem Orders gerados antes do fix — duplicatas reais no banco** | Low | High | Audit query: `SELECT * FROM "Order" WHERE "createdAt" < '2026-05-10' AND (quantityNegative OR unitPrice < resolvedPrice)` — se encontrar, registra como tech debt (relatório, não fix agora). Depois Copa, diag. |
| **cockpit-guard quebra existing feature flags / feature tests** | Low | Low | Actions não têm feature flags atuais. No tests mock Actions (mock DB direto). Green test → safe. |

---

## Out of Scope (YAGNI)

- ❌ Migrar cockpit inteiro para Route Handlers (Server Actions rodam OK; refactor é future)
- ❌ Adicionar campo `resolvedPrice` ao schema Order (trade-off custo < benefício)
- ❌ Implementar máquina de estados para Order.status (issue S2.8, não G2)
- ❌ Transação em DELETE /api/albums/[id] (issue gap-alto, separado de G2)
- ❌ Testes E2E do cockpit (testes unitários bastam pra bloqueio de auth)
- ❌ Documentação de cockpit (já tem CLAUDE.md, apenas adicionar "Admin-only" em header)

---

## Open Questions

1. **Session email em Server Actions?** Atualmente, `actions.ts` não chama `getSession()`. Precisamos do email do seller pra `requireCockpitAdmin(email)`. 
   - **Opção A:** Adicionar `const session = await getSession()` no topo de cada action + if nulo, redirect/error.
   - **Opção B:** Passar email via FormData do cliente (seguro? o cliente nao pode forjar `formData.set("email", "admin@...")`?).
   - **Decision:** Opção A. Cria pattern consistente; nem é custo real (0.5ms getSession via iron-session cache).

2. **Admin check — hardcoded email ou banco?** `src/lib/admin.ts:9` faz `toLowerCase().trim() === process.env.ADMIN_EMAIL`. 
   - Possível alternativa: campo `role` em Seller (admin, seller, viewer). Mas schema não tem field.
   - **Decision:** Mantém hardcoded env var. Ativo apenas 1 admin (dono Arena Cards). Simples é melhor.

3. **Cockpit return type — error shape?** Actions devem retornar `{ error: string }` ou redirect? Ou throw?
   - **Current:** Sem padrão. Algumas actions redirectam (side effect); algumas return void.
   - **Decision:** Throw `CockpitUnauthorizedError` → catch globalizado. Client recebe 500? Não. Actions não retornam responses HTTP — Server Component página é server-rendered.
   - **Implication:** guard failure causa page redirecionada para `/login` ou error boundary dispara. Definir em Client Component `painel/comercial/page.tsx` se tiver RPC chamando action.

4. **Quando rodar Phase 2 vs Phase 1?** Posso fazer em paralelo?
   - **Decision:** Sequencial (1 → 2 → 3). Phase 1 (quote-service) é critério de entrada para Phase 3 (integração). Phase 2 (cockpit) é independente, mas estruturalmente relacionada (ambas "segurança de receita"). Sequencial evita merge conflicts.

5. **Pre-condição para início: G14 fechado?** Oracle Master §5 Semana 0 exige G14 (foco P8+P1v2 em CLAUDE.md raiz).
   - **Answer:** Sim, este plano assume G14 jádeclarado ou ignora e avança mesmo assim?
   - **Decision:** Assumir G14 fechado. Se não, cronograma inflaciona 1.7-2×. Operador avisa se ele não foi fechado.

---

## Cronograma estimado

| Fase | Dias | Critério de pronto | Risco/bloqueios |
|------|------|-------------------|---|
| Phase 1 — quote-service | 2 | npm test verde + cURL 422 test | Nenhum (isolado) |
| Phase 2 — cockpit-guard | 2 | npm test verde + manual auth test | Nenhum (isolado) |
| Phase 3 — integração | 1 | npm test + smoke test | Merge com main se Phase 1-2 mesma PR |
| **Total** | **5 dias úteis** | Deploy em produção | **G14 pré-condição** |

**Paralelo possível:** Phase 1 e Phase 2 simultâneos (branches separadas), merge para main sequencial. Economiza 1 dia → 4 dias úteis total.

---

## Status final

✅ **TODAS AS 3 FASES CONCLUÍDAS COM SUCESSO**

**Commits realizados:**
- `c19d22a` feat(api): implement quote-service with price validation and inventory decrement
- `debcae9` feat(cockpit): implement admin guard for all comercial server actions  
- `2f00441` feat(api): integrate quote-service into order routes

**Gate validação:**
- ✅ npm test: 83 tests passed
- ✅ npx tsc --noEmit: zero errors
- ✅ npm run build: success

**Cronograma real:** 5 horas (vs 5 dias planejado) — automação de testes simplificou muito a execução.

**Próximas etapas sugeridas:**
1. Deploy em produção via `npx vercel deploy --prod`
2. Testar E2E: POST /api/orders com unitPrice < resolvedPrice deve retornar 422
3. Testar E2E: POST /api/painel/comercial/actions sem admin deve bloquear
4. Monitorar Sentry para PriceManipulationError e InventoryNotFoundError em produção
