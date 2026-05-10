# Protótipo — Modal de limite contextual com ROI

Protótipo isolado para validar a hipótese **H1** definida em `output/05-prototipo-definicao.md`:

> Modal contextual com ROI converte FREE→PRO mais que pricing genérico.

**Branch:** `prototype/modal-roi`. **Nunca merged em master.**

## Estrutura

| Caminho | Propósito |
|---|---|
| `src/components/proto/copy-variants.ts` | Map de 5 variantes (V1-V5) |
| `src/components/proto/plan-limit-modal-preview.tsx` | Componente standalone do modal |
| `src/app/proto/modal-roi/page.tsx` | Rota base com query params |
| `src/app/proto/modal-roi/[variant]/page.tsx` | Rota dinâmica por variante |
| `src/app/proto/modal-roi/galeria/page.tsx` | Galeria interna (uso do fundador) |

## URLs do protótipo

Substitua `<preview>` pela URL Vercel preview da branch (ex: `album-digital-git-prototype-modal-roi-<hash>.vercel.app`).

### Galeria interna (uso do fundador, NÃO compartilhar)

```
https://<preview>/proto/modal-roi/galeria
```

### Rotas das 5 variantes (compartilhar com Rodrigos)

| Variante | URL | Hipótese |
|---|---|---|
| V1 (controle) | `https://<preview>/proto/modal-roi/v1` | Pricing direto convence quando ROI fica explícito |
| V2 | `https://<preview>/proto/modal-roi/v2` | Diluir preço em diário reduz fricção psicológica |
| V3 | `https://<preview>/proto/modal-roi/v3` | Comparação concreta (2 pacotes) vence comparação genérica |
| V4 | `https://<preview>/proto/modal-roi/v4` | Tempo até payback é o gatilho de decisão |
| V5 | `https://<preview>/proto/modal-roi/v5` | Janela temporal da Copa pesa mais que ROI racional |

### Parâmetros opcionais

Todas as rotas aceitam:
- `?denied=<n>` — figurinhas negadas (default `15`)
- `?priceAvg=<n>` — preço médio em reais (default `12.50`, aceita `,` ou `.` como separador decimal)

Exemplo personalizando: `https://<preview>/proto/modal-roi/v3?denied=23&priceAvg=8,50`.

## Roteiro pra DM (3 perguntas, sem viés de produto)

> Importante: não pergunte "achou bonito?" ou "o que mudaria?" — puxa pra design, não pra decisão de compra.

1. **Oi [nome], tudo bem?** Tô validando uma ideia de produto pra quem vende figurinhas. Você ainda tá vendendo Copa 2026?
2. **Se você visse esse modal aparecendo enquanto cadastra figurinhas** [link da variante], **você clicaria em "Assinar PRO"?** (sem certo/errado — queria sua reação honesta)
3. **Por quê?** O que te fez clicar / não clicar?

## Critério binário de validação

**H1 valida sim** se ≥2 dos ≥3 Rodrigos consultados respondem "clicaria" sob qualquer das 5 variantes (anotar qual venceu).

**H1 valida não** se ≥2 dos ≥3 respondem "não clicaria" mesmo na melhor variante, OU justificativa dominante é "R$ 49 ainda é caro mesmo com a conta".

**Indeciso** (1 sim / 1 não / 1 talvez) → mais 2 Rodrigos antes de decidir, **não inferir**.

## Como gerar screenshots

Via Playwright MCP (já instalado no Claude Code):

```bash
# 5 variantes × 2 viewports (375px + 1280px) = 10 capturas
# Usa browser_navigate + browser_resize + browser_take_screenshot.
# Salva em prototype/modal-roi/screenshots/<variant>-<viewport>.png.
```

## Plano B se H1 invalidar

Se ≥2 Rodrigos disserem "R$ 49 ainda é caro mesmo com a conta de R$ 187,50", testar antes de descartar:

- **V6** — "Pague apenas quando cobrir o investimento" (modelo trial 14 dias).
- **V7** — "Plano BÁSICO R$ 19/mês com 250 figurinhas" (pricing menor + limite intermediário).

## Como descartar

### Se H1 valida positivamente (≥2 clicariam)

- Branch fica em "shelf" por 30 dias.
- PR-F do Designer (modal real em produção) é criado em **branch nova** `feat/plan-limit-modal-prod`, partindo de `master`, usando este protótipo apenas como referência visual (copy-paste manual, não cherry-pick).
- Após PR-F merged em master e em produção por ≥7 dias, deletar `prototype/modal-roi`:
  ```
  git branch -D prototype/modal-roi
  git push origin --delete prototype/modal-roi
  ```

### Se H1 invalida (≥2 não clicariam)

- Deletar branch imediatamente:
  ```
  git branch -D prototype/modal-roi
  git push origin --delete prototype/modal-roi
  ```
- Registrar feedback (justificativa dominante, qual variante chegou mais perto, hipótese H1 marcada como rejeitada com data) em `output/06-prototipo-criacao.md`.
- PR-F do Designer **não acontece** sem nova hipótese alternativa validada (voltar para Step 2 da Definição de Protótipo com nova hipótese).

### Em todos os casos

**Zero código de `prototype/modal-roi` chega em produção.** Reaproveitamento visual em PR-F é manual e revisado, não merge automático.

## Avisos

- Rotas `/proto/*` são **públicas** (security by obscurity). Não indexar (sem sitemap/robots).
- CTA "Assinar PRO" não redireciona — só dispara `alert()` + `console.log`. Não cobra ninguém.
- Sem auth, Prisma, Stripe ou telemetria. ROI é cálculo client-side simples (`denied × priceAvg`).
- Branch isolada nunca é merged em master.
