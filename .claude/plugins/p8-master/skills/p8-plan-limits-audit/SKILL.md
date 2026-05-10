---
name: p8-master:p8-plan-limits-audit
description: Auto-ativa quando o usuário pedir "auditar plan-limits", "verificar gates de plano", "FREE/PRO/UNLIMITED status", ou mexer em `src/lib/plan-limits.ts`. Verifica se gates estão (re)ativados ou ainda no estado TODO temporário (todos retornam `true`). Lista todos os checkpoints + sugere plano de restauração.
argument-hint: ""
---

Vou auditar o estado dos gates de plano em P8-FigurinhasPro.

## Contexto (gap conhecido)

O CLAUDE.md de P8 declara: `Plan limits gates em src/lib/plan-limits.ts:36 retornam true temporariamente — não habilitar sem coverage de teste primeiro (TODO restaurar)`.

Esta skill **verifica** o estado atual e **lista** todos os pontos onde os gates deveriam estar ativos.

## Sequência

1. **Lê** [src/lib/plan-limits.ts](../../../../src/lib/plan-limits.ts) atual.

2. **Identifica funções gate:**
   - `checkStickerLimit(seller)` — limite de stickers no inventário
   - `checkOrderLimit(seller)` — limite de pedidos por mês
   - `checkAlbumLimit(seller)` — limite de custom albums
   - `hasFeature(seller, feature)` — gate por feature (ex: "cockpit comercial", "rate limit avançado")
   - Outras (descobre via grep no código)

3. **Para cada função, verifica:**
   - Retorna `true` hardcoded? → DESATIVADO (estado atual TODO)
   - Tem lógica real? → ATIVADO
   - Lança exceção? → ATIVADO MAS QUEBRADO

4. **Spawn `extrator` (Haiku)** com `grep-evidence.py` pra encontrar **callers** de cada função em `src/`:
   ```bash
   python scripts/grep-evidence.py "checkStickerLimit" src/ --max-samples 10
   python scripts/grep-evidence.py "checkOrderLimit" src/ --max-samples 10
   python scripts/grep-evidence.py "checkAlbumLimit" src/ --max-samples 10
   python scripts/grep-evidence.py "hasFeature" src/ --max-samples 10
   ```

   Para cada caller, capture:
   - Path:linha
   - Contexto (em qual rota/ação está)
   - Plan tier que deveria bloquear (FREE/PRO/UNLIMITED)

5. **Reporta em formato:**

```markdown
## Plan Limits Audit — <currentDate>

### Estado dos gates

| Função | Estado | Comportamento atual |
|---|---|---|
| `checkStickerLimit` | DESATIVADO (TODO) | Retorna `true` hardcoded — todos os planos passam |
| `checkOrderLimit` | DESATIVADO (TODO) | idem |
| `checkAlbumLimit` | DESATIVADO (TODO) | idem |
| `hasFeature` | DESATIVADO (TODO) | Retorna `true` para qualquer feature |

### Callers (onde o gate deveria bloquear)

#### checkStickerLimit
- `src/app/api/inventory/route.ts:24` — POST inventory (vendedor adiciona sticker). FREE deveria limitar a 50 stickers.
- `src/app/painel/estoque/page.tsx:55` — UI badge "X de Y stickers". Sem gate, mostra ilimitado.

#### checkOrderLimit
- ...

### Limites por plano (referência de PLANO_SAAS_V2.md)

| Plano | Stickers | Pedidos/mês | CustomAlbums | Cockpit |
|---|---|---|---|---|
| FREE | 50 | 10 | 1 | Não |
| PRO | 500 | 100 | 10 | Não |
| UNLIMITED | ∞ | ∞ | ∞ | Sim |

### Recomendações

1. **Pré-restauração:** adicionar coverage de teste em `src/__tests__/plan-limits.test.ts` (atualmente: 0 testes).
2. **Plano de restauração** — sugiro `/p8-master:plano "restaurar gates plan-limits.ts com coverage de teste"`:
   - Fase 1: testes Vitest para cada função (RED → GREEN)
   - Fase 2: implementar lógica real (lê seller.plan, conta inventory/orders/albums, retorna boolean)
   - Fase 3: deploy preview, smoke em ambiente staging
   - Fase 4: gate humano antes de prod
   - Fase 5: prod deploy + monitor (cancellations FREE conversão PRO)
3. **Risco:** restaurar gates SEM smoke pode quebrar fluxo de vendedores existentes que ultrapassaram limites silenciosamente.
```

6. **Sugere ação:**
   - `/p8-master:plano "restaurar plan-limits.ts"` — gera plano detalhado
   - `/p8-master:p8-stripe-sync` — testa se webhook ainda é compatível com gates ativos

## Restrições

- **Não modifica `src/lib/plan-limits.ts`.** Só audita.
- **Não invoca `/p8-master:plano` automaticamente.** Sugere, humano roda.
- **Cita evidências reais** — não chuta callers, usa `grep-evidence.py`.

## Modelo recomendado

- **Main session: Sonnet** — leitura + grep + relatório estruturado.
- **Sub-agent: `extrator`** (Haiku) — roda grep-evidence.py em paralelo.

## Ver também

- [P8-FigurinhasPro/src/lib/plan-limits.ts](../../../../src/lib/plan-limits.ts)
- [P8-FigurinhasPro/docs/PLANO_SAAS_V2.md](../../../../docs/PLANO_SAAS_V2.md) — define limites
- [scripts/grep-evidence.py](../../scripts/grep-evidence.py)
- [skills/plano/SKILL.md](../plano/SKILL.md) — quem cria o plano de restauração
