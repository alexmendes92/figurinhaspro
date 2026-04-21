# Drift Report — P8-FigurinhasPro

> Gerado: 2026-04-20
> Auditor: workspace governance (Fase B do plano de governança documental)
> Política: docs/workspace/00-doc-policy.md
> Stack: Next.js 16 + Prisma 7 + Neon + Sentry + Stripe

## Resumo

- Total divergências: a aprofundar na Fase C
- ALTA: 0 confirmadas nesta auditoria inicial
- MÉDIA: 0 confirmadas nesta auditoria inicial
- BAIXA: 0 confirmadas nesta auditoria inicial

## Escopo desta auditoria

Esta é a **auditoria inicial da Fase B**. Ela cria o artefato exigido pela política em `docs/workspace/00-doc-policy.md` e estabelece ponto de partida para o trabalho profundo da Fase C.

Itens auditados nesta passagem:

- existência do arquivo `CLAUDE.md` na raiz do projeto;
- presença da stack declarada (`next@16`, `prisma@7`, `@sentry/nextjs`, `stripe`);
- modo de deploy manual (`npx vercel deploy --prod` — auto-deploy desativado);
- existência do cockpit comercial admin-only em `/painel/comercial`.

Itens que ainda **não** foram auditados em profundidade nesta passagem:

- contrato de webhook Stripe vs documentação;
- captura de erros Sentry vs configuração documentada;
- auth admin-only do `/painel/comercial`;
- modelos Prisma vs schema real.

## Divergências confirmadas

| # | Doc | Linha | Claim na doc | Realidade no código | Severidade | Ação proposta |
|---|-----|-------|--------------|----------------------|-----------|---------------|

(Nenhuma divergência foi confirmada nesta auditoria inicial. Aprofundamento operacional ocorre na Fase C.)

## Itens em aberto para Fase C

1. Auditar `CLAUDE.md` linha-a-linha contra `package.json`.
2. Auditar `docs/DOCUMENTACAO_NEGOCIO.md` (se existir) — alinhar Sentry/Stripe stack.
3. Auditar `docs/PLANO_SAAS_V2.md` (se existir) — refletir estado atual do produto.
4. Confirmar contrato HMAC do webhook Stripe (`/api/stripe/webhook` ou similar).
5. Confirmar guard admin-only do `/painel/comercial` em `proxy.ts`.

## Notas

- P8 é **FigurinhasPro** — produto de álbum digital com pagamentos Stripe.
- Stripe é payment — qualquer divergência em contrato é severidade ALTA na Fase C.
- Sentry instrumentado para erro tracking.
- Deploy: Vercel **manual** via `npx vercel deploy --prod`. Auto-deploy desativado por escolha.
- Cockpit comercial admin-only em `/painel/comercial`.

## Status final

Auditoria inicial concluída em 2026-04-20. Artefato Fase B criado conforme exige `docs/workspace/00-doc-policy.md`. Aprofundamento operacional fica para a Fase C, com prioridade alta dado que P8 processa pagamentos.
