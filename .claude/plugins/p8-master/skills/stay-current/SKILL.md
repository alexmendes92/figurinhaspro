---
name: p8-master:stay-current
description: Auto-ativa quando o usuário pedir pra verificar atualizações de libs, "checar versões", "atualizar referências", ou hook SessionStart detecta gap > 14 dias desde última checagem em P8-FigurinhasPro. Lê `currentDate` injetado pelo system context, calcula gap vs cutoff do modelo, busca atualizações em 9 fontes canônicas (Next 16, Vercel, Stripe, Prisma 7, Sentry, React 19, Tailwind 4, Zod 4, iron-session), gera diff em `thoughts/atualizacoes/<data>-libs.md`.
argument-hint: "[dominio: nextjs | vercel | stripe | prisma | sentry | react | tailwind | zod | iron-session | all]"
---

Vou checar atualizações de libs para P8-FigurinhasPro: $ARGUMENTS

## Por que essa skill existe

- **Knowledge cutoff** do modelo é janeiro/2026 (Opus 4.7).
- **`currentDate`** injetado é dinâmico — hoje é diferente de amanhã.
- **Libs criticas em P8** lançam patches/breaking changes constantemente — Stripe API, Next 16 minor, Prisma 7.x.

Sem `stay-current`, o plugin fica chutando versões antigas. Com, ele cita versão atual com fonte.

## Sequência

1. **Lê `currentDate`** do system context (formato: `Today's date is 2026-05-10`).

2. **Calcula gap:**
   - `last_checked` em [state/last-update.json](../../state/last-update.json).
   - Se `gap < 24h` E não foi explicitamente invocada com `--force`: skip silencioso.
   - Se `gap >= 24h`: continua.

3. **Determina escopo:**
   - `--all` (default): roda todas as 9 fontes.
   - `--<dominio>`: roda só uma.

4. **Spawn `pesquisador` (Sonnet)** em paralelo nas fontes selecionadas. Cada uma:
   - Usa `WebFetch` na URL canônica (ver [references/canonical-sources.md](../../references/canonical-sources.md)).
   - Busca versão mais recente, breaking changes desde versão usada em P8 (extraído de `package.json`).
   - Cita fonte + data de acesso.

5. **Consolida diffs** em `thoughts/atualizacoes/<YYYY-MM-DD>-libs.md`:

```yaml
---
data: <YYYY-MM-DD>
tipo: atualizacao
topico: libs-checked
autor: <user>
projeto: P8-FigurinhasPro
status: ativo
fontes: [nextjs, vercel, stripe, prisma, sentry, react, tailwind, zod, iron-session]
breaking-criticos: <N>
---
```

Conteúdo por lib:
- **Versão atual em prod (P8):** lida de `package.json`
- **Versão mais recente upstream:** com fonte + data
- **Patches desde última checagem:** lista
- **Breaking changes:** classificados:
  - **Crítico** (security advisory, CVE, deprecation com prazo curto)
  - **Não-crítico** (deprecation longa, mudança opcional)
  - **Patch normal** (bug fix, sem ação)

6. **Classifica severidade total:**
   - **Crítico ≥ 1**: notifica user no início da sessão (mensagem destacada).
   - **Não-crítico ≥ 1**: registra silencioso no relatório.
   - **Sem nada**: ainda assim atualiza `state/last-update.json`.

7. **Atualiza `state/last-update.json`:**
```json
{
  "last_checked": "<currentDate>",
  "checked_at": "<ISO timestamp>",
  "fontes_checadas": ["nextjs", ...],
  "achados_criticos": <N>,
  "achados_total": <N>
}
```

8. **Se houver breaking crítico:** propõe `/p8-master:plano` de upgrade (com pesquisa-base sendo a entrada gerada agora).

## Fontes canônicas

| Domínio | URL primária | Tipo |
|---|---|---|
| Next.js 16 | `https://nextjs.org/blog` | release notes |
| Next.js 16 | `https://github.com/vercel/next.js/releases` | github releases |
| Vercel | `https://vercel.com/changelog` | changelog plataforma |
| Stripe | `https://stripe.com/docs/upgrades` | upgrade guide oficial |
| Stripe | `https://dashboard.stripe.com/release-notes` | dashboard release notes |
| Prisma 7 | `https://github.com/prisma/prisma/releases` | github releases |
| Sentry | `https://github.com/getsentry/sentry-javascript/releases` | github releases |
| React 19 | `https://react.dev/blog` | blog oficial |
| Tailwind 4 | `https://github.com/tailwindlabs/tailwindcss/releases` | github releases |
| Zod 4 | `https://github.com/colinhacks/zod/releases` | github releases |
| iron-session | `https://github.com/vvo/iron-session/releases` | github releases |

Detalhes em [references/canonical-sources.md](../../references/canonical-sources.md).

## Restrições

- **Sempre cita fonte + data de acesso.** "Stripe SDK 23.0.0" sem URL = inventado.
- **Sempre busca em `currentDate`**, nunca em data fixa: `Stripe pricing 2026` → `Stripe pricing <currentDate-year>`.
- **Não chuta versão pós-cutoff.** Se WebFetch falhou, marca `[NÃO VERIFICADO — fonte indisponível]`.
- **Não invoca pesquisador pra info pré-cutoff.** Versão estável de Next 16.0 é conhecimento do modelo.
- **Background-friendly:** hook SessionStart pode disparar com `run_in_background=true`. Skill termina rápido (cache de last-update.json), trabalho pesado fica em paralelo.

## Quando NÃO usar

- Tarefa não envolve libs externas (refactor interno, teste local).
- `gap < 24h` — informação ainda fresca.
- Sessão sem rede (offline) — skill aborta gracioso.

## Modelo recomendado

- **Main session: Sonnet** — orquestra `pesquisador` em paralelo, consolida diffs.
- **Sub-agent: `pesquisador`** (Sonnet) — sabe usar WebFetch + cita fontes.

## Ver também

- [references/canonical-sources.md](../../references/canonical-sources.md) — tabela de URLs
- [scripts/currentdate-gap.py](../../scripts/currentdate-gap.py) — gap math
- [agents/pesquisador.md](../../agents/pesquisador.md)
- [hooks/session-start.ps1](../../hooks/session-start.ps1) — dispara stay-current em background
