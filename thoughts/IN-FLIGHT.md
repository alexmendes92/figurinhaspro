---
tipo: indice-vivo
atualizado: 2026-05-17
mantido-por: skills /p8-master:pesquisa, /p8-master:plano, /p8-master:implementa
proposito: visibilidade de trabalho em curso entre sessões paralelas
---

# IN-FLIGHT — Trabalho em curso em P8-FigurinhasPro

> **Por que existe**: várias sessões Claude rodam em paralelo neste projeto. Sem este índice, uma sessão não sabe que outra está mexendo em `src/lib/price-resolver.ts` no mesmo dia. Resultado: rebase doloroso ou pior, pisar em cima silencioso.
>
> **Quando ler**: TODA sessão, no boot. Antes de criar pesquisa/plano/implementação nova, verificar:
> 1. Já existe artefato `ativo` cobrindo este tema? → reusar/atualizar, não duplicar.
> 2. Os arquivos que vou tocar aparecem em algum plano `ativo` de outra branch? → seção **Conflitos**.
>
> **Quando atualizar**: a skill que cria o artefato (`/p8-master:plano`, etc.) atualiza este arquivo no mesmo commit. Mudança de status (ativo → concluído → abandonado) também atualiza aqui.
>
> **Quando remover linha**: artefato chegou em `status: concluído` ou `abandonado` há mais de 7 dias. Mover pra seção **Histórico recente** no fim deste arquivo.

---

## 🟢 Planos ativos (tem código sendo escrito ou prestes a)

| Status | Plano | Branch | Arquivos-alvo principais | Criado |
|---|---|---|---|---|
| ativo | [Segurança de pedido](planos/2026-05-17-seguranca-pedido.md) | `fix/order-security` | `src/lib/quote-service.ts`, `src/lib/price-resolver.ts`, `src/app/api/orders/route.ts`, `src/app/api/bot/quote/route.ts`, `src/components/loja/store-album-view.tsx`, `src/components/loja/submit-order.tsx` | 2026-05-17 |
| ativo | [Fix gate pre-commit quebrado](planos/2026-05-17-fix-gate-precommit-quebrado.md) | `fix/order-security` | `src/lib/price-resolver.test.ts` (bloqueador descoberto) | 2026-05-17 |
| ativo | [Auth/Onboarding — fechar bugs bloqueantes](planos/2026-05-17-auth-onboarding-fechar-bugs-bloqueantes.md) | (definir — provavelmente `feat/auth-hardening`) | `src/lib/email.ts`, `src/lib/tokens.ts`, `src/emails/*`, `src/app/api/auth/{verify-email,forgot-password,reset-password,register,resend-verification}/route.ts`, `prisma/schema.prisma` | 2026-05-17 |
| ativo | [Cobertura de testes — preços 3 eixos](planos/2026-05-17-cobertura-testes-precos-3-eixos.md) | `prototype/modal-roi` | `src/lib/price-resolver.ts`, `src/__tests__/setup.ts`, `src/app/api/prices/**/route.test.ts`, `src/__tests__/helpers/request.ts` | 2026-05-17 |
| ativo | [Expansão funcional do `/painel` home](planos/2026-05-11-expansao-painel.md) | `prototype/modal-roi` | `src/app/painel/page.tsx`, `src/lib/album-helpers.ts`, `src/components/painel/{dashboard-my-albums,dashboard-quick-actions,album-stats-card}.tsx`, `prisma/schema.prisma` | 2026-05-11 |
| ativo | [Fechar 9 gaps UX + A11y restantes](planos/2026-05-10-fechar-9-gaps-restantes.md) | (definir) | `src/app/painel/layout.tsx`, `src/components/painel/painel-shell.tsx`, `src/lib/auth.ts`, `src/components/loja/store-album-view.tsx`, `src/components/painel/{inventory-manager,precos-album-editor}.tsx`, `src/app/painel/pedidos/page.tsx`, `src/lib/cart-context.tsx` | 2026-05-10 |
| ativo | [Fechar 3 gaps críticos de CRUD](planos/2026-05-10-fechar-gaps-criticos.md) | (definir) | `src/lib/quote-service.ts`, `src/lib/cockpit-guard.ts`, `src/lib/price-resolver.ts`, `src/lib/db.ts`, `src/lib/admin.ts`, `src/app/api/orders/route.ts`, `src/app/api/bot/quote/route.ts`, `src/app/painel/comercial/actions.ts`, `prisma/schema.prisma` | 2026-05-10 |

## 🟡 Planos em rascunho (não começou implementação)

| Status | Plano | Branch | Notas |
|---|---|---|---|
| rascunho | [Consolidar `PriceRule.albumSlug` (null ↔ `""`)](planos/2026-05-17-consolidar-priceRule-albumslug.md) | `prototype/modal-roi` | Toca `prisma/schema.prisma` + `src/lib/price-resolver.ts` — **alto risco de conflito** com plano de segurança de pedido e cobertura de testes |
| rascunho | [Loja pública — gaps B+C+D](planos/2026-05-17-loja-publica-gaps-bcde.md) | `prototype/modal-roi` | E descartado. Toca `src/components/loja/{store-album-view,store-sidebar,store-promo-row,use-modal-a11y}.tsx` |
| rascunho | [Melhorar estrutura `/painel/loja`](planos/2026-04-27-painel-loja-estrutura.md) | `master` (referência antiga) | Possivelmente substituído por planos mais recentes — **revisar antes de retomar** |

---

## ⚠️ CONFLITOS — arquivos tocados por +1 plano ativo

> Esta é a seção que **toda sessão DEVE ler** antes de codar. Mexer aqui sem coordenar = rebase certo.

### `src/lib/price-resolver.ts` — 5 planos
- `seguranca-pedido` (ativo, `fix/order-security`)
- `cobertura-testes-precos-3-eixos` (ativo, `prototype/modal-roi`)
- `fix-gate-precommit-quebrado` (ativo, `fix/order-security`)
- `consolidar-priceRule-albumslug` (rascunho, `prototype/modal-roi`)
- `fechar-gaps-criticos` (ativo, sem branch declarada)
- **Coordenação sugerida**: tratar `price-resolver.ts` como zona quente. Toda mudança aqui passa por rebase contra `prototype/modal-roi` (branch líder). Considerar agrupar os 5 planos numa epic ou serializar.

### `prisma/schema.prisma` — 5 planos
- `fechar-gaps-criticos`, `consolidar-priceRule-albumslug`, `cobertura-testes-precos-3-eixos`, `auth-onboarding-fechar-bugs`, `expansao-painel`
- **Coordenação sugerida**: schema é singleton — qualquer migração nova precisa estar consciente das outras 4. Idealmente, 1 PR por mudança de schema, mergeado em ordem antes de qualquer feature consumidora.

### `src/components/loja/store-album-view.tsx` — 3 planos
- `seguranca-pedido` (ativo), `loja-publica-gaps-bcde` (rascunho), `fechar-9-gaps-restantes` (ativo)
- **Coordenação sugerida**: `seguranca-pedido` (que está na branch ativa agora) toca esse arquivo por fire-and-forget submit. Loja-publica-gaps quer reorganizar componente. **Serializar** — segurança primeiro, depois reorganização.

### `src/lib/quote-service.ts` — 2 planos
- `seguranca-pedido` (ativo), `fechar-gaps-criticos` (ativo)
- **Coordenação sugerida**: ambos tocam o mesmo serviço. `seguranca-pedido` está na branch atual (`fix/order-security`) — entrar primeiro.

### `src/app/api/orders/route.ts` — 2 planos
- `seguranca-pedido`, `fechar-gaps-criticos`
- Mesma coordenação acima.

### `src/__tests__/setup.ts` — 3 planos
- `consolidar-priceRule-albumslug`, `cobertura-testes-precos-3-eixos`, `auth-onboarding-fechar-bugs`
- Arquivo de setup global de mocks (Prisma + Stripe). Adicionar mocks aqui é aditivo, mas dois planos pode editar mesma linha. **Coordenar via PR review**.

### `src/lib/auth.ts` — 1 plano + potencial conflito implícito
- `fechar-9-gaps-restantes` (ativo). Mas auth-onboarding-fechar-bugs toca **rotas** que dependem deste módulo — mudança de assinatura aqui quebra o plano de auth.

---

## 🔵 Pesquisas ativas (referência, sem código direto)

| Pesquisa | Branch | Resumo |
|---|---|---|
| [Auth + Onboarding — status](pesquisas/2026-05-17-auth-onboarding-status.md) | `prototype/modal-roi` | Base do plano `auth-onboarding-fechar-bugs-bloqueantes` |
| [Falhas factuais em Estoque e Preços](pesquisas/2026-05-17-falhas-estoque-precos.md) | `prototype/modal-roi` | Diagnóstico — feeds vários planos |
| [Loja pública — status por rota](pesquisas/2026-05-17-loja-publica-funcionalidades.md) | `prototype/modal-roi` | Base do plano `loja-publica-gaps-bcde` |
| [Preços 3 eixos — estado funcional](pesquisas/2026-05-17-precos-3-eixos-estado-funcional.md) | `prototype/modal-roi` | Base de `cobertura-testes-precos-3-eixos` + `consolidar-priceRule-albumslug` |
| [Expansão de funções no `/painel`](pesquisas/2026-05-11-painel-expansao-funcoes.md) | `prototype/modal-roi` | Base de `expansao-painel` |
| [10 melhorias + 5 features novas](pesquisas/2026-05-11-10-melhorias-5-features-novas.md) | — | Backlog de ideias — não ativo |
| [Caminho do usuário (vendedor + comprador)](pesquisas/2026-05-10-caminho-usuario.md) | — | Diagnóstico UX |
| [CRUD do `Inventory`](pesquisas/2026-05-10-inventory-crud.md) | `prototype/modal-roi` | Diagnóstico |
| [Todos os CRUDs de P8](pesquisas/2026-05-10-todos-os-cruds.md) | `prototype/modal-roi` | Inventário cross-feature |
| [Estrutura `/painel/loja`](pesquisas/2026-04-27-painel-loja-estrutura.md) | `master` (atrasado) | Antigo — pode estar desatualizado |

## 🟣 Reviews recentes (não bloqueiam mas servem de contexto)

| Review | Status |
|---|---|
| [`expansao-painel`](reviews/2026-05-11-expansao-painel.md) | aprovado-em-preview |
| [`painel-principal`](reviews/2026-05-11-painel-principal.md) | aprovado-em-prod-bug-dev-only |

---

## Branches que aparecem no projeto agora (varredura 2026-05-17)

| Branch | Planos vinculados | Observação |
|---|---|---|
| `fix/order-security` (atual, dirty) | `seguranca-pedido`, `fix-gate-precommit-quebrado` | Branch da sessão atual |
| `prototype/modal-roi` | 6 planos + 7 pesquisas | Branch dominante das últimas 2 semanas |
| `feat/auth-hardening` | — (nenhum plano declara essa branch no frontmatter!) | Branch que estava ativa há 6 minutos. **Suspeita**: trabalho de auth foi feito sem plano vinculado, ou plano não declarou branch. Conferir antes de prosseguir. |
| `master` | `2026-04-27-painel-loja-estrutura` (rascunho antigo) | Referência |

**Ação sugerida**: cada plano `ativo` sem `branch` declarada precisa receber a chave `branch:` no frontmatter. Sem isso o IN-FLIGHT não consegue prevenir conflito real.

---

## Como manter este arquivo vivo (contrato com as skills)

1. **`/p8-master:pesquisa <tema>`** — antes de criar pesquisa nova, faz Grep neste arquivo + nas pesquisas existentes por tema/escopo. Se já existe, atualiza em vez de duplicar.
2. **`/p8-master:plano <tema>`** — exige no Step 0: ler este arquivo, declarar `branch:` no frontmatter, adicionar linha em **Planos ativos**, e listar arquivos-alvo conhecidos na coluna correspondente. Se algum arquivo-alvo aparece em outra linha ativa, **abrir seção Conflitos** ou alimentar a existente.
3. **`/p8-master:implementa <plano>`** — não inicia se o plano não tem linha aqui. Quando termina (PR merge), move a linha do plano pra **Histórico recente** com `status: concluído`.
4. **Sessões manuais (sem skill)** — humano atualiza à mão quando souber. Pior que estar desatualizado é estar inexistente.

---

## Histórico recente (últimos 7 dias de finalizações)

_(vazio — popular conforme planos forem concluindo)_
