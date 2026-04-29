# AGENTS.md — Gaps vs Checklist Akita

> Gerado por `/akita-bootstrap-auto` em 2026-04-27. Classificação do projeto: **HÍBRIDO** (90 commits, 243 arquivos, AGENTS.md já existe, testes=esqueleto-sem-asserts, CI=build-only).
>
> Este arquivo NÃO substitui o `AGENTS.md` atual. É um relatório de lacunas: o que o template Akita pede e o `AGENTS.md` de hoje não entrega. Humano decide o que importa adotar.

---

## Resumo

`AGENTS.md` atual (233 linhas) é forte em **breaking changes do framework** (Next 16, Prisma 7, Tailwind 4, Zod 4) e **arquitetura específica** (preço em 3 eixos, schema Prisma, padrões server↔client). Falta a camada **operacional/onboarding** que o template Akita prioriza: comandos rápidos, comandos perigosos, gotchas vivos, estado atual da fase.

Tom atual = manual técnico. Tom Akita = onboarding doc descritivo ("aqui é onde X mora", não "NÃO faça Y").

---

## ✅ O que já está bom (manter)

| Seção | Status | Onde |
|---|---|---|
| Stack + versões verificadas | ✅ | Cabeçalho linha 9-11 |
| Breaking changes documentados | ✅ Excelente | Next 16, Prisma 7, Tailwind 4, Zod 4, React 19 |
| Padrões importantes (Lazy Proxy, sticker-types, plan-guards) | ✅ | Seção "Padroes Importantes" |
| Schema Prisma documentado | ✅ | Tabela completa de 18 modelos |
| Sistema de preços (3 eixos) | ✅ | Hierarquia + tabela + funções-chave |
| Banner "this is NOT the Next.js you know" | ✅ | Sinaliza training-data drift logo de cara |

---

## ⚠️ Gaps vs template Akita (`~/.claude/skills/akita-bootstrap/AGENTS.md.template`)

### 1. Falta **Quick Reference** (tabela de comandos no topo)

Template pede um bloco de 1ª olhada com `setup / test / dev / lint / build / deploy`. AGENTS.md atual menciona comandos espalhados em CLAUDE.md, não no AGENTS.md. Onboarding de agente novo precisa achar isso em <30s.

**Sugestão (preenchida com `package.json` real):**

```md
## Quick Reference
| Tarefa             | Comando                              |
| ------------------ | ------------------------------------ |
| Setup inicial      | `npm install`                        |
| Rodar testes       | `npm run test` (vitest run)          |
| Watch testes       | `npm run test:watch`                 |
| Subir dev server   | `npm run dev` (porta 3009, Turbopack)|
| Lint               | `npm run lint` (biome check)         |
| Lint+autofix       | `npm run lint:fix`                   |
| Format             | `npm run format`                     |
| Build              | `npm run build` (prisma generate + next build) |
| Deploy prod        | `npx vercel deploy --prod`           |
| Stripe webhook dev | `stripe listen --forward-to localhost:3009/api/stripe/webhook` |
```

### 2. Falta **Comandos NUNCA seguros** (red list explícita)

Template pede seção dedicada. Útil pra agente saber onde precisa pedir confirmação. Hoje isso só vive em `CLAUDE.md` da raiz Arena Cards e no `.claude/settings.json` (hooks). AGENTS.md é portátil — Codex/Cursor/Aider não leem `.claude/settings.json`.

**Sugestão:**

```md
## Comandos que NUNCA são seguros
- `npx prisma db push` em prod sem backup — mexe no schema do Neon ao vivo
- `npx prisma migrate reset` — apaga dados de dev
- `vercel deploy --prod` sem `npm run build` verde local — risco de quebrar prod
- Qualquer comando que toque `.env*`, `iron-session SESSION_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL`
- `git push --force` em `master`
```

### 3. Falta **Gotchas vivos** (seção que cresce com o tempo)

O AGENTS.md atual documenta breaking changes do framework, mas não as **pegadinhas específicas deste repo** que o agente já tropeçou. Akita defende: cada obstáculo descoberto vira bullet aqui.

**Pegadinhas que já existem implicitamente neste projeto e merecem virar bullet:**

- `src/lib/db.ts` é Lazy Proxy — qualquer import de `prisma` que execute em build time **falha silenciosamente** se DATABASE_URL não tiver valor placeholder. Já está no AGENTS.md como "Padrão Importante", mas merece bullet em Gotchas com o sintoma exato.
- `src/lib/albums.ts` tem **44.781 linhas** (dado hardcoded). Agente que tentar abrir o arquivo inteiro estoura context window. Sempre usar Grep direcionado ou Read com `offset`+`limit`.
- `prisma generate` produz código em `src/generated/prisma/` (gitignored). Após `npm install` em máquina nova, precisa rodar `npm run build` ao menos uma vez ou imports `@/generated/prisma/client` falham.
- `src/__tests__/setup.ts` declara mocks Prisma + Stripe globais (ADR 0005), mas **não há um único arquivo `*.test.ts` em `src/`**. Esqueleto pronto, suíte vazia. Qualquer afirmação tipo "rodei os testes" é vácua hoje.
- Senha legada em texto puro — `src/app/api/auth/login/route.ts` linha 31 faz fallback de bcrypt-compare pra string-equality e **rehasheia no primeiro login**. Sellers antigos podem ter senha em plaintext no DB. Migrar é tech debt aberta.

### 4. Falta **Estado atual do projeto** (fase + não toque + próxima milestone)

Template Akita cobra: "fase atual", "não toque em", "próxima milestone". Hoje essas informações vivem fragmentadas em CLAUDE.md da raiz Arena Cards (seção "Foco de trabalho") e em comentários de PR. AGENTS.md portátil precisa do delta local.

**Sugestão:**

```md
## Estado atual do projeto
- **Fase atual**: produção em manutenção evolutiva. SaaS multi-tenant ativo (`album-digital-ashen.vercel.app`). Cockpit comercial (admin-only) em rollout.
- **Não toque em** sem alinhamento: `src/lib/albums.ts` (dado hardcoded — candidato a migração DB), `src/app/api/auth/login/route.ts` (fallback plaintext em refactor pendente).
- **Próxima milestone**: rede de testes de caracterização nos fluxos críticos (ver `CHARACTERIZATION_TESTS.md`).
```

### 5. Falta **Estrutura de diretórios em forma de árvore**

AGENTS.md atual tem **tabela de arquivos-chave** (em `CLAUDE.md`, não no AGENTS.md), mas não mostra a árvore. Agente novo gasta 3-5 Glob calls pra mapear `src/`. Custo evitável.

**Sugestão (baseada em audit real):**

```md
## Estrutura de diretórios
src/
├── app/                    # Next 16 App Router (~90 arquivos)
│   ├── (auth)/             # login, registro, esqueci-senha, reset-senha, verificar-email
│   ├── api/                # 24 rotas (auth, albums, bot, comercial, inventory, orders, prices, seller, stripe)
│   ├── albuns/[year]/      # galeria pública (album-viewer.tsx — 914 LOC)
│   ├── loja/[slug]/        # storefront público do vendedor
│   ├── onboarding/         # 772 LOC, candidato a quebrar
│   ├── painel/             # admin, comercial, estoque, pedidos, precos, planos, loja
│   └── teste/              # 659 LOC (página de debug ad-hoc)
├── components/             # 37 .tsx (auth, loja, painel, ui)
├── lib/                    # 20 arquivos — albums.ts (44k LOC!), price-resolver.ts, db.ts, auth.ts
├── generated/prisma/       # gitignored — cliente Prisma
└── __tests__/setup.ts      # mocks globais (esqueleto sem testes)
```

### 6. Falta **Links** (repo, issues, docs internas)

Template pede. AGENTS.md atual não tem. Custo zero, valor alto.

**Sugestão:**

```md
## Links
- Repo: github.com/alexmendes92/figurinhaspro (privado)
- Prod: https://album-digital-ashen.vercel.app
- Vercel project: `album-digital`
- Docs internas: `docs/` (ANALISE_UX, PLANO_SAAS_V2, UX_AUDIT_REPORT, etc.)
- ADRs do workspace: `../docs/workspace/adr/`
- Workspace CLAUDE.md (regras Arena): `../CLAUDE.md`
```

### 7. **CLAUDE.md duplica conteúdo do AGENTS.md** (e algumas afirmações divergem do código)

Risco de drift documental. Exemplo concreto detectado pela auditoria:

- `CLAUDE.md` linha "Plan guards: Temporariamente desabilitados (todos retornam `true`) — TODO restaurar"
- Mas `src/lib/plan-limits.ts` **implementa a lógica de verdade** — `checkStickerLimit` faz `db.inventory.count`, `checkOrderLimit` filtra por `startOfMonth`, etc. **Nada retorna `true` cego.**

Documentação afirma um estado que o código não confirma. Risco: agente lê CLAUDE.md e desabilita verificação acreditando que ela já está off. Recomendação: corrigir a frase do CLAUDE.md.

### 8. **Tom proibitivo > tom descritivo** em alguns trechos

`CLAUDE.md` (não AGENTS.md) tem várias frases imperativas em CAPS: `**NUNCA** terminar uma tarefa sem fazer deploy`, `**NUNCA** perguntar "quer que eu faca deploy?"`, `**OBRIGATORIO**`. Akita prefere descrições neutras: "Após cada commit que builda, padrão é `vercel deploy --prod`. Se houver razão pra pular, anote no PR." O efeito prático é mesma disciplina, sem ruído de intimidação.

Fora do escopo deste skill mexer em `CLAUDE.md`, mas vale flag pra próxima passada.

---

## Pendentes que o agente NÃO consegue preencher sozinho ({{PRECISO SABER}})

Coisas que dependem do humano (alex):

- **Deploy alvo do projeto**: confirmado Vercel (visível em `vercel.json` + scripts). ✅ não-pendente.
- **Domínio prod customizado**: hoje é `album-digital-ashen.vercel.app`. Existe domínio próprio planejado? `{{PRECISO SABER — domínio custom}}`.
- **CI gates desejados**: hoje só `build`. Adicionar `lint` e `test` é decisão de fase. `{{PRECISO SABER — quando ligar lint/test no CI}}`.
- **Cobertura mínima desejada** quando os testes existirem (80%? 90%?). `{{PRECISO SABER — coverage threshold}}`.

---

## Próximo passo recomendado (humano decide)

1. **Mais leve** — incorporar Quick Reference + Comandos perigosos + Estado atual + Links no `AGENTS.md` atual (4 seções, ~30 linhas). Não mexer no que já está.
2. **Médio** — também adicionar Gotchas vivos com os 5 bullets propostos acima.
3. **Pesado** — reorganizar `AGENTS.md` inteiro pelo template Akita, mantendo conteúdo técnico de breaking changes em uma seção dedicada no fim.

Recomendação minha: **opção 2**. Mantém o foco em breaking-changes (que é o que diferencia este projeto), mas fecha as lacunas operacionais. Diff esperado: +60 linhas, AGENTS.md final ~290 linhas (ainda dentro do "≤ 300 linhas" desejado pra leitura parcial confiável).
