---
fase: prototipo-definicao
gerado-em: 2026-04-29T00:40:00-03:00
versao: 1
projeto-alvo: C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro
agents-usados: [analista-gerador, arquiteto-estrategico]
status: completo
sumario: "Protótipo do modal de limite contextual com ROI (D5/H1) em branch isolada prototype/modal-roi. ~420 LOC novas, ~5 dias corridos (1.5-2d implementação + 2-3d coleta de feedback). Critério binário: ≥2 de ≥3 Rodrigos clicariam em 'Assinar PRO'. Protótipo NÃO altera código principal — branch nunca merged em master."
candidato-escolhido: C1-modal-roi
estrategia-isolamento: B-branch-isolada
hipotese-alvo: H1
branch-prototipo: prototype/modal-roi
prox-fase: prototipo-criacao
duracao-estimada: ~5 dias corridos
loc-novas: ~420
arquivos-novos: 6
codigo-principal-alterado: false
---

# Definição de Protótipo — P8-FigurinhasPro

> Define **o que será o protótipo e onde mora** — sem tocar no código principal. Derivado de Geral (`output/01`) + Marketing (`output/02`) + Estrutura (`output/03`) + Designer (`output/04`).

## Sumário Executivo

O protótipo escolhido é o **modal de limite contextual com ROI** (Candidato 1, derivado da direção D5 do Designer §4) que valida a **hipótese H1**: "modal contextual com ROI converte FREE→PRO mais que pricing genérico". A escolha é fundamentada em 3 fatores cruzados: (1) com **zero tração confirmada** hoje (`output/02 §4`), o risco mais caro de errar é a mensagem de upsell que sustenta o PR-F do Designer (caminho crítico de receita antes da Copa); (2) o modal é **completamente isolável** — não depende de auth, Prisma, Stripe ou telemetria; (3) feedback qualitativo de 3-5 Rodrigos reais via WhatsApp DM responde em 2-3 dias se a copy ressoa.

A estratégia de isolamento escolhida é **Opção B — branch isolada `prototype/modal-roi`** (não pasta `prototype/` nem repo paralelo). 5 motivos: aproveita Tailwind 4 + Geist + componentes existentes sem replicar setup; Vercel preview URL automática vira canal de validação via WhatsApp DM; drift com master é gerenciável com rebase enquanto vazamento em produção exige hotfix público; janela 6 semanas + fundador solo favorece reuso máximo; workspace ArenaCards já tem 13 projetos.

**Regra inviolável reforçada:** o protótipo **NÃO altera código principal**. Branch isolada nunca é merged em `master`. Qualquer reaproveitamento visual no PR-F real é copy-paste manual revisado, não cherry-pick automático.

**Custo total:** ~420 LOC novas em 6 arquivos, ~10-12h de implementação (1.5-2 dias úteis a 3h/dia), + 2-3 dias corridos de espera por feedback dos Rodrigos via WhatsApp = **~5 dias corridos** se respostas chegarem em <48h. Se H1 invalida, branch é deletada imediatamente e PR-F do Designer fica bloqueado até nova hipótese ser validada.

## 1. Justificativa do protótipo

### a. Maior gap real → ideal (do 01)

Os 14 gaps de §18 da Geral não têm peso igual. 3 candidatos têm maior custo-por-unidade-de-incerteza:

**G2 — `/api/bot/quote` aceita `unitPrice` falsificado e não decrementa inventário (Crítico)**

O handler aceita `unitPrice` do payload externo, calcula `totalPrice` sem chamar `resolveUnitPrice`, cria `Order` com esse preço, nunca decrementa `Inventory.quantity`. Bug paradoxal: GET `/api/bot/stickers` chama `resolveUnitPrice` corretamente; POST esqueceu. Rodrigo (alvo PRO) pode estar vendendo a mesma figurinha duas vezes a preço arbitrário sem saber. **Incerteza:** o estado atual de dados — existe algum `Order` com preço distorcido em prod? Se sim, qualquer MRR reportado é irreal.

**G7 — Sem telemetria custom (Alto)**

Vercel Analytics e Speed Insights instrumentados apenas para pageviews. Nenhum evento de negócio. 24 handlers engolem erro com `console.error`. Sentry tem 0 chamadas a `captureException` em `src/`. Sem `plan_limit_hit`, MRR automatizado, churn — toda decisão de PR-F (modal de limite contextual com ROI) é baseada em persona simulada, não sinal real. **Incerteza:** `telemetry.ts` precisa existir antes de PR-F disparar `plan_limit_hit`.

**GD4 / G10 — Onboarding 772 LOC faz Camila desistir (Alto)**

Wizard multi-step com Step 0 informativo puro. Rodrigo tolera, mas tempo até primeira figurinha é desconhecido (G7 fecha antes de medir). **Incerteza:** parcialmente de produto (single-page ativa mais rápido?), parcialmente de mensuração (sem baseline, comparação cega).

### b. Direção de design escolhida (do 04)

Recap: **D1 + D3 + D5** combinadas, em 7 PRs. Caminho crítico: **PR-F** (D5 receita — pricing redesign + modal contextual com ROI + re-ativar plan limits).

3 hipóteses centrais (`output/04 §6`):

- **H1:** modal contextual com ROI converte FREE→PRO mais que pricing genérico (target CTR ≥25%)
- **H2:** onboarding single-page + checklist persistente reduz desistência D0 vs wizard 5-passos (target ativação ≥60% em 7d)
- **H3:** re-ativar plan limits durante Copa não cria atrito desproporcional com sellers FREE atuais

**Custos de teste comparados:**

- **H1** é **mais barata de testar** via protótipo. UI isolável, sem banco real, sem telemetria. 3-5 Rodrigos via DM, feedback em 48h.
- **H2** é **mais cara de testar em produção** porque critério "pronto" real é temporal: 7 dias de dados + ≥N signups. Sem telemetria + sem baseline = comparação cega. Mesmo com protótipo, validar H2 exige semanas de coleta.
- **H3** não é testável via protótipo de UI. Depende de query de auditoria + lógica de grandfathering. Custo: <1d, validação binária.

### c. Mudança estrutural mais arriscada (do 03)

Trade-off #1 declarado em `output/03 §3.c`: **Fase 1 fecha G2 antes da suite completa de testes (G6)**. Viola TDD canônico em troca de fechar bug de receita ativo antes da Copa. Refactor de `/api/bot/quote` para chamar `quote-service.ts` (com `resolveUnitPrice + tx + decrement`) sem rede de testes consolidada. Se quebra, Rodrigo recebe erro silencioso ao tentar criar pedido via bot — exatamente o que o produto promete resolver.

**Pergunta:** protótipo de `quote-service.ts` (caminho 1, alto risco técnico, fecha gap crítico) ou modal contextual com ROI (caminho 2, valida hipótese de produto)?

Resposta: depende do que está bloqueando mais. **Análise comercial de `output/02 §4` é direta: "tração mensurável a partir do código não existe" — sellers pagantes confirmados: 0.** Com zero tração confirmada, risco de G2 em produção é teórico (sem Rodrigo real usando o bot, preço falsificado não está sendo explorado). Risco de H1 falhar é existencial: se a mensagem de ROI não ressoa, PR-F é construído sobre suposição inválida.

### d. Candidatos a protótipo

**Candidato 1 — Modal de limite contextual com ROI (D5 / H1)** — RECOMENDADO

Modal isolável: não precisa de banco, Sentry ou plan limits ativos. Rota Next isolada em `/proto/modal-roi` recebe query params (`?usage=87&limit=100&priceAvg=12.50`) e renderiza com ROI calculado client-side. Fundador mostra URL pra 3-5 Rodrigos do Canal 2 de Marketing.
- **Critério "pronto" binário:** link público abrindo modal mockado, renderizando 375px e 1280px, CTA visível sem scroll, 5 telas Playwright capturadas.
- **Custo:** P (1-2d).
- **Validação qualitativa:** 3 Rodrigos respondem "clicaria?" — se 2 de 3 dizem sim, H1 tem sinal suficiente para PR-F avançar.

**Candidato 2 — Onboarding single-page (D3 / H2)**

Rota isolada `/proto/onboarding` com formulário único + validação de slug em tempo real (regex, sem DB). Ao clicar "Criar minha loja →", navega para `/proto/painel` com checklist mockado.
- **Critério "pronto":** fluxo navegável (landing → form → painel mock) em 375px e 1280px, tempo do toque até painel <2s, screenshots Playwright.
- **Custo:** P-M (2-4d).
- **Limite:** valida percepção de fluidez, não taxa de ativação real. Para "single-page ativa 60% em 7d", precisa produção com telemetria.

**Candidato 3 — `quote-service.ts` com characterization tests**

Antes de tocar `bot/quote/route.ts`, escrever testes do comportamento atual (happy path + 3 casos de borda). Verdes com código atual. Depois criar `quote-service.ts`. Depois refatorar handler. Mesmos testes verdes + novos validando `resolveUnitPrice` + `Inventory.decrement`.
- **Critério "pronto":** `npm run test` verde com ≥4 casos cobrindo contrato atual + ≥2 casos cobrindo service.
- **Custo:** M (3-5d).
- **Risco:** médio — exige entender comportamento exato sem documentação.

**Recomendação afirmativa: Candidato 1, sem hesitação.** Com zero tração confirmada e janela Copa em ~6 semanas, a pergunta mais cara de errar é "a mensagem de ROI converte?". Se a resposta é não, o PR-F é construído sobre suposição inválida e 4 dias de trabalho viram risco de produto. Candidato 1 responde em 2 dias com link enviável, sem tocar uma linha do código principal.

Sequência: **C1 (H1, 1-2d) → feedback (3-5 Rodrigos, 1-2d) → se H1 confirmada, PR-F em paralelo com C2 (H2) → C3 quando primeiro Rodrigo real ativo no bot.**

## 2. Estratégia de isolamento

> ⚠️ **REGRA INVIOLÁVEL:** o protótipo **NÃO altera o código principal** do projeto-alvo. As 3 opções abaixo respeitam essa regra, mas com diferentes níveis de risco de violação acidental. A opção escolhida (B — branch isolada) é a mais conservadora dado o stack e a janela.

### a. As 3 opções

#### Opção A — Pasta separada `prototype/` dentro do mesmo repo

Estrutura: `C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro\prototype\<nome>\`

**Prós específicos de P8:**
- Mantém `package.json` único — zero reinstalação das ~800 deps
- Aproveita `src/lib/price-resolver.ts` via import `@/lib/*`
- Geist fonts + tema dark já carregados via `globals.css`
- Hooks pré-commit aplicam ao repo inteiro — protótipo passa pelo mesmo gate
- Custo de descarte trivial (`rm -rf prototype/`)

**Contras específicos:**
- **Risco real de vazar em produção:** se `prototype/app/page.tsx` for criado, Next 16 detecta a rota automaticamente (App Router) e `vercel deploy --prod` serve em produção. Exige patch em `next.config.ts` ou `.vercelignore` — passo extra fácil de esquecer.
- `npx tsc --noEmit` do hook pré-commit cobre repo inteiro — TSX mal tipado em `prototype/` bloqueia commits do `master`
- Polui git history do projeto principal
- Branch `master` está dirty agora — adicionar `prototype/` aumenta confusão visual em `git status`

#### Opção B — Branch isolada `prototype/<nome>`

Comando: `git stash` (por causa do dirty atual) → `git checkout -b prototype/modal-roi`

**Prós específicos de P8:**
- Reaproveita 100% do setup: Prisma client gerado, mocks Vitest em `src/__tests__/setup.ts` (18 modelos + Stripe), env vars Zod-validadas, componentes `auth/*`
- Vercel preview URL automática por push em branch — canal natural de validação via WhatsApp
- Hooks pré-commit funcionam normalmente
- `git branch -D prototype/<nome>` apaga sem cerimônia

**Contras específicos:**
- **Drift com master é risco concreto:** PR-A/PR-B do Designer roteiro evoluem master em paralelo. Janela 6 semanas + 3h/dia = branch pode ficar 5-15 commits atrás
- `master` está dirty — exige `git stash` ou commit antes
- Hooks pré-commit obrigam protótipo a passar `npm run build` completo a cada commit (~30-60s)

#### Opção C — Repo paralelo `P8-FigurinhasPro-prototype/`

Estrutura: `C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro-prototype\` ao lado dos 13 projetos

**Prós específicos de P8:**
- Zero acoplamento com produção — impossível vazar
- Stack pode ser drasticamente menor: Vite + React + Tailwind 4 puro
- Deploy independente
- Não dispara hooks pré-commit do P8

**Contras específicos:**
- **Replicar visual exige trabalho real:** Tailwind 4 com `@theme inline`, Geist fonts, paleta dark, componentes `auth/*` (10 arquivos) — copy-paste manual 2-4h
- **Inviável pro Candidato 3:** test precisa de Prisma client + schema completo + setup Vitest com 18 mocks
- Polui workspace que já tem 13 projetos
- Lógica de ROI exige duplicar `price-resolver.ts` ou mockar com fidelidade reduzida
- Promover de volta vira copy-paste manual com risco de divergência

### b. Comparação P8-específica

| Eixo | A. Pasta `prototype/` | B. Branch `prototype/<nome>` | C. Repo paralelo |
|---|---|---|---|
| Setup inicial | 5-10 min | 10-15 min (stash + checkout) | 2-4h (replicar Tailwind+Geist+auth) |
| Risco de vazar em prod | Médio (rota Next em `prototype/app/` é servida) | Baixo (branch separado) | Zero |
| Reaproveita `src/lib/price-resolver.ts` | Sim | Sim | Não (copiar ou mockar) |
| Reaproveita `src/components/auth/*` | Sim | Sim | Não |
| Reaproveita Prisma + Vitest setup | Sim | Sim | Inviável |
| Drift com master em janela 6 sem | Nenhum | Alto | Nenhum |
| Vercel preview URL automática | Precisa config explícita | Sim | Sim com Vercel project novo |
| Hooks pré-commit aplicáveis | Sim | Sim | Não |
| Custo de descartar | `rm -rf prototype/` | `git branch -D` | Apagar pasta + Vercel project |
| Custo de "promover" pro principal | Baixo (mover arquivos) | Médio (cherry-pick + resolver drift) | Alto (copy-paste + adaptar Vite→Next) |
| Compatível com `quote-service.ts` (C3) | Sim (com hook chiando) | Sim (ideal) | Não |
| Compatível com Modal ROI (C1) | Sim | Sim | Sim com mock |
| Compatível com Onboarding (C2) | Sim | Sim | Sim com 2-4h replicando auth/* |

### c. Recomendação por candidato

**Candidato 1 — Modal de limite contextual com ROI:** **Opção B**. Preview URL Vercel facilita mostrar pra Rodrigos no WhatsApp.

**Candidato 2 — Onboarding single-page:** **Opção B**. Onboarding usa `auth-input`, `auth-button`, `auth-logo` — replicar em C exigiria 2-4h só pra ficar visualmente equivalente.

**Candidato 3 — `quote-service.ts` com tests:** **Opção B obrigatória**. Tests dependem de Prisma client + schema + setup Vitest. C é inviável.

### d. Recomendação geral afirmativa

**Opção B (branch isolada) como caminho único pros 3 candidatos.**

5 motivos:
1. Os 3 candidatos precisam de código real do P8 — isolamento total (C) é hostil ao trabalho
2. Drift com master é gerenciável (rebase); vazamento em prod não é (hotfix público)
3. Vercel preview URL é canal natural de validação H1/H2 — Rodrigo recebe link no WhatsApp
4. Janela 6 sem + 3h/dia favorece reuso máximo
5. Workspace ArenaCards já tem 13 projetos — adicionar 14º polui mais

**Pré-requisitos antes de executar B:**
- Resolver dirty atual de master: commit `chore: artefatos de análise` ou `git stash` antes de criar branch
- Confirmar em `vercel.com/album-digital` que preview deployments de branch estão habilitados
- Aceitar overhead dos hooks pré-commit (test+tsc+build, ~1-2 min). Não usar `--no-verify` (viola regra global).

**Decisão do operador no DECISION POINT:** **Candidato 1 (Modal ROI) + Opção B (branch isolada `prototype/modal-roi`)**.

## 3. Escopo mínimo do protótipo

### a. Arquivos/módulos que entram

Branch isolada `prototype/modal-roi`. Tudo novo, **nada toca código principal** (`src/app/painel/*`, `src/lib/plan-limits.ts`, `src/lib/auth.ts`, etc).

| Arquivo | Tipo | Propósito | LOC |
|---|---|---|---|
| `src/app/proto/modal-roi/page.tsx` | NEW | Rota Next isolada. Lê query params (`denied`, `priceAvg`, `variant`) e renderiza modal em fundo simulado. Default: `denied=15&priceAvg=12.50&variant=v1`. | ~80 |
| `src/components/proto/plan-limit-modal-preview.tsx` | NEW | Componente standalone — header, número grande (denied), GMV calculado (`denied * priceAvg`), CTA amber, link secundário. Mobile-first 375px, scale-up 1280px. Props: `{ denied, priceAvg, variant }`. | ~120 |
| `src/app/proto/modal-roi/[variant]/page.tsx` | NEW | Rota dinâmica para variantes nomeadas (`/v1` a `/v5`). Usa `await params` (Next 16). | ~40 |
| `src/components/proto/copy-variants.ts` | NEW | Map de 5 variantes: V1 "R$ 49/mês" (controle), V2 "R$ 1,60/dia", V3 "menos que 2 pacotes/mês", V4 "ROI em 4 vendas", V5 header com escassez ("Copa termina em X dias"). | ~50 |
| `src/app/proto/modal-roi/galeria/page.tsx` | NEW | Galeria com 5 variantes lado a lado (uso interno do fundador). | ~60 |
| `prototype/modal-roi/README.md` | NEW | Instruções operacionais: URLs por variante, parâmetros, roteiro de 3 perguntas pra DM, como gerar screenshot, como deletar branch. | ~70 |

**Total:** ~420 LOC novas. Reaproveita Tailwind 4 + `globals.css` (Geist Sans, dark theme) automaticamente.

### b. Mocks vs implementação

| Item | Status | Observação |
|---|---|---|
| Modal UI (layout, tipografia, cores, animação de entrada) | **Implementado** | Tailwind 4, mobile-first 375px, dark do projeto. `transition-opacity` simples (sem libs novas). |
| Cálculo de ROI (`denied × priceAvg`) | **Mockado** | Client-side a partir de query params. Nada vem de DB. |
| 5 variantes de copy | **Implementadas como dados estáticos** | `copy-variants.ts` exporta map. Sem A/B framework, sem flag service. |
| Persistência (sessão, evento de impressão, conversão) | **Não aplicável** | Validação qualitativa via DM. |
| Auth/proteção de rota | **Mock — rota pública** | Security by obscurity. README pede pra fundador não indexar. |
| Importar `@/lib/price-resolver` | **NÃO importar** | Tentação de "deixar realista" — protótipo é mock. Importar puxa Prisma e quebra build standalone. |
| Stripe Checkout no clique de "Assinar PRO" | **Mock — alert + log** | `onClick` dispara `alert('Você clicaria aqui — obrigado pelo feedback!')` + `console.log({...})`. Não redireciona. |
| Telemetria `plan_limit_hit` | **Não aplicável** | Feedback qualitativo via WhatsApp. |
| Screenshot mobile/desktop | **Implementado via Playwright MCP** | 5 variantes × 2 viewports = 10 capturas em `prototype/modal-roi/screenshots/`. |
| Background simulando painel real | **Mock estático** | Div com blur + pseudo-cards. Sem reproduzir `/painel` de verdade. |

### c. Critério "pronto" — binário

**O protótipo está pronto quando todos os checkboxes estiverem marcados:**

- [ ] Branch `prototype/modal-roi` criada a partir de `master` limpo, push'ada para origin
- [ ] Vercel preview URL ativa e acessível (`https://album-digital-git-prototype-modal-roi-<hash>.vercel.app`)
- [ ] URL base `<preview>/proto/modal-roi?denied=15&priceAvg=12.50` renderiza modal sem console error em 375px e 1280px
- [ ] 5 variantes acessíveis via `<preview>/proto/modal-roi/v1` até `/v5`, cada uma com copy distinta
- [ ] Galeria interna `<preview>/proto/modal-roi/galeria` mostra as 5 lado a lado (uso do fundador)
- [ ] 10 screenshots Playwright capturados (5 × 2 viewports) salvos em `prototype/modal-roi/screenshots/`
- [ ] README com URLs, roteiro de DM e instruções de descarte commitado na branch
- [ ] Fundador enviou link via WhatsApp DM para ≥3 Rodrigos do Canal 2 de Marketing
- [ ] Feedback de ≥3 Rodrigos coletado (resposta a "você clicaria?" + justificativa em texto livre)

**Frase de validação binária:**

> **H1 valida sim** se ≥2 dos ≥3 Rodrigos consultados respondem "clicaria" sob qualquer das 5 variantes (anotar qual variante venceu).
>
> **H1 valida não** se ≥2 dos ≥3 respondem "não clicaria" mesmo na melhor variante, OU justificativa dominante é "R$ 49 ainda é caro mesmo com a conta de R$ 187,50" (sinal forte pra rever copy ou pricing antes do PR-F).
>
> **Indeciso** (1 sim / 1 não / 1 talvez) → mais 2 Rodrigos antes de decidir, não inferir.

### d. Tempo estimado: P (≤3 dias úteis de implementação + 2-3 dias de coleta = ~5 dias corridos)

Premissa: 1 dev em foco total, 3h/dia úteis, Tailwind 4 + Geist já configurados.

| Etapa | Estimativa |
|---|---|
| Pré-condições (commit dirty + verificar Vercel preview) | 30 min |
| Setup branch + push inicial vazio + confirmar preview URL | 30 min |
| `plan-limit-modal-preview.tsx` (componente Tailwind, 5 variantes via prop) | 3-4h |
| `page.tsx` (rota base com query params) | 1h |
| `[variant]/page.tsx` + `copy-variants.ts` (5 copy distintas) | 1.5h |
| `galeria/page.tsx` (grid das 5 variantes) | 1h |
| Validação visual via Playwright + 10 screenshots | 1.5-2h |
| README com instruções, URLs, roteiro de DM | 45 min |
| Commit atômico + push + verificar preview Vercel | 30 min |
| **Subtotal implementação** | **~10-12h = 1.5-2 dias úteis** |
| Outreach via WhatsApp (5-7 sellers para garantir ≥3 respostas) | 30 min envio + 2-3 dias espera |
| Coleta + tabulação do feedback | 1h |

**Total realista:** ~5 dias corridos se Rodrigos respondem em <48h. Se demorarem, beira M (até ~1 semana). Se ninguém responde em 5 dias úteis: revisitar Canal 2 ou trocar pra Canal 1 (sellers já cadastrados).

**Risco de estouro:** Tailwind 4 às vezes exige `@theme inline` extra para tokens novos (amber custom) — se for o caso, +1h. Sentry pode capturar erro de rota standalone — desativar em `/proto/*` se aparecer.

### e. Pré-condições antes de `git checkout -b prototype/modal-roi`

1. **Resolver dirty de `master`.** Decisão binária:
   - **Opção A (recomendada):** commit `chore: artefatos de análise oracle` agrupando `output/`, `akita/`, `thoughts/`, `AUDIT.md`, `BUGS_DESCOBERTOS.md`, `CHARACTERIZATION_TESTS.md`, `CIRURGIA_CANDIDATES.md`, `AGENTS.md.gaps.md`, `product-snapshot.md`, `perplexity.log`, `scripts/spec-metadata.sh`, `scripts/thoughts-sync.sh`. Adicionar `.claude/worktrees/` e `.claude/settings.json.bak` ao `.gitignore` antes.
   - **Opção B:** `git stash push -u -m "artefatos oracle"`.
   - Confirmar: `git status` retorna clean antes de criar branch.

2. **Verificar Vercel preview de branch.** Acessar `vercel.com/<team>/album-digital/settings/git`. Confirmar que **"Preview Deployments"** está habilitado para todas as branches. Se desabilitado, habilitar antes de push.

3. **Lista de 5-7 Rodrigos pra DM.** Identificar sellers ativos OU prospects de grupos WhatsApp Copa 2026 (Canal 2). Mínimo 5 para folga (taxa de resposta cold ~60% → 5 envios → ~3 respostas).

4. **Roteiro de 3 perguntas finalizado** (sem viés de produto):
   - "Oi [nome], tudo bem? Tô validando uma ideia de produto pra quem vende figurinhas. Você ainda tá vendendo Copa 2026?"
   - "Se você visse esse modal [link da variante] aparecendo enquanto cadastra figurinhas, você clicaria em 'Assinar PRO'? (sem certo/errado, queria sua reação honesta)"
   - "Por quê? O que te fez clicar / não clicar?"
   - **Não incluir:** "achou bonito?", "o que mudaria?" (puxa pra design, não pra decisão de compra).

5. **Plano B se H1 invalidar.** Se ≥2 Rodrigos disserem "R$ 49 ainda é caro": testar antes de descartar — V6 "Pague apenas quando cobrir o investimento" (trial 14 dias) ou V7 "Plano BÁSICO R$ 19/mês com 250 figurinhas". Documentar essas variantes de fallback aqui antes de começar.

6. **Confirmar que Sentry não vai capturar `/proto/*` como erro** (`next.config.ts` ou `instrumentation.ts` — se Sentry estiver agressivo, adicionar `/proto/*` ao `ignoreTransactions`).

### f. Critério de descarte do protótipo

**Regra inviolável:** branch `prototype/modal-roi` **nunca** é merged em `master`. Validação ou invalidação de H1 não muda isso — protótipo serve apenas para alimentar decisão de PR-F (modal real, com auth + Prisma + telemetria).

**Caminhos pós-validação:**

- **H1 valida positivamente** (≥2 Rodrigos clicariam):
  - Branch fica em "shelf" (não deletada por 30 dias)
  - PR-F do Designer é criado em **branch nova** `feat/plan-limit-modal-prod`, partindo de `master`, usando `prototype/modal-roi` apenas como referência visual (copy-paste manual, não cherry-pick)
  - Resultado documentado: variante vencedora, justificativa que mais convenceu, citações dos Rodrigos
  - Após PR-F merged em master e em produção por ≥7 dias, deletar `prototype/modal-roi` local e remoto

- **H1 invalida** (≥2 Rodrigos não clicariam):
  - Branch deletada imediatamente: `git branch -D prototype/modal-roi` + `git push origin --delete prototype/modal-roi`
  - Feedback registrado: justificativa dominante, qual variante chegou mais perto, hipótese H1 marcada como **rejeitada** com data
  - PR-F do Designer **não acontece** sem nova hipótese alternativa validada (ex: H1' = "trial 14 dias converte mais que pricing"). Voltar para Step 2 da Definição de Protótipo com nova hipótese

- **Resultado indeciso após 5 Rodrigos** (1-1-1 ou 2-2-1):
  - Branch fica em "shelf" por 14 dias
  - Fundador faz mais 3-5 entrevistas (Canal 1, sellers já cadastrados FREE) antes de decidir
  - Se ainda indeciso após 8-10 respostas: marca H1 como **inconclusiva** e segue priorização sem decisão de PR-F (não força produção sem sinal)

**Em todos os casos: zero código de `prototype/modal-roi` chega em produção.** Qualquer reaproveitamento visual em PR-F é manual e revisado, não merge automático.

## 4. Relatório executivo

**Decisão central:** protótipo do **modal de limite contextual com ROI** (D5/H1) em **branch isolada `prototype/modal-roi`**. ~420 LOC novas em 6 arquivos, ~5 dias corridos (1.5-2 dias implementação + 2-3 dias coleta).

**Por que H1 e não H2/H3 ou G2:**
- **H1 é a hipótese mais barata de testar e mais cara de errar.** UI isolável, feedback em 48h via WhatsApp DM. Se inválida, PR-F (caminho crítico de receita) é construído sobre suposição inválida.
- **H2 exige produção + telemetria** para validar de verdade — protótipo só responde "parece mais rápido?", não "ativa 60% em 7d?".
- **H3 é uma query de auditoria**, não um protótipo de UI.
- **G2 (refactor `quote-service.ts`)** é gap crítico, mas com zero tração confirmada hoje, o bug afeta usuários teóricos. Validar a mensagem que vai trazer o primeiro Rodrigo é anterior na cadeia causal.

**Por que branch isolada e não pasta separada ou repo paralelo:**
- Reusa Tailwind 4 + Geist + componentes existentes sem replicar setup
- Vercel preview URL automática é canal natural de validação via WhatsApp
- Drift com master se conserta com rebase; vazamento em produção exige hotfix público
- Workspace ArenaCards já tem 13 projetos — adicionar 14º polui mais

**Pré-requisitos críticos** (ordem):
1. Resolver dirty de `master` (commit `chore: artefatos` ou `git stash`)
2. Verificar Vercel preview de branch habilitado
3. Lista de 5-7 Rodrigos para DM
4. Roteiro de 3 perguntas sem viés de produto

**Critério de pronto binário:** ≥2 de ≥3 Rodrigos consultados respondem "clicaria em Assinar PRO" sob qualquer das 5 variantes de copy. Indeciso = mais 2 entrevistas.

**Caminhos de descarte:**
- **H1 sim** → PR-F nasce em branch nova partindo de `master` com referência visual do protótipo (copy-paste manual). Branch protótipo deletada após PR-F em produção há ≥7 dias.
- **H1 não** → branch deletada imediatamente. PR-F bloqueado até nova hipótese validada.
- **Indeciso** → mais entrevistas. Se persistir, H1 marcada como inconclusiva e PR-F não força sem sinal.

**Próxima fase Oracle:** `/oracle:criacao-prototipo` — implementa o protótipo nesta definição com plano + execução + verificação + validação. Pré-requisito: este `output/05-prototipo-definicao.md` (✅).

> **⚠️ Nota crítica:** a fase `/oracle:criacao-prototipo` é a **primeira do Oracle que mexe em código de verdade**. Todas as fases anteriores (01-05) foram análise. Pausar antes de invocá-la é a recomendação padrão — fundador revisa este relatório, ajusta escopo se necessário, depois dispara.
