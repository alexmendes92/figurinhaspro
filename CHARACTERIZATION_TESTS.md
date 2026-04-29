# CHARACTERIZATION_TESTS.md — Proposta de rede de testes

> Gerado por `/akita-bootstrap-auto` em 2026-04-27. **Proposta**, não implementação.
>
> Por que existe este arquivo: a Fase 0 detectou `tests=true` (pasta `src/__tests__/` existe), mas a auditoria detectou **0 arquivos `*.test.ts` reais**. Há só `src/__tests__/setup.ts` com mocks Prisma + Stripe — esqueleto pronto, suíte vazia. Logo o projeto cai na regra Akita "commits ≥ 30 + tests=false na prática" → precisa rede de caracterização antes de qualquer cirurgia.
>
> Princípio Akita: **capturar comportamento atual, NÃO corrigir**. Bug existente = comportamento atual = teste verde com bug. Bugs vão pra `BUGS_DESCOBERTOS.md`.

---

## Critério de priorização

Os 10 fluxos abaixo foram escolhidos por **3 eixos**:

1. **Risco de regressão** — quebra direta de receita ou onboarding
2. **Frequência de uso real** — endpoints chamados em prod
3. **Acoplamento com Stripe / Neon** — se quebrar, dinheiro/dados em risco

Excluídos (por enquanto): páginas estáticas (`/privacidade`, `/termos`), dashboards admin (`/painel/comercial/*` — em rollout, churn alto, escrever teste agora azarra), página de debug (`/teste`).

---

## Top 10 fluxos críticos (ordem de prioridade)

### 1. Login — bcrypt + fallback plaintext

**Arquivo alvo**: `src/app/api/auth/login/route.ts`

**Por que crítico**: porta de entrada de todos os sellers. Linha 25-37 tem fallback de senha plaintext → bcrypt rehash no primeiro login. Comportamento atual **precisa** ser preservado em refactor.

**Cenários a capturar**:
- Login com senha bcrypt válida → 200 + cookie de sessão
- Login com senha bcrypt inválida → 401
- Login com senha plaintext válida (legado) → 200 + senha **rehasheada** no DB com bcrypt salt 12
- Login com senha plaintext inválida → 401
- Login com email inexistente → 401 (mensagem genérica, sem leak de existência)
- Login com payload Zod inválido → 400

**Mock**: `prismaMock.seller.findUnique`, `prismaMock.seller.update`. Sem rede.

---

### 2. Stripe checkout — criação de session

**Arquivo alvo**: `src/app/api/stripe/checkout/route.ts` (verificar nome real)

**Por que crítico**: ponto único de criação de receita. Qualquer mudança em `priceId` ou `metadata` quebra reconciliação no webhook.

**Cenários**:
- Seller PRO clica "Upgrade UNLIMITED" → `checkout.sessions.create` com priceId correto
- Seller FREE → priceId FREE
- Falha do Stripe SDK (network) → 500 com mensagem amigável (sem leak de stack)
- Customer não tem Stripe customerId ainda → cria via `customers.create` antes
- Customer já tem customerId → reusa

**Mock**: `stripeMock.checkout.sessions.create`, `stripeMock.customers.{create,retrieve}`.

---

### 3. Stripe webhook — `checkout.session.completed`

**Arquivo alvo**: `src/app/api/stripe/webhook/route.ts`

**Por que crítico**: idempotência de pagamento. Stripe re-envia webhooks; double-charge = bug catastrófico. **Comportamento atual** define o que é "OK" — não corrigir aqui.

**Cenários**:
- Webhook válido com signature correta + sessionId novo → cria `SubscriptionEvent`, atualiza `Seller.plan`
- Webhook com signature inválida → 400 sem mexer no DB
- Webhook duplicado (mesmo sessionId) → idempotente: não cria event 2x
- Event type não reconhecido → 200 sem ação (Stripe espera 2xx)

**Mock**: signature manual via `stripe.webhooks.constructEvent` mock + payload fixture.

---

### 4. Order checkout — criação de pedido com cálculo de preço

**Arquivo alvo**: rota POST de criação de Order (verificar — provavelmente `src/app/api/orders/route.ts`)

**Por que crítico**: junta os 3 eixos de preço (`price-resolver.ts`) + Inventory + Order. Coração do storefront.

**Cenários**:
- Pedido com 5 figurinhas regulares → preço unitário = global PriceRule
- Pedido em álbum com SectionPriceRule FLAT → preço sobrescreve global
- Pedido em álbum com SectionPriceRule OFFSET → preço = global + offset
- Pedido com QuantityTier ativo (ex: 100 stickers, tier 10% off) → desconto aplicado no total
- Pedido tentando comprar figurinha sem estoque → erro
- Pedido com `customPrice` em Inventory específico → preço individual ganha de tudo

**Mock**: `prismaMock.{inventory,priceRule,sectionPriceRule,quantityTier,order,orderItem}`.

---

### 5. `price-resolver.ts` — `resolveUnitPrice` puro

**Arquivo alvo**: `src/lib/price-resolver.ts`

**Por que crítico**: função pura, hierarquia de 5 níveis. Cobertura unitária aqui evita explosão combinatória nos testes de fluxo (4 acima).

**Cenários** (cobertura da hierarquia):
- Sem nenhuma regra → preço padrão default (qual é?)
- Só `PriceRule` global → retorna global
- `PriceRule` global + `PriceRule` por álbum → álbum ganha
- `PriceRule` por álbum + `SectionPriceRule` na seção → seção ganha
- Tudo + `customPrice` no Inventory → custom ganha
- Tipo de figurinha desconhecido → fallback (qual?)

**Sem mock** — função pura.

---

### 6. `resolveQuantityDiscount` + `applyDiscount`

**Arquivo alvo**: `src/lib/price-resolver.ts`

**Cenários**:
- Sem tiers configurados → 0% desconto
- Quantidade < menor tier → 0%
- Quantidade no exato `minQuantity` → tier aplica
- Quantidade entre 2 tiers → pega o maior aplicável (tier inferior)
- Quantidade acima do maior tier → maior tier
- `applyDiscount(100, 15)` = `85`
- `applyDiscount(100, 0)` = `100`

---

### 7. Custom Album CRUD — criação de álbum personalizado

**Arquivo alvo**: `src/app/api/albums/route.ts` (POST), `src/lib/custom-albums.ts`

**Por que crítico**: feature core do plano PRO. Parser de stickers tem regex + range parsing — alvo natural de bug.

**Cenários do parser** (em `parseStickers` ou similar):
- `"1-10"` → 10 stickers (`1, 2, ..., 10`)
- `"BRA1-BRA20"` → 20 stickers com prefixo
- `"1, 5, 10"` → lista discreta
- `"1-3, 7, BRA1-BRA2"` → mistura
- `""` → array vazio
- `"abc"` (lixo) → comportamento atual (erro? vazio?)
- Slug `custom_<nome>` único por seller

**Mock**: `prismaMock.customAlbum.{create,findMany,findUnique}`.

---

### 8. Inventory limits — `checkStickerLimit`

**Arquivo alvo**: `src/lib/plan-limits.ts`

**Cenários**:
- Plano FREE com 50 stickers → permite (limite 100)
- Plano FREE com 100 stickers → bloqueia (`allowed: false`)
- Plano PRO com 999 stickers → permite (limite 1000)
- Plano UNLIMITED → sempre permite (Infinity)
- Plano string desconhecida → fallback FREE (verificar comportamento atual)

**Mock**: `prismaMock.inventory.count`.

---

### 9. Bot HMAC — assinatura de requests do bot WhatsApp

**Arquivo alvo**: `src/lib/bot-hmac.ts`, `src/app/api/bot/*`

**Por que crítico**: ataque conhecido se HMAC quebrar. Conexão com bot WhatsApp = vetor de fraude.

**Cenários**:
- Request com assinatura HMAC válida → aceita
- Request sem header HMAC → 401
- Request com timestamp velho (replay) → 401 se houver janela
- Request com payload modificado mas assinatura antiga → 401

---

### 10. Sessão iron-session — `getSession()`

**Arquivo alvo**: `src/lib/auth.ts`

**Cenários**:
- Cookie de sessão válido → retorna seller hidratado do DB
- Cookie ausente → retorna sessão vazia
- Cookie expirado → retorna sessão vazia
- Cookie criptografado com `SESSION_SECRET` errado → retorna sessão vazia (não throw)
- Seller deletado mas cookie ainda válido → retorna sessão sem seller (graceful)

**Mock**: `prismaMock.seller.findUnique`.

---

## Plano de execução sugerido

**NÃO implementado neste skill** — é proposta. Humano decide quando rodar.

| Onda | Fluxos | Esforço estimado |
|---|---|---|
| 1 (puro) | 5, 6 | 1-2h — funções puras, sem mock complexo |
| 2 (lib + mocks já prontos) | 8, 10, 9 | 2-3h — Prisma mock já existe |
| 3 (rotas API) | 1, 7 | 3-4h — Zod + mocks |
| 4 (Stripe) | 2, 3 | 4-6h — fixtures + signature mock |
| 5 (integração) | 4 | 4-6h — junta tudo, mais frágil |

**Total**: ~14-21h de trabalho focado pra primeira leva. PR único e separado, zero mudança em código de produção. CI passa a rodar `npm run test` no `quality-gate.yml`.

---

## Antipadrões a evitar nesta rede

- **Não testar UI** nesta primeira leva. Testes de componente React precisam `jsdom` + Testing Library — environment hoje é `node`. Adicionar isso depois.
- **Não testar happy-path apenas**. Cada fluxo precisa do erro/edge.
- **Não corrigir bugs descobertos durante a escrita**. Anota em `BUGS_DESCOBERTOS.md`. Caracterização = capturar o que é, não o que devia ser.
- **Não escrever um teste por arquivo de produção**. Teste por **fluxo de negócio**, não por estrutura de pastas.
- **Não mockar `price-resolver.ts`** em testes de Order — é função pura, deixa rodar de verdade. Mocka só DB e Stripe.

---

## Próxima ação manual recomendada

Rodar `Skill: akita-tdd` quando começar a 1ª onda (fluxo 5 — `resolveUnitPrice` puro). É o caso mais simples pra calibrar o ciclo Red-Green-Refactor neste projeto.
