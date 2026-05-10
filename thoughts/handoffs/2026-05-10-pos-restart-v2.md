---
data: 2026-05-10 21:20
tipo: handoff
para: próxima sessão claude code (pós segundo restart do dia)
status: aguardando-execucao
contexto-anterior:
  - thoughts/handoffs/2026-05-10-pos-restart-smoke-3tier.md (handoff #1, 11 commits resolveram)
  - thoughts/baselines/2026-05-10-tier-routing.md (smoke test 3-tier passou)
  - thoughts/baselines/2026-05-10-guard-albums-test.md (guard validado sinteticamente)
  - thoughts/reviews/2026-05-10-painel-estoque-panini.md (review com Issue #1 a re-analisar)
commits-do-dia:
  - 6c02a2c, a7d1418, d65033f, d522cbc, e5644be (sessão original)
  - 7096e04 (tier routing v1.2.0)
  - edcbb7b (handoff #1)
  - 9f82651 (baseline smoke 3-tier)
  - 70c403c (hardening v1.2.1)
  - 8caea9d (Vercel bypass v1.2.2)
  - 7be1e74 (validação guard albums.ts)
plugin-version: 1.2.2
---

# Handoff #2 — Validar restart + 4 pendências não-bloqueantes

## Por que esse handoff existe

Hoje (2026-05-10) o plugin `p8-master` evoluiu de v1.0.0 → v1.2.2 em 11 commits. As 3 pendências do handoff #1 foram resolvidas. Esta sessão pediu **restart pra validar 2 fixes que precisam de reload**:

1. **Indexação dos 11 agents** (commit `70c403c` corrigiu plugin.json schema). Sessão anterior só via 3 agents (`explorador`, `historiador`, `revisor`). Esperado pós-restart: ver os 11.
2. **Runtime instrumentation** (mesmo commit). Cada agent agora printa `[runtime] subagent=X model=Y` como primeira linha do output.

## ⚠️ DESCOBERTA crítica (sessão pós-restart-v2)

Sessão pós-restart-v2 descobriu que o problema NÃO ERA o que o handoff supôs (fix de schema). A causa-raíz é que **o plugin nunca foi REGISTRADO no harness**:

- `settings.local.json` só tem `vercel@claude-plugins-official: true` em `enabledPlugins`
- **Não existe** marketplace local definido
- Os 3 agents que apareciam (`explorador`, `historiador`, `revisor`) eram **duplicatas standalone** em `.claude/agents/`, NÃO do plugin

**Solução implementada nesta sessão:** criado `.claude/.claude-plugin/marketplace.json` que cataloga o plugin local. Falta o user rodar 2 comandos slash:

```
/plugin marketplace add ./.claude
/plugin install p8-master@p8-local
```

Depois `/reload-plugins` (ou restart). Aí todos os 11 agents do `p8-master` aparecerão como `p8-master:explorador`, `p8-master:p8-domain-expert`, etc.

---

## Tarefa 1 — Validar fixes pós-restart (faça primeiro, ~5 min)

### Checagem rápida via Agent tool

Tente invocar `p8-domain-expert` e `deploy-watcher` (estes NÃO existiam na sessão anterior):

```
Agent({
  subagent_type: "p8-domain-expert",
  description: "Smoke ping",
  prompt: "Diga apenas a primeira linha runtime + a frase 'ping ok'. Sem mais nada."
})
```

Resultado esperado:
- Agent existe (não dá erro "Agent type not found")
- Primeira linha do output é exatamente: `[runtime] subagent=p8-domain-expert model=sonnet`

Repita pra `deploy-watcher` (esperado: `[runtime] subagent=deploy-watcher model=haiku`).

Se ambos passam → indexação OK + instrumentação OK. Documenta em comentário no `thoughts/baselines/2026-05-10-tier-routing.md` na seção "Gap #1" e "Gap #2".

Se falharem:
- Agent não existe → schema fix não foi suficiente. Investigar mais (talvez precise namespace explícito `p8-master:` no Agent tool param).
- Agent existe mas primeira linha não é `[runtime]...` → instrução do body pode estar sendo ignorada. Considerar mover pra system prompt via outro mecanismo.

## Tarefa 2 — `/p8-master:ui-review` end-to-end (se Chrome MCP reconectar)

Sessão anterior teve Chrome MCP desconectado. Se reconectou:

1. Configurar `P8_VERCEL_BYPASS_TOKEN` no shell (ver Tarefa 4)
2. Garantir dev server `npm run dev` em `localhost:3009`
3. Invocar `/p8-master:ui-review /painel/estoque/panini_fifa_world_cup_2022`
4. Validar relatório em `thoughts/reviews/<data>-painel-estoque-panini-v2.md`:
   - NÃO contém alegação tipo "convenção numérica canônica"
   - Trata `QAT13`, `FWC1`, `00` como literais Panini
   - Cita evidência de `albums.ts` quando afirma sobre stickers

## Tarefa 3 — Atualizar review original com achado do laststicker

`thoughts/baselines/2026-05-10-guard-albums-test.md` descobriu que `albums.ts` linha 1 tem o comentário:

> `// Gerado automaticamente a partir dos JSONs do laststicker`

Isso explica o watermark "LastSticker.com" sobre covers do P8. Era **Issue Crítico #1** no review original como problema legal/comercial isolado.

Editar `thoughts/reviews/2026-05-10-painel-estoque-panini.md` Issue #1 pra refletir:

- Origem dos covers: agregador laststicker.com (não Panini direto)
- 3 opções estratégicas: manter+citar fonte / pipeline próprio com sharp / licenciar Panini
- Decisão é estratégica + possivelmente jurídica, não só "remover watermark"

## Tarefa 4 — Configurar `P8_VERCEL_BYPASS_TOKEN` (manual do user)

Pra `p8-auth` funcionar em preview Vercel (commit `8caea9d`, v1.2.2):

```powershell
# 1. Acessar Vercel Dashboard → album-digital → Settings → Deployment Protection
#    → Protection Bypass for Automation → criar secret "p8-auth-skill"
# 2. Copiar o secret (aparece UMA vez na criação)
# 3. Setar no shell ANTES de invocar claude:
$env:P8_VERCEL_BYPASS_TOKEN = "<colar-secret>"

# 4. Persistir entre sessões:
[Environment]::SetEnvironmentVariable("P8_VERCEL_BYPASS_TOKEN", "<colar-secret>", "User")

# 5. Reabrir claude pra picar a env var
```

Sem esse token, Tarefa 2 falha em preview (continua funcionando em localhost).

## Estado no momento do restart

```
Branch: prototype/modal-roi (dirty)
Plugin: v1.2.2
Commits do dia: 11 (último: 7be1e74)
Tasks completed: #30, #31, #32, #33, #34
Tasks pendentes: nenhuma (este handoff cria as próximas conforme prioridade)
```

### Env vars já configuradas

- `$env:P8_DEV_AUTO_LOGIN_TOKEN` — 64 hex chars, gerado na sessão original, em `.env.local` + Vercel preview env var
- `$env:P8_VERCEL_BYPASS_TOKEN` — **NÃO configurado** (Tarefa 4)

### Arquivos importantes desta sessão

- `thoughts/baselines/2026-05-10-tier-routing.md` — métricas do smoke test
- `thoughts/baselines/2026-05-10-guard-albums-test.md` — validação do guard
- `thoughts/reviews/2026-05-10-painel-estoque-panini.md` — review original (Issue #1 a atualizar)
- `.claude/plugins/p8-master/CHANGELOG.md` — entradas 1.0.0 → 1.2.2 detalhadas

## Estimativa total

- Tarefa 1 (validar fixes): 5 min, ~$0.10
- Tarefa 2 (ui-review e2e): 30-40 min, ~$2-3 (depende de Chrome MCP)
- Tarefa 3 (update review): 10 min, ~$0.20
- Tarefa 4 (env var): manual do user, sem custo claude

**Total: ~50min-1h, ~$2.50-3.50.**

## Princípios a manter

1. **Nunca afirmar fato sobre Panini sticker** sem grep prévio em `src/lib/albums.ts` (antipattern `DOMAIN_FACT_HALLUCINATION`).
2. **Não digitar senha em form** — auto-login via endpoint é único caminho.
3. **Tier model routing**: Opus pra síntese big-picture / Sonnet pra julgamento local / Haiku pra trabalho braçal.
4. **Plano antes de código** em tarefas não-triviais (regra P8 CLAUDE.md).
