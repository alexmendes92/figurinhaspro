# Agent model routing — p8-master plugin

> Como o plugin distribui trabalho entre Opus 4.7, Sonnet 4.6 e Haiku 4.5 nos 11 agents bundled. Decisão arquitetural de 2026-05-10.

## Princípio

Cada agent tem `model:` declarado no frontmatter. A escolha não é "qual é o melhor disponível" — é **qual é o suficiente pra função do agent, considerando que o output pode alimentar outros agents**.

```
┌─────────────────────────────────────────────────────────────────┐
│ OPUS (caro, 4× Sonnet)    │ erro se PROPAGA pra outros agents   │
│ SONNET (médio, 5× Haiku)  │ julgamento LOCAL, output isolado    │
│ HAIKU (barato, default)   │ comando DETERMINÍSTICO, saída boole │
└─────────────────────────────────────────────────────────────────┘
```

## Distribuição atual (11 agents)

| Modelo | Effort | Agents | Função |
|---|---|---|---|
| **opus** | `high` | `arquiteto-estrategico` | Síntese big-picture, conexões entre fases, roteiro de evolução. Alimenta Marketing, Estrutura, Designer, Protótipo. |
| **opus** | `high` | `critico-adversarial` | Paralaxe cognitiva (narrativa do dono vs realidade), atacar premissas, gerar críticas adversariais antes de declarar fase completa. |
| **sonnet** | (default) | `analista-gerador` | Redação narrativa PT-BR estruturada — análise técnica, dores, comercial, personas, entrevista simulada. |
| **sonnet** | (default) | `pesquisador` | Pesquisa externa via WebSearch/WebFetch + síntese de tendências, concorrentes, best practices. Combate cutoff jan/2026. |
| **sonnet** | (default) | `p8-domain-expert` | Interpretação de semântica P8 — Stripe webhook signature, iron-session, plan-limits, Prisma Lazy Proxy. |
| **sonnet** | (default) | `revisor` | Revisão dupla: complexidade desnecessária + segurança. Detecção de vetores de ataque concretos. |
| **haiku** | — | `explorador` | Grep/Glob/Read no codebase P8. LOCALIZAR / ANALISAR / CAÇAR-PADRÕES. |
| **haiku** | — | `historiador` | Lookup em `thoughts/` e `output/` por tópico. Sintetiza decisões históricas. |
| **haiku** | — | `extrator` | Roda scripts Python (inventory.py, grep-evidence.py, load-prior-reports.py). Extração factual. |
| **haiku** | — | `qa-estrutural` | Roda `validate-frontmatter.py`, checa placeholders, seções obrigatórias. APROVADO/REPROVADO. |
| **haiku** | — | `deploy-watcher` | Polling status Vercel + tail logs primeiros 2 min + smoke 5xx. |

**Por modelo:** 2 Opus / 4 Sonnet / 5 Haiku. **Por proporção de chamadas em execução típica** (não count de agents): Haiku domina (~60% das invocações), Sonnet ~30%, Opus ~10%.

## Por que cada agent ficou onde está

### Os 2 Opus

**arquiteto-estrategico** consolida 5 sub-relatórios em narrativa única e desenha sistema ideal vs atual. Se a síntese tem viés (self-confirmation, otimismo, omissão de gap crítico), todos os passos seguintes da skill `oracle-analise` herdam o erro. Custo extra de Opus paga o resto da pipeline.

**critico-adversarial** existe pra forçar adversidade — manter narrativa A (dono vê) e B (realidade) em mente simultaneamente, apontar 3-5 ilusões cognitivas reais. Sonnet faz raso ("nenhuma divergência crítica encontrada") porque concorda demais com a síntese. Opus consegue divergir.

### Os 4 Sonnet

Pattern comum: **interpretação de input pra output coerente, sem dependência forte de outros agents**.

- `analista-gerador` recebe `inventory.json` (do extrator) + pesquisa de mercado (do pesquisador) e produz seção escrita. O output é consumido pelo user, não por outro agent — erros são localizados.
- `pesquisador` traz docs externas pra dentro. Síntese de WebSearch precisa de julgamento mas é local.
- `p8-domain-expert` responde "como funciona Stripe webhook em P8" com base em código real — interpretação local de domínio.
- `revisor` julga trade-offs de segurança e complexidade. Sonnet detecta padrões de risco; Opus seria overkill aqui.

### Os 5 Haiku

Pattern comum: **comando determinístico → saída checável**. Padrão Anthropic — built-in `Explore` agent já é Haiku.

- `explorador`: grep/glob no codebase. Resposta é "encontrei N matches em path X:linha Y". Não precisa de raciocínio.
- `historiador`: lookup em `thoughts/`. Mesma natureza.
- `extrator`: roda script Python, devolve JSON estruturado. Determinístico por design.
- `qa-estrutural`: roda `validate-frontmatter.py`, retorna pass/fail + lista de issues. Boolean check.
- `deploy-watcher`: curl + read log. Mecânico.

## Exemplo de pipeline 1 — `/p8-master:pesquisa <tópico>`

Sequencial mas barato:

```
Main (Opus) → roteia "pesquisa: como funciona Stripe webhook"
              ↓ (delega via Agent tool)
  explorador (Haiku) → grep "stripe.webhooks" em src/ → devolve 3 paths
              ↓
  p8-domain-expert (Sonnet) → interpreta padrões nesses 3 paths → devolve análise
              ↓
Main (Opus) → consolida em artefato thoughts/pesquisas/YYYY-MM-DD-stripe-webhook.md
```

**Custo aproximado:** 1 Opus (curto) + 1 Haiku (médio) + 1 Sonnet (médio) ≈ 30% do custo de Opus em tudo.

## Exemplo de pipeline 2 — `/p8-master:implementa <plano>`

```
Main (Opus) → lê plano, decide passos
              ↓
  explorador (Haiku) → confirma estado atual dos arquivos → ok
              ↓
Main (Opus) → escreve testes RED + código GREEN
              ↓
  revisor (Sonnet) → revisa diff (complexidade + segurança) → aprovado
              ↓
  qa-estrutural (Haiku) → valida que CHANGELOG/CLAUDE.md foram atualizados → ok
              ↓
Main (Opus) → commit atomico
```

## Exemplo de pipeline 3 — `/p8-master:oracle-analise` (heavyweight)

Aqui o roteamento brilha — sem ele, Oracle full run usaria Opus em tudo:

```
Main (Opus) → roteia Step 0
              ↓
  extrator (Haiku) → roda inventory.py + grep-evidence.py em paralelo → JSON
              ↓ (Phase 1 paralela com 3 streams)
  analista-gerador #1 (Sonnet) → análise técnica
  analista-gerador #2 (Sonnet) → funcionalidades + dores
  pesquisador (Sonnet)         → mercado + concorrentes
              ↓
  arquiteto-estrategico (Opus high) → consolida em sistema ideal + gaps
              ↓
  critico-adversarial (Opus high) → ataca premissas, gera críticas
              ↓
  qa-estrutural (Haiku) → valida frontmatter de output/01..06.md → pass
              ↓
Main (Opus) → README master + commit
```

**Sem roteamento:** ~8 calls Opus = caro. **Com roteamento:** 2 Opus (high) + 4 Sonnet + 2 Haiku ≈ 40% do custo, sem perda de qualidade nos pontos críticos.

## Override per-invocation

Se um caso específico precisa de modelo diferente do frontmatter, passo no `model:` da chamada Agent:

```typescript
Agent({
  description: "Síntese estratégica curta",
  subagent_type: "arquiteto-estrategico",
  model: "sonnet",  // downgrade pra esse caso específico
  prompt: "..."
})
```

A ordem de resolução documentada:

1. `CLAUDE_CODE_SUBAGENT_MODEL` env var
2. Per-invocation `model` param
3. Subagent frontmatter `model:`
4. Main session model

## Quando reabrir essa decisão

- Se Anthropic anunciar Haiku com effort levels (atualmente só Opus + Sonnet têm) → reavaliar se Haiku `effort: medium` substitui Sonnet em mais agents.
- Se Sonnet tier subir de capacidade (Sonnet 4.7+) → considerar mover `arquiteto-estrategico` pra Sonnet (recuperar Opus apenas pro `critico-adversarial`).
- Se métricas mostrarem Haiku falhando em `extrator` (parsing JSON complexo) → upgrade pontual pra Sonnet.

## Métricas a acompanhar

- Latência média de pipeline `pesquisa → plano → valida`
- Custo de `oracle-analise` full run (3 metrics: tokens Opus, Sonnet, Haiku)
- Taxa de fallback Anthropic (Opus → Sonnet quando hit usage threshold)
- Qualidade subjetiva da síntese big-picture (Alex flag se ficou raso)

Snapshot baseline: capturar próxima execução de `oracle-analise` pra comparar com versões futuras.
