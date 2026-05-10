---
data: 2026-05-10
tipo: plano
status: rascunho-aguardando-aprovacao
autor: alex (via claude opus 4.7)
relacionados:
  - .claude/plugins/p8-master/agents/*.md (11 arquivos)
  - .claude/plugins/p8-master/skills/p8-master/SKILL.md
  - .claude/plugins/p8-master/references/ (criar agent-model-routing.md)
gate-humano: sim
---

# Plano — Roteamento Opus / Sonnet / Haiku em p8-master

## Contexto

Alex (user) pediu: **"p8-master deve usar os 3 modelos. Opus = análise profunda complexa. Sonnet = 80% dos outros trabalhos. Haiku = quase todo braçal."**

Sessão anterior eu interpretei mal "haiku e sonnet" como **só** esses dois — baixei `arquiteto-estrategico` e `critico-adversarial` de Opus pra Sonnet sem justificativa cognitiva, só por seguir literalmente "haiku e sonnet". Alex corrigiu agora: quer os 3, com Opus reservado pra **raciocínio onde erro se propaga**.

## Pesquisa realizada (via /stay-current)

WebFetch a duas docs canônicas hoje (2026-05-10):

1. **`https://code.claude.com/docs/en/sub-agents`** — confirmou:
   - Frontmatter `model:` aceita `opus`, `sonnet`, `haiku`, full ID, ou `inherit` (default).
   - Built-in `Explore` agent usa Haiku — padrão Anthropic pra exploração read-only.
   - Built-in `claude-code-guide` usa Haiku — leitura de docs.
   - Subagents **não podem spawnar outros subagents** — confirma orquestração 1-nível.
   - Plugin subagents NÃO suportam `hooks`, `mcpServers`, `permissionMode` (security).

2. **`https://code.claude.com/docs/en/model-config`** — confirmou:
   - `opus` → Opus 4.7 (descrição literal Anthropic: "complex reasoning tasks").
   - `sonnet` → Sonnet 4.6 ("daily coding tasks").
   - `haiku` → Haiku 4.5 ("simple tasks").
   - `opusplan` mode existe: Opus em plan, Sonnet em execução — pattern oficial.
   - Effort levels (`low/medium/high/xhigh/max`) válidos em Opus 4.7 + Sonnet 4.6, **não** em Haiku.
   - Resolução de modelo: env `CLAUDE_CODE_SUBAGENT_MODEL` > param invocação > frontmatter > main session.

## Princípio de roteamento (PT-BR)

```
┌──────────────────────────────────────────────────────────────────┐
│ OPUS — "se eu errar aqui, todos os passos seguintes erram"       │
│ Decisão estratégica. Síntese big-picture. Detecção de premissas  │
│ ocultas. Paralaxe cognitiva. Justifica ~4× custo de Sonnet       │
│ porque a saída ALIMENTA outros agents.                           │
├──────────────────────────────────────────────────────────────────┤
│ SONNET — "interpretação que precisa de julgamento, mas é local"  │
│ Redação estruturada PT-BR. Interpretação de docs externas.       │
│ Trade-offs de segurança/complexidade. Semântica de domínio.      │
│ ~80% das chamadas que NÃO são Opus nem mecânicas.                │
├──────────────────────────────────────────────────────────────────┤
│ HAIKU — "comando determinístico, saída checável"                 │
│ Grep, glob, leitura de arquivos. Roda script Python. Polling.    │
│ Validação de schema. Não precisa de raciocínio — precisa de      │
│ velocidade e custo baixo.                                        │
└──────────────────────────────────────────────────────────────────┘
```

## Estado atual (auditoria dos 11 agents)

| Agent | Modelo atual | Função | Modelo correto | Mudança? |
|---|---|---|---|---|
| explorador | haiku ✅ (mudei sonnet→haiku nesta sessão) | Grep/Glob de código | haiku | nenhuma |
| historiador | haiku ✅ (mudei sonnet→haiku nesta sessão) | Localiza artefatos | haiku | nenhuma |
| extrator | haiku ✅ (já estava) | Roda scripts Python | haiku | nenhuma |
| qa-estrutural | haiku ✅ (já estava) | validate-frontmatter.py | haiku | nenhuma |
| deploy-watcher | haiku ✅ (mudei sonnet→haiku nesta sessão) | Polling Vercel + curl | haiku | nenhuma |
| analista-gerador | sonnet ✅ | Redação PT-BR estruturada | sonnet | nenhuma |
| pesquisador | sonnet ✅ | WebSearch + síntese | sonnet | nenhuma |
| p8-domain-expert | sonnet ✅ | Interpretação semântica P8 | sonnet | nenhuma |
| revisor | sonnet ✅ | Segurança + complexidade | sonnet | nenhuma |
| **arquiteto-estrategico** | **sonnet ❌ (eu degradei de Opus)** | Síntese big-picture, roteiro de evolução | **opus** | **REVERTER** |
| **critico-adversarial** | **sonnet ❌ (eu degradei de Opus)** | Paralaxe cognitiva, atacar premissas | **opus** | **REVERTER** |

**Total final desejado:**
- 2 agents Opus (arquiteto, crítico)
- 4 agents Sonnet (analista-gerador, pesquisador, p8-domain-expert, revisor)
- 5 agents Haiku (explorador, historiador, extrator, qa-estrutural, deploy-watcher)

## Por que arquiteto-estrategico e critico-adversarial ficam Opus

Esses são os 2 únicos casos onde **erro de raciocínio se propaga** pra todo o resto:

- **arquiteto-estrategico**: consolida sub-relatórios em narrativa única, identifica gaps entre sistema atual e ideal, desenha roteiro de evolução. Se a síntese tem viés cognitivo (self-confirmation, otimismo de estimativa), tudo que depende dela (passos seguintes da skill `oracle-analise`, decisões de produto do Alex) herda o viés. **Custo extra de Opus aqui paga o resto da pipeline.**

- **critico-adversarial**: faz paralaxe cognitiva — manter narrativa A (como o dono vê o projeto) e narrativa B (realidade objetiva dos relatórios) em mente simultaneamente, apontar divergência. Sonnet faz raso ("nenhuma divergência encontrada"). Opus consegue ver as 3-5 ilusões cognitivas reais. Função desse agent é EXISTIR pra forçar adversidade — Sonnet não consegue ser adverso o suficiente porque "concorda demais" com a síntese.

## Mudanças necessárias

### 1. Reverter 2 frontmatters (commit `e5644be` parcial)

```diff
# .claude/plugins/p8-master/agents/arquiteto-estrategico.md
-model: sonnet
+model: opus

# .claude/plugins/p8-master/agents/critico-adversarial.md
-model: sonnet
+model: opus
```

### 2. Adicionar effort: high nos 2 agents Opus

Effort default em Opus 4.7 é `xhigh` (alto custo). Pra arquiteto/crítico, `high` é suficiente — uso síntese estratégica, não math/reasoning bruto.

```yaml
# Frontmatter dos 2 agents Opus
model: opus
effort: high
```

### 3. Atualizar `skills/p8-master/SKILL.md` com roteamento explícito

Adicionar seção "Modelos por agent" depois da tabela de decisão, mostrando qual agent usa qual modelo e por quê. Refatorar a parte final "Modelo recomendado" pra refletir que **a main session Opus delega**:

```markdown
## Modelos por agent (delegação)

Main session: Opus 4.7 (roteamento + decisão estratégica em diálogo com user).

Quando delego pra subagent via Agent tool, o modelo é definido no frontmatter do subagent — eu não preciso passar `model: ...` na chamada (a menos que queira override explícito).

| Tier | Agents | Quando |
|---|---|---|
| Opus 4.7 | arquiteto-estrategico, critico-adversarial | Síntese big-picture + paralaxe cognitiva |
| Sonnet 4.6 | analista-gerador, pesquisador, p8-domain-expert, revisor | Redação, interpretação, julgamento |
| Haiku 4.5 | explorador, historiador, extrator, qa-estrutural, deploy-watcher | Grep, scripts, polling, validação |

**Princípio:** delego pra Haiku trabalhos mecânicos (Explorer pattern oficial); pra Sonnet trabalhos que exigem julgamento mas são locais; pra Opus só quando erro de raciocínio se propaga pra outros agents.
```

### 4. Criar `references/agent-model-routing.md`

Doc de 1 página explicando estratégia, com:
- Tabela de roteamento
- 3 exemplos de execução (pipeline canônico pesquisa → plano → implementa mostrando qual agent roda qual modelo)
- Como reverter um agent pra modelo diferente (override per-invocation)
- Trade-off de custo vs qualidade

### 5. Bump versão do plugin e CHANGELOG

```diff
# .claude-plugin/plugin.json
-  "version": "1.1.0"
+  "version": "1.2.0"
```

CHANGELOG entry:
```markdown
## [1.2.0] — 2026-05-10

### Adicionado

- Roteamento explícito por modelo nos 11 agents do plugin:
  - 2 Opus (arquiteto-estrategico, critico-adversarial) com effort: high
  - 4 Sonnet (analista-gerador, pesquisador, p8-domain-expert, revisor)
  - 5 Haiku (explorador, historiador, extrator, qa-estrutural, deploy-watcher)
- references/agent-model-routing.md com estratégia + exemplos de pipeline
- Seção "Modelos por agent" em skills/p8-master/SKILL.md

### Modificado

- explorador, historiador, deploy-watcher: sonnet → haiku (trabalho braçal)
- Trade-off documentado: Opus reservado pra agents onde erro se propaga
```

### 6. Commit atomico

Mensagem proposta:
```
feat(p8-master): tier explicit model routing (opus/sonnet/haiku)

Distribui os 11 agents do plugin pelos 3 modelos baseado em função:
- Opus 4.7 (2): arquiteto-estrategico, critico-adversarial
- Sonnet 4.6 (4): analista-gerador, pesquisador, p8-domain-expert, revisor
- Haiku 4.5 (5): explorador, historiador, extrator, qa-estrutural,
  deploy-watcher

Princípio: Opus reservado pra agents onde erro de raciocínio se propaga
pra outros (síntese big-picture, paralaxe cognitiva). Sonnet pra julgamento
local (redação, interpretação, trade-offs). Haiku pra trabalho braçal
determinístico (grep, scripts, polling).

Pesquisa via /stay-current confirma aliases canônicos em
docs.claude.com/sub-agents e /model-config (2026-05-10):
opus→4.7, sonnet→4.6, haiku→4.5.

Bump v1.1.0 → v1.2.0. CHANGELOG + references/agent-model-routing.md.
```

## Métricas de sucesso

Após implementar, métricas verificáveis em próximas 5 sessões:

1. **Latência média de pipeline `pesquisa → plano → valida`**: deve cair ≥30% (3 agents Haiku + 1 Sonnet em vez de tudo herdar Opus).
2. **Custo de Oracle full run** (`oracle-analise`): deve cair ~50% (5 agents Haiku rodando scripts + 4 Sonnet pra redação vs antes Opus implicit).
3. **Qualidade de síntese big-picture** (arquiteto + crítico): subjetivo, mas Alex flag se "ficou raso" — se sim, ajustar effort `high` → `xhigh`.
4. **Taxa de fallback automático** (Anthropic devolve Sonnet quando Opus hit threshold): se ≥20% das chamadas Opus caem em fallback, considerar `opus[1m]` ou rebalancear.

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Haiku em `extrator` falha em parsing JSON complexo | Baixa | Já existe — agent tem `maxTurns: 8` que limita escopo. Se falhar, upgrade pra Sonnet. |
| arquiteto Opus + effort `high` ainda muito caro | Média | Bumpar pra `medium` ou usar `opusplan` no skill chamadora. |
| Plugin subagents perdem `hooks` que existiam antes | Inválido | Verifiquei: nenhum agent do p8-master tinha hooks. Limitação documentada não afeta. |
| Subagent `inherit` (sem `model:`) escolhe modelo errado | Inválido | Auditoria mostrou que todos os 11 têm `model:` explícito (após reverts). |
| Effort `high` em Sonnet 4.6 não disponível | Inválido | Doc confirma: Sonnet 4.6 suporta `low/medium/high/max`. |

## Gates humanos antes de executar

1. **Aprovação do plano** (este documento) — Alex revisa, confirma ou ajusta tabela.
2. **Confirmação de reverter arquiteto + crítico pra Opus** — quero confirmação explícita (já errei uma vez, não vou re-errar baseado em interpretação).
3. **Após commit:** Alex pode rodar `oracle-analise` em sessão isolada pra ver latência/custo real e julgar se síntese ficou na qualidade esperada.

## Estimativa de esforço

- Reverter 2 frontmatters: 2 min
- Adicionar `effort: high` nos 2: 1 min
- Atualizar SKILL.md p8-master (seção nova ~30 linhas): 5 min
- Criar `agent-model-routing.md` (~80 linhas): 10 min
- Bump plugin.json + CHANGELOG: 2 min
- Commit + verificação: 3 min

**Total: ~25 minutos de execução após aprovação.**

## Próxima decisão

Aguardo aprovação ou ajuste do plano antes de qualquer edição.
