---
data: <YYYY-MM-DD>
tipo: revisao
topico: <slug-curto>
autor: <email>
projeto: P8-FigurinhasPro
relacionados: [planos/<arquivo>.md]
status: ativo
sha: <git short SHA>
branch: <branch>
plano_revisado: <path do plano>
---

# Revisão: <título do plano revisado>

## Resumo

<1-2 frases. Plano aprovado / aprovado com ressalvas / reprovado.>

## Issues por severidade

### CRÍTICO (bloqueia aprovação)

1. **<linha do plano:item>** — <descrição do issue>
   - Proposta de fix: <código/texto>

### IMPORTANTE (corrigir antes de implementar)

1. **<linha>** — <descrição>
   - Proposta: <texto>

### MENOR (considere)

1. **<linha>** — <descrição>

## Checklist P8 (resultado)

- [ ] Gate pre-commit declarado em todas as fases
- [ ] Schema Prisma com gate `db push` (se aplicável)
- [ ] Stripe webhook com plano de teste (se aplicável)
- [ ] Plan limits considerados (se aplicável)
- [ ] Sentry considerado (se aplicável)
- [ ] iron-session/auth tocado corretamente (se aplicável)
- [ ] Cockpit comercial admin-only (se aplicável)
- [ ] Custom albums slug `custom_*` (se aplicável)
- [ ] Next 16 async APIs (se aplicável)
- [ ] Prisma 7 driver adapter (se aplicável)
- [ ] Deploy obrigatório com gate humano

## Recomendação

- [ ] APROVADO — promover para `status: ativo`
- [ ] APROVADO COM RESSALVAS — aplicar fixes via `/p8-master:itera` antes
- [ ] REPROVADO — retrabalhar via `/p8-master:plano` novo

---

> Revisão não modifica o plano. `/p8-master:itera` aplica os fixes após aprovação humana.
