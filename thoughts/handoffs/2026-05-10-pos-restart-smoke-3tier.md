---
data: 2026-05-10
tipo: handoff
para: próxima sessão claude code (pós-restart)
status: aguardando-execucao
contexto-anterior:
  - thoughts/planos/2026-05-10-roteamento-opus-sonnet-haiku.md
  - thoughts/reviews/2026-05-10-painel-estoque-panini.md
commits-da-sessao-anterior:
  - 6c02a2c (auth endpoint + handler + testes)
  - a7d1418 (skill p8-auth + integração ui-review)
  - d65033f (bump v1.1.0 + CHANGELOG)
  - d522cbc (.env.example placeholder)
  - e5644be (fix DOMAIN_FACT_HALLUCINATION)
  - 7096e04 (tier model routing v1.2.0)
---

# Handoff — Smoke test 3-tier + 2 pendências

## Por que esse handoff existe

A sessão anterior fez 6 commits no plugin p8-master (v1.0.0 → v1.2.0) incluindo:
1. Skill nova `p8-auth` + endpoint `/api/dev/auto-login` no app P8
2. Guard contra `DOMAIN_FACT_HALLUCINATION` na skill `ui-review`
3. **Tier model routing**: 11 agents distribuídos entre Opus/Sonnet/Haiku

O problema: mudanças em `.claude/plugins/p8-master/agents/*.md` só são indexadas no **restart** do Claude Code. A sessão anterior carregou agents do plugin **oracle** separado (`oracle:extrator`, etc.) mas não os agents `p8-master:*`. Logo, smoke test em runtime não podia validar o routing novo.

User reiniciou. Esta sessão tem acesso aos agents atualizados.

## Tarefa 1 — Smoke test 3-tier (faça primeiro)

### Setup

Salvar resultados em `thoughts/baselines/2026-05-10-tier-routing.md`. Capturar `total_tokens` e `duration_ms` de cada subagent task notification.

### Disparar 3 agents em PARALELO (1 message, 3 Agent calls)

**Agent Haiku — `p8-master:explorador`:**
```
description: "Localizar plan-limits desabilitado"
subagent_type: "p8-master:explorador"  (ou só "explorador" se namespace não exigido)
prompt: |
  Modo: LOCALIZAR.
  Encontre todos os arquivos em src/lib/ que tocam plan-limits (gates de PRO/UNLIMITED).
  Especificamente: src/lib/plan-limits.ts e todos os callers.
  Para cada caller, devolva path:linha + nome da função que chama.
  Não interprete, não sugira mudanças. Só lista factual.
```

**Agent Sonnet — `p8-master:p8-domain-expert`:**
```
description: "Interpretar gates de plano P8"
subagent_type: "p8-master:p8-domain-expert"
prompt: |
  Leia src/lib/plan-limits.ts e explique:
  1. Quais 4 gates existem (checkStickerLimit, checkOrderLimit, checkAlbumLimit, hasFeature)
  2. Qual seria comportamento se TODOS retornassem true (estado atual segundo CLAUDE.md)
  3. Que partes do app são afetadas (consultar grep em src/app/painel/ pra encontrar callers)
  Output: parágrafo conciso + lista de impacto, em PT-BR.
```

**Agent Opus — `p8-master:arquiteto-estrategico`:**
```
description: "Trade-off estratégico plan-limits"
subagent_type: "p8-master:arquiteto-estrategico"
prompt: |
  Trade-off a sintetizar:
  - Estado atual: plan-limits desabilitados (todos retornam true). Comentário em CLAUDE.md
    indica "TODO restaurar". Sem revenue gate de PRO/UNLIMITED.
  - Tensão: crescer base sem fricção (estado atual) vs converter free → pago (precisa gate).

  Sintetize em narrativa curta (3-5 parágrafos):
  - Quando reativar gates faz sentido (sinal de mercado pra observar)
  - Risco de reativar prematuro (churn)
  - Roteiro de evolução em 3 marcos com critério de saída cada
  - 1 ilusão cognitiva do dono (Alex) sobre esse trade-off

  Não escreva código nem ADR. Só análise estratégica.
```

### Capturar métricas (CRÍTICO)

Cada task notification que retorna inclui:
```json
{ "total_tokens": NNNNN, "duration_ms": NNNN }
```

Salve imediatamente em `thoughts/baselines/2026-05-10-tier-routing.md`:

```markdown
| Agent | Modelo | Tokens | Duration | Custo aprox |
|---|---|---|---|---|
| explorador | haiku | ? | ? | ? |
| p8-domain-expert | sonnet | ? | ? | ? |
| arquiteto-estrategico | opus + high effort | ? | ? | ? |

Total: ? tokens / ? ms / ? USD
```

Pricing aproximado (2026-05-10):
- Haiku 4.5: $1 input / $5 output por 1M tokens
- Sonnet 4.6: $3 input / $15 output por 1M tokens
- Opus 4.7: $15 input / $75 output por 1M tokens

Cálculo de custo: assumir 70% input / 30% output do total.

### Validar qualidade

Anexe ao baseline doc a saída textual de cada agent. Checks:
- Haiku: encontrou ≥3 callers de plan-limits? Listou path:linha?
- Sonnet: explicou os 4 gates corretamente? PT-BR fluente?
- Opus: sintetizou trade-off com 3 marcos + 1 ilusão cognitiva real (não genérica)?

Se algum tier falhar qualidade, anote como `risco-realizado` no baseline.

## Tarefa 2 — Pendência #2: Re-rodar ui-review com guard albums.ts

Após smoke test, validar que `ui-review` agora consulta `src/lib/albums.ts` antes de afirmar fato sobre stickers.

### Setup

1. Dev server `npm run dev` rodando (matar processo antigo se existir, ver netstat porta 3009)
2. `/chrome` conectado ao browser P8-PAGE
3. Token de auto-login em env shell: `$env:P8_DEV_AUTO_LOGIN_TOKEN`

### Disparar review

Invoque `/p8-master:ui-review /painel/estoque/panini_fifa_world_cup_2022` (ou outra rota álbum).

### Validar guard

No relatório gerado em `thoughts/reviews/<data>-<feature>.md`, procurar:

- [ ] Alguma afirmação sobre código/nome de sticker (ex: "QAT13", "FWC1", "00")?
- [ ] Se sim, o relatório CITA grep contra `src/lib/albums.ts` antes da afirmação?
- [ ] Nenhuma alegação tipo "convenção numérica canônica" ou similar?

Se passar: registrar em `LESSONS.md` que guard funcionou na 1ª invocação real.
Se falhar: o guard não foi suficiente. Adicionar reforço na SKILL.md de ui-review.

## Tarefa 3 — Pendência #3: Vercel SSO Protection bypass

Preview deploys ficam por trás da Vercel SSO (401 antes de chegar no Next.js). p8-auth não funciona em preview por isso.

### Pesquisa primeiro (via /stay-current ou WebFetch)

```
WebFetch: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection
Prompt: "How to generate a Protection Bypass for Automation token for a Vercel project,
how to use it via x-vercel-protection-bypass query param or header, and limitations
(per-deployment vs project-wide)."
```

### Implementar (após pesquisa)

1. Gerar bypass token em Vercel dashboard (Settings → Deployment Protection)
2. Adicionar env var `P8_VERCEL_BYPASS_TOKEN` no shell + documentar em `docs/dev-auto-login.md`
3. Atualizar `skills/p8-auth/SKILL.md` Caminho A — quando host contém `.vercel.app`, adicionar query param `?x-vercel-protection-bypass=$P8_VERCEL_BYPASS_TOKEN` à URL antes de chamar `/api/dev/auto-login?token=...`
4. Validar com curl ao preview URL atual: deve passar SSO + chegar no handler + retornar 307 redirect

### Commit

```
feat(p8-auth): suporte a Vercel SSO Protection bypass em preview
```

Bump versão do plugin se justificar (v1.3.0).

## Estado de tasks ao retomar

A sessão anterior deixou tasks #30, #31, #32 in_progress / pending. Esta sessão pode:
- Marcar #30 (smoke 3-tier) como in_progress → executar → completed
- Depois #31 (ui-review guard) → completed
- Depois #32 (Vercel bypass) → completed

Ou criar tasks novos descritivos. Importante: rastrear o progresso pra Alex acompanhar.

## Restrições de segurança a manter

1. **NÃO afirmar nada sobre Panini sticker codes sem grep prévio** em `src/lib/albums.ts` — antipattern `DOMAIN_FACT_HALLUCINATION` documentado em `~/.claude/ANTIPATTERNS.md`.
2. **NÃO digitar senha em form de login** — auto-login via endpoint é o único caminho.
3. **NÃO commitar `.env.local`** — pre-commit hook bloqueia, mas mantém disciplina.
4. **Token `DEV_AUTO_LOGIN_TOKEN` valor está em `.env.local`** e foi gerado nesta sessão (64 hex chars). Se precisar dele pra outra coisa, lê do arquivo — não regenera.

## Estimativa total

- Tarefa 1 (smoke 3-tier): 15-30 min, ~$1-2
- Tarefa 2 (ui-review guard): 20-40 min, ~$2-3
- Tarefa 3 (Vercel bypass): 30-60 min, ~$1 (pesquisa + edição doc + 1 commit)

**Total: ~1-2h, ~$4-6 em tokens.**

## Como Alex retomou esta conversa

Provavelmente via `/resume` (Claude Code 2.1+) ou abrindo nova sessão no diretório `C:\Users\conta\Projetos\ArenaCards\P8-FigurinhasPro`. SessionStart hook do p8-master é disparado automaticamente — não precisa fazer nada especial pra "ativar" o plugin.
