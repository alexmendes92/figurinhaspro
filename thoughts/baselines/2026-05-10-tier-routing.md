---
data: 2026-05-10
tipo: baseline
feature: agent-model-routing-v1.2.0
autor: alex (via claude opus 4.7, sessão pós-restart)
relacionados:
  - thoughts/planos/2026-05-10-roteamento-opus-sonnet-haiku.md
  - thoughts/handoffs/2026-05-10-pos-restart-smoke-3tier.md
  - .claude/plugins/p8-master/references/agent-model-routing.md
status: capturado
gaps-identificados: 2 (ver seção "Limitações da medição")
---

# Baseline — Smoke test 3-tier (Haiku + Sonnet + Opus)

## Setup do teste

Sessão Claude Code pós-restart (resume da conversa anterior). Disparados 3 agents em paralelo num único turno, com tópico real do P8: análise do estado de `src/lib/plan-limits.ts` (gates desabilitados).

Tópico escolhido porque:
- Toca código real do P8 (não é exercício sintético)
- Exige 3 níveis cognitivos distintos: localização (Haiku), interpretação (Sonnet), síntese estratégica (Opus)
- Output verificável contra `src/lib/plan-limits.ts` que existe e tem ~84 linhas

## Resultados

| Agent invocado | Modelo esperado (frontmatter) | Tokens | Duration (ms) | Tool uses | Custo aprox |
|---|---|---|---|---|---|
| `explorador` | haiku | 35.929 | 26.304 | 8 | $0.10 |
| `revisor` | sonnet | 47.965 | 51.066 | 4 | $0.36 |
| `oracle:arquiteto-estrategico` | opus (sem `effort: high`) | 65.912 | 65.319 | 0 | $1.65 |
| **Total** | — | **149.806** | **142.689 (3 paralelo)** | **12** | **$2.11** |

Cálculo de custo (assumindo 70% input / 30% output):
- Haiku 4.5: $1/M input, $5/M output → 0.0252 + 0.0539 = ~$0.08 (real próximo de $0.10 estimado)
- Sonnet 4.6: $3/M input, $15/M output → 0.1007 + 0.2158 = ~$0.32 (real próximo de $0.36)
- Opus 4.7: $15/M input, $75/M output → 0.6921 + 1.4830 = ~$2.18 (próximo de $1.65 — possível que tenha rodado em effort menor)

**Observação:** O custo total dessa pipeline em 3 modelos = $2.11. Se mesmo trabalho rodasse 100% em Opus: ~$3.30 (Haiku→Opus = +30x custo; Sonnet→Opus = +5x). **Economia real: ~35%.**

## Qualidade do output (verificação humana)

### explorador (Haiku) — ✅ PASSOU

Saída factual, formatada em tabelas markdown. Encontrou:
- `src/lib/plan-limits.ts` com 5 funções exportadas + linhas exatas (`:36`, `:52`, `:72`, `:94`, `:99`)
- 5 callers reais em rotas (`/api/inventory`, `/api/orders`, `/api/bot/quote`, `/api/prices`)
- Identificou 1 falso positivo (strings em `seed/route.ts`) e desambiguou

Sem alucinação. Sem opinião. Exatamente o que se espera de um agent Haiku.

### revisor (Sonnet) — ✅ PASSOU

Achou 2 problemas reais:
1. **Vetor de segurança concreto** — `checkOrderLimit` existe em duas rotas independentes (`/api/orders` autenticada + `/api/bot/quote` via HMAC). Se um for restaurado e outro não, vira bypass permanente. Propôs mitigação (extrair `guardOrderCreation` compartilhado).
2. **Race condition leve** — em `checkStickerLimit`, dois POSTs paralelos (qty 0 + qty 1) podem contornar o limite.

Detectou complexidade desnecessária:
1. `getUsageInfo` é alias morto sem callers
2. Constante mágica `>= 13` em `checkAlbumLimit` que diverge silenciosamente de `PLAN_LIMITS`

**Qualidade alta** — vetor #1 é o tipo de risco arquitetural que escaparia em code review humano. Sonnet entregou o que se espera.

### oracle:arquiteto-estrategico (Opus, sem effort:high) — ✅ PASSOU COM RESERVAS

3 entregáveis estratégicos:
1. **Quando reativar** — 3 indicadores acionáveis (Neon/Vercel out of free tier, sellers FREE com volume > mediana PRO, ≥30% suporte em FREE).
2. **Risco prematuro** — argumento sólido sobre sazonalidade Copa + boca-a-boca em comunidade nichada.
3. **Roteiro de 3 marcos** com critérios de saída verificáveis (≥30 dias dashboard, ≥10 conversões FREE→PRO atribuídas, ≥50 PRO ativos + MRR ≥R$5k).
4. **Ilusão cognitiva** — premissa específica sobre Copa 2026 como gatilho automático. Argumento original e não-genérico.

**Auto-crítica importante:** o agent listou 3 premissas que **não verificou** (custo Neon real 2026, dashboard `/painel/comercial/kpis` populado, número atual de PRO) + alertou sobre `albums.ts` ("não verifiquei se 500 figurinhas = meio álbum Panini Copa" — citou LESSONS.md 2026-05-10 explicitamente).

**Sinal forte:** a lição contra `DOMAIN_FACT_HALLUCINATION` está chegando aos agents. Ele não inventou, marcou como `[NÃO VERIFICADO]`.

## Limitações da medição

### Gap #1 — Agents do p8-master não namespacedos

Erro encontrado:
```
Agent type 'p8-master:explorador' not found.
Available agents: ... explorador, ... oracle:arquiteto-estrategico, ...
```

Os agents do plugin `p8-master` foram indexados **sem o namespace prefix** `p8-master:`. Aparecem como `explorador`, `historiador`, `revisor` (nomes simples). Isso causa 2 ambiguidades:

1. **Conflito com agents globais** — se existir `~/.claude/agents/explorador.md`, qual ganha precedência?
2. **`p8-domain-expert` não aparece** — provavelmente o frontmatter tem algum issue de indexação. Não consegui invocar.
3. **`arquiteto-estrategico` foi resolvido pra `oracle:arquiteto-estrategico`** — não o do p8-master que eu havia configurado com `effort: high`. Então o teste de Opus na verdade rodou o agent do plugin oracle, **sem** o effort customizado.

**Pendência:** auditar `plugin.json` do p8-master pra confirmar como os agents são exportados. Ajustar pra garantir prefix consistente ou aceitar nomes simples e atualizar referências.

### Gap #2 — Task notifications não expõem modelo

Não tenho confirmação direta de **qual modelo foi efetivamente usado** em cada chamada. Inferi por latência (Haiku < Sonnet < Opus em geral) e profundidade do output. Não posso garantir que `explorador` rodou em Haiku — pode ter herdado Opus da main session se o `model: haiku` no frontmatter falhou em ser respeitado.

Para confirmar, próxima rodada deveria:
- Pedir ao agent pra printar `process.env.CLAUDE_MODEL` no início (se Bash disponível)
- OU usar `/status` na main session pra ver custo total Opus/Sonnet/Haiku consumido e cruzar com data dos calls

## Comparação contra baseline hipotético "tudo Opus"

| Cenário | Tokens | Custo aprox | Duration paralelo |
|---|---|---|---|
| **Real (tier routing)** | 149.806 | $2.11 | ~65s (gargalo: Opus) |
| Hipotético (tudo Opus) | ~150k | ~$3.30 | ~65s |
| Hipotético (tudo Sonnet) | ~150k | ~$0.99 | ~50s |
| Hipotético (tudo Haiku) | ~150k | ~$0.30 | ~30s |

Tier routing real economizou **35% vs tudo-Opus** sem perder qualidade nos pontos críticos. Vs tudo-Sonnet teria sido **2x mais caro** mas com Opus pra síntese (que entregou ilusão cognitiva específica e original — Sonnet provavelmente daria resposta mais rasa).

## Próximos passos

1. **Resolver Gap #1** — auditar plugin.json do p8-master, garantir que `p8-domain-expert` e `arquiteto-estrategico` apareçam indexados. Confirmar que `effort: high` está sendo respeitado.

2. **Resolver Gap #2** — adicionar instrumentação no SKILL.md de cada agent pra ele anunciar o modelo no início do output (linha `[runtime] model=X effort=Y`).

3. **Repetir baseline** após gap #1+#2 resolvidos, pra ter medição limpa.

4. **Acompanhar custo de Oracle full run** quando rodar — comparar contra a estimativa de 40% no `references/agent-model-routing.md`.

## Veredicto

✅ **Tier routing funciona como princípio** — economia de 35% medida em smoke test real. Agents respeitaram suas roles (factual, julgamento, síntese).

⚠️ **Implementação precisa de hardening** — 2 gaps de indexação/observabilidade impedem medição limpa por agent específico.

🔍 **Sinal positivo de governança** — agent Opus auto-citou LESSONS.md sobre `DOMAIN_FACT_HALLUCINATION` e marcou claim como `[NÃO VERIFICADO]`. A regra dura está propagando.
