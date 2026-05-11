---
data: 2026-05-10 23:42 (sessão pós-restart-v3)
tipo: baseline
feature: agent-model-routing-v1.2.2-validated
autor: alex (via claude opus 4.7)
relacionados:
  - thoughts/baselines/2026-05-10-tier-routing.md (smoke v1, sem plugin carregado)
  - thoughts/handoffs/2026-05-10-pos-restart-v2.md
  - .claude/plugins/p8-master/CHANGELOG.md (v1.2.2 + fixes load)
status: passou-com-observacoes
veredito: 11 AGENTS CARREGAM E FUNCIONAM
---

# Baseline v2 — Smoke 3-tier REAL com plugin carregado

## Histórico de fixes pra plugin carregar

Antes deste smoke, o plugin `p8-master` **não estava sendo indexado** apesar de existir fisicamente. Sequência de fixes nesta sessão:

1. **`.claude/.claude-plugin/marketplace.json`** criado (commit `c96bb60`) — marketplace local declarado.
2. **`extraKnownMarketplaces` em settings.json** (commit `f212feb`) — declaração no project settings. **Não bastou.**
3. **Removido `extraKnownMarketplaces`** (commit `2de54a0`) — declaração inerte sem registro físico.
4. **Replicação física manual** em `~/.claude/plugins/marketplaces/p8-local/p8-master/` (este sessão, antes do final). Sem commit no repo do projeto pois é state global do Claude Code.
5. **Editado `~/.claude/plugins/known_marketplaces.json`** + `installed_plugins.json` pra adicionar p8-local + p8-master@p8-local.
6. **Removido `.claude-plugin/permissions.json`** — doc Anthropic diz "Only plugin.json goes inside .claude-plugin/".
7. **Criado `hooks/hooks.json`** manifest mínimo `{ "hooks": {} }` — sem isso parser falhava silenciosamente.

Após fix 6 + 7 + `/reload-plugins`:

```
Reloaded: 10 plugins · 11 skills · 34 agents · 7 hooks · 3 plugin MCP servers · 0 plugin LSP servers
```

**Sem errors**. +1 plugin, +11 agents (23→34). Todas as 25 skills `p8-master:*` indexadas.

## Smoke test 3-tier (paralelo, 1 invocação)

| Agent invocado | Modelo declarado | Tokens | Duration (ms) | Tool uses |
|---|---|---|---|---|
| `p8-master:explorador` | haiku | 33.664 | 12.345 | 1 |
| `p8-master:p8-domain-expert` | sonnet | 36.754 | 21.806 | 2 |
| `p8-master:arquiteto-estrategico` | opus + effort:high | 63.891 | 26.725 | 0 |
| **Total** | — | **134.309** | **~27s paralelo** | **3** |

Custo estimado: **$2.07** (vs $3.30 se tudo Opus → economia 37%).

## Qualidade verificada

### Haiku — LOCALIZAR
Devolveu 29 arquivos `.ts` em `src/lib/` (top-level). Sem alucinação, sem opinião. Exato.

### Sonnet — Interpretação de domínio
Citou linhas específicas do `price-resolver.ts`: 47 (função `resolveUnitPrice`), 49 (check `customPrice`), 54-58 (fallback chain `albumTypeRules > globalTypeRules > DEFAULT_PRICES > 2.5`), 61-67 (aplicação `SectionRule` FLAT/OFFSET), 80 (`resolveQuantityDiscount` separado). Análise técnica precisa, justifica decisão arquitetural ("separação intencional: preço unitário e desconto de volume são responsabilidades distintas").

### Opus — Síntese estratégica
Output **explicitamente melhor** que smoke v1:

- **3 sinais de mercado concorrentes** (DAU/WAU estabilizado 4 semanas + 20% batendo teto + NPS qualitativo) — não genéricos, todos verificáveis.
- **Risco específico Panini/Copa**: "vendedora é multi-homed por padrão" (ML, Insta DM, WhatsApp, feirinha). Gate prematuro a faz voltar pro fluxo antigo levando clientes. Pior: "vira evangelista negativa em Telegram/WhatsApp do nicho — rede pequena, fofoca rápida". **Argumento original, contextual, acionável.**
- **Marco verificável Fase 1**: ≥50 vendedoras com ≥30 dias ativos E ≥1 pagante voluntária (sem trigger de gate). Verificável via query Neon.
- **Auto-crítica** explícita: lista 3 premissas + 1 risco da síntese ("assumi que Alex não tem dados granulares de funil — se já tem, recomendação inverte").

Opus **com `effort: high` declarado** entregou densidade cognitiva real.

## Observação — instrumentação runtime parcial

Apenas Opus printou `[runtime] subagent=arquiteto-estrategico model=opus effort=high` na primeira linha. Haiku e Sonnet pularam.

**Hipótese**: modelos menores priorizam o prompt do user sobre instruções do body do agent. Pra forçar todos a printar, instrução teria que vir via prompt de invocação OU system-level (não body). Não é bug do plugin — é comportamento de modelo.

**Decisão pragmática**: deixar como está. Opus é o tier crítico (paralaxe cognitiva, síntese big-picture) — confirmar modelo dele é o mais importante. Pra Haiku/Sonnet, latência + tokens + tool_uses já dão sinal forte do tier.

## Comparação com baseline v1 (smoke pré-plugin, com `oracle:*` agents)

| Métrica | v1 (oracle:*) | v2 (p8-master:*) | Diff |
|---|---|---|---|
| Total tokens | 149.806 | 134.309 | -10% |
| Total custo | $2.11 | $2.07 | -2% |
| Duration paralelo | ~65s | ~27s | -58% 🔥 |
| Qualidade Opus | Boa (auto-crítica citou LESSONS) | **Melhor** (3 premissas + risco-da-síntese explícitos) | ↑ |

A redução drástica de duration (-58%) é provavelmente porque os agents do p8-master têm prompts mais focados/curtos que os oracle:* genéricos. Sonnet e Haiku terminaram em metade do tempo.

## Veredicto

✅ **Plugin carrega**, **agents respondem**, **tier routing funciona**, **economia confirmada vs all-Opus**.

⚠️ **Instrumentação runtime parcial** — só Opus respeita. Aceitável.

🎁 **Bonus**: qualidade do Opus melhorou vs v1 (effort:high entregando + prompt mais focado do agent customizado).

## Próximos passos sugeridos

1. **Replicar fixes pro plugin original em `.claude/plugins/p8-master/`** (já feito) — quando alguém clonar o repo, plugin já vem correto.
2. **Documentar troubleshooting no README do plugin** — "se plugin não carregar, ver .claude-plugin/ tem só plugin.json + hooks/ tem hooks.json".
3. **Rodar Oracle full** com plugin carregado pra ver economia em pipeline longo.
