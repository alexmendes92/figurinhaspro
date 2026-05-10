---
name: p8-master:pesquisa
description: Auto-ativa quando o usuário pedir pra investigar, mapear, ou entender como o codebase P8-FigurinhasPro funciona em torno de um tópico — antes de planejar mudança. Gera artefato em `thoughts/pesquisas/`, documenta sem propor. Use SEMPRE antes de `/p8-master:plano`.
argument-hint: <tópico de pesquisa>
---

Vou pesquisar o codebase P8-FigurinhasPro sobre: $ARGUMENTS

**Meu único trabalho é documentar e explicar o codebase como ele existe hoje. Não proponho mudanças, não critico, não sugiro melhorias.** Opinião vai pra `/p8-master:plano` ou `/p8-master:hurdle`.

## Sequência

1. **Plano de investigação.** Quebro o tópico em áreas específicas a investigar no contexto P8 (ex: se é "Stripe webhook", investigo `src/app/api/stripe/webhook/route.ts`, `src/lib/stripe.ts`, schema `Order`/`SubscriptionEvent`).

2. **Spawn de sub-agents em paralelo:**
   - `explorador` (modo LOCALIZAR) — onde os componentes vivem em `src/app/`, `src/lib/`, `src/components/`, `prisma/`
   - `explorador` (modo ANALISAR) — como o código funciona em isolamento (com Lazy Proxy db, iron-session, Stripe SDK 22, Prisma 7 driver adapter)
   - `explorador` (modo CAÇAR-PADRÕES) — convenções P8: imports `@/`, Server Components default, mocks Vitest em `src/__tests__/setup.ts`
   - `historiador` (modo LOCALIZAR) — pesquisas/planos/decisões antigas em `thoughts/`, mais `output/01..06.md` e `output/99-oracle-master.md`

3. **Síntese.** Compilo achados, priorizando o codebase ativo sobre histórico. Cito linha sempre que possível (`src/lib/auth.ts:42`).

4. **Metadata.** Rodo `pwsh -File .claude/plugins/p8-master/scripts/spec-metadata.ps1` para coletar SHA/branch/data.

5. **Geração do artefato** em `thoughts/pesquisas/YYYY-MM-DD-<slug>.md` com frontmatter:

```yaml
---
data: <YYYY-MM-DD>
tipo: pesquisa
topico: <slug>
autor: <user>
projeto: P8-FigurinhasPro
relacionados: []
status: ativo
sha: <git SHA>
branch: <branch>
---
```

6. **Sumário.** Mostro o caminho do arquivo gerado e os achados-chave (5-10 bullets, com path:linha).

7. **Follow-ups.** Atualizo o mesmo documento se você fizer perguntas adicionais sobre o tópico (não crio outro).

## Restrições estritas

- **Não invento contexto.** Sub-agent não encontrou? Registro "não encontrado" — não preencho com inferência.
- **Não critico implementação no artefato.** Pesquisa documenta; opinião vai pra `/p8-master:plano` (próxima fase) ou `/p8-master:hurdle`.
- **Não pulo metadata.** Sem SHA/branch/data, artefato fica órfão pro `historiador` em sessões futuras.
- **Não modifico o código.** Pesquisa é read-only.

## Quando o tópico já tem pesquisa relevante

Antes de gerar artefato novo, peço ao `historiador` (modo LOCALIZAR) por pesquisas em `thoughts/pesquisas/` com `topico` parecido nos últimos 30 dias. Se houver:

- Verificar se [arquivos citados] tiveram commits desde a data da pesquisa (`git log --since=<data> -- <arquivo>`).
- Sem commits: reuso a pesquisa existente, anuncio o caminho.
- Com commits: gero pesquisa nova com `relacionados: [pesquisas/<antiga>.md]` no frontmatter.

## Modelo recomendado

- **Main session: Opus** (default) — orquestra os 4 sub-agents e faz síntese cross-source.
- **Sub-agents delegados** rodam em Sonnet pelo frontmatter próprio.
- **Casos triviais** (tópico de 1-2 arquivos): `/model sonnet` antes — sem perda.

## Ver também

- [agents/explorador.md](../../agents/explorador.md) — protocolo dos 3 modos
- [agents/historiador.md](../../agents/historiador.md) — busca em `thoughts/`
- [templates/pesquisa.md](../../templates/pesquisa.md) — template do artefato
