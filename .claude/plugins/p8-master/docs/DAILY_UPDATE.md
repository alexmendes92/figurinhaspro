# Atualização diária por data — plugin P8-MASTER

> Como o plugin se mantém atualizado em relação ao knowledge cutoff (jan/2026 para Opus 4.7) usando `currentDate` injetado a cada sessão.

---

## Por que isso importa

Modelo Claude tem knowledge cutoff fixo (jan/2026 para Opus 4.7). Mas:

1. **Hoje é 2026-05-10** (livecurrentDate). Gap = 4 meses desde cutoff.
2. **Amanhã será 2026-05-11.** Gap aumenta 1 dia/dia.
3. **Libs P8 lançam patches semanalmente:** Stripe API mudou em Feb/2026, Next.js 16.3 saiu em Mar/2026, etc.

Sem fetch atualizado, plugin responde com info pré-cutoff e dá conselho desatualizado.

---

## Mecanismo

### 1. `currentDate` injetado pelo system context

Claude Code injeta no system prompt da sessão:

```
# currentDate
Today's date is 2026-05-10.
```

Plugin **lê isso primeiro**, antes de qualquer raciocínio temporal.

### 2. Hook SessionStart calcula gap

`hooks/session-start.ps1` invoca `scripts/currentdate-gap.py` em background:

```bash
python scripts/currentdate-gap.py \
  --state state/last-update.json \
  --threshold-days 14 \
  --default-cutoff 2026-01-01
```

Script:
1. Lê `state/last-update.json` (cache da última checagem por domínio)
2. Calcula `gap = currentDate - last_checked` para cada lib
3. Filtra domínios com `gap >= 14 dias` → marca como "stale"
4. Output JSON com `stale_count` e `stale_list`

### 3. Decisão baseada em gap

| `gap` | Comportamento |
|---|---|
| < 24h | Skip silencioso. Info ainda fresca. |
| 24h ≤ gap < 14d | Background não dispara fetch (default threshold 14d). User pode forçar via `/p8-master:stay-current --force`. |
| ≥ 14d | Background sinaliza domínios stale. User pode rodar `/p8-master:stay-current` ou plugin sugere automaticamente quando relevante. |

### 4. Skill `stay-current` faz fetch

Quando disparada (manual ou automaticamente), `stay-current` consulta as fontes canônicas em paralelo via sub-agent `pesquisador`:

```
pesquisador → WebFetch nextjs.org/blog
            → WebFetch github.com/vercel/next.js/releases
            → WebFetch vercel.com/changelog
            → WebFetch stripe.com/docs/upgrades
            → ...
            → Compila diff em thoughts/atualizacoes/<data>-libs.md
            → Atualiza state/last-update.json
```

### 5. Severidade de breaking change

Pesquisador classifica achados:

| Severidade | Critério | Ação |
|---|---|---|
| **CRÍTICO** | Security advisory, CVE, deprecation com prazo curto (<30 dias) | Notifica user no início da sessão + propõe `/p8-master:plano` de upgrade |
| **NÃO-CRÍTICO** | Deprecation longa (≥6 meses), mudança opcional | Registra em `thoughts/atualizacoes/` |
| **PATCH** | Bug fix, sem ação requerida | Registra silencioso |

---

## Fontes canônicas (9 libs P8)

Definidas em `references/canonical-sources.md`:

| Lib | URL primária |
|---|---|
| Next.js 16 | https://nextjs.org/blog + https://github.com/vercel/next.js/releases |
| Vercel | https://vercel.com/changelog |
| Stripe | https://stripe.com/docs/upgrades |
| Prisma 7 | https://github.com/prisma/prisma/releases |
| Sentry | https://github.com/getsentry/sentry-javascript/releases |
| React 19 | https://react.dev/blog |
| Tailwind 4 | https://github.com/tailwindlabs/tailwindcss/releases |
| Zod 4 | https://github.com/colinhacks/zod/releases |
| iron-session | https://github.com/vvo/iron-session/releases |

Versões usadas em P8 são lidas de `package.json` runtime — não hardcoded.

---

## Skill complementar: `update-claude-docs`

Mesma mecânica, mas pra docs Anthropic / Claude Code (não libs P8):

- Threshold maior: gap > 7 dias (Claude Code muda mais devagar que libs)
- Fontes em `references/canonical-sources.md` seção "Update-claude-docs"
- Diffs em `thoughts/atualizacoes/<data>-claude-docs.md`
- Snapshot em `references/claude-docs/<dominio>.md` para diff incremental

Útil pra detectar:
- Hooks novos (PreCompact, etc.)
- Skill format mudou
- Plugin marketplace mudou
- MCP novos disponíveis

---

## Padrão `pesquisador` — anti-cutoff

`agents/pesquisador.md` tem regra explícita:

> **Toda informação posterior ao cutoff (preço, API recente, evento de mercado, lançamento, número de usuários, regulamentação, framework lançado) DEVE vir de WebSearch/WebFetch executado nesta sessão — nunca da sua memória.**

E:

> **Nas queries WebSearch, INCLUA `<currentDate>` ou o ano corrente derivado dela** — ex: `Next.js LTS <YYYY>`, `Stripe pricing <YYYY>`, `concorrente X usuários <currentDate>`. Sem âncora temporal a busca traz resultados antigos.

Marca explícita quando não conseguiu confirmar:
```
Stripe SDK 23.0 [NÃO VERIFICADO — knowledge cutoff]
```

---

## Cron alternativo (opcional, não default)

Pra rodar diariamente sem intervenção:

```bash
# scheduled task (Windows Task Scheduler)
pwsh -File .claude/plugins/p8-master/scripts/cron-stay-current.ps1
```

(Esta feature não está implementada em v0.5.0. User pode setup manualmente via Task Scheduler.)

---

## Estado em `state/last-update.json`

```json
{
  "last_checked": "2026-05-09",
  "checked_at": "2026-05-09T14:30:00Z",
  "domains": {
    "nextjs": {"last_checked": "2026-05-09", "version": "16.2.4"},
    "stripe": {"last_checked": "2026-05-09", "version": "22.1.0"},
    "prisma": {"last_checked": "2026-05-08", "version": "7.7.0"},
    ...
  },
  "achados_criticos": 0,
  "achados_total": 3
}
```

Atualizado a cada `stay-current` rodada. Versionado como template (vazio inicialmente) em `state/last-update.json`. Versão real (com dados) é gitignored.

---

## Exemplo de fluxo end-to-end

```
14:00 — User abre Claude Code em P8
14:00 — hook SessionStart roda
14:00 — currentdate-gap.py (background): gap=15d em Stripe, gap=20d em Next.js
14:00 — sessão inicia, user vê alerta:
        [p8-master] 2 libs com gap > 14 dias: stripe, nextjs
        [p8-master] Considerar /p8-master:stay-current

14:01 — User digita: "vamos atualizar o stripe?"
14:01 — Plugin: rotea para /p8-master:stay-current --stripe

14:02 — pesquisador WebFetch stripe.com/docs/upgrades
14:02 — Encontra: nova versão API 2026-04-15 disponível, deprecação de 2025-08-15
        ainda em vigor (P8 usa SDK 22 sem `apiVersion` pinada)

14:03 — Diff gerado em thoughts/atualizacoes/2026-05-10-libs.md:
        - severidade: NÃO-CRÍTICO
        - achado: P8 deveria pinar `apiVersion` em src/lib/stripe.ts pra evitar
          surpresa em upgrade automático

14:03 — User: "/p8-master:plano pinar apiVersion stripe"
14:04 — Plugin: cria plano em thoughts/planos/...
14:05 — Plugin: state/last-update.json atualizado:
        {stripe: {last_checked: "2026-05-10", version: "22.1.0"}}
```

---

## Restrições

- **Nunca afirma fato pós-cutoff sem fonte explícita.** Pesquisador marca `[NÃO VERIFICADO]` se WebFetch falhou.
- **Nunca chuta versão.** Sempre lê de `package.json` ou WebFetch.
- **Nunca assume `currentDate` fixo.** Sempre lê do system context.
- **Background não bloqueia sessão.** Se `currentdate-gap.py` demora >2s, hook continua sem aguardar.
- **Cache não persiste secrets.** `state/last-update.json` só tem versões + datas.

---

## Métricas

`state/last-update.json` permite responder:
- Quando foi último fetch de Stripe? `domains.stripe.last_checked`
- Quantos critical advisories nesta janela? `achados_criticos`
- Plugin está mantido fresco? Cross-domínio: todos com `gap < 30d` = sim

---

## Ver também

- [skills/stay-current/SKILL.md](../skills/stay-current/SKILL.md)
- [skills/update-claude-docs/SKILL.md](../skills/update-claude-docs/SKILL.md)
- [scripts/currentdate-gap.py](../scripts/currentdate-gap.py)
- [agents/pesquisador.md](../agents/pesquisador.md) — regras anti-cutoff
- [references/canonical-sources.md](../references/canonical-sources.md) — fontes canônicas
- [hooks/session-start.ps1](../hooks/session-start.ps1) — disparo em background
