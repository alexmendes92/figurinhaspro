# Fontes canônicas para `stay-current` e `update-claude-docs`

> Tabela das URLs canônicas que `/p8-master:stay-current` e `/p8-master:update-claude-docs` consultam para verificar atualizações.

---

## Stay-current — libs do P8-FigurinhasPro

| Domínio | URL primária | Tipo | Notas |
|---|---|---|---|
| **nextjs** | https://nextjs.org/blog | release notes | Posts oficiais + canary releases |
| **nextjs** | https://github.com/vercel/next.js/releases | github releases | Lista exaustiva |
| **vercel** | https://vercel.com/changelog | changelog | Plataforma + Functions + Edge |
| **stripe** | https://stripe.com/docs/upgrades | upgrade guide | Versões da API + breaking changes |
| **stripe** | https://dashboard.stripe.com/release-notes | release notes | Dashboard release notes (login obrigatório) |
| **prisma** | https://github.com/prisma/prisma/releases | github releases | Inclui CLI + client + adapters |
| **sentry** | https://github.com/getsentry/sentry-javascript/releases | github releases | `@sentry/nextjs` é parte do mono |
| **react** | https://react.dev/blog | blog oficial | Posts mais discursivos |
| **react** | https://github.com/facebook/react/releases | github releases | Lista exaustiva |
| **tailwind** | https://github.com/tailwindlabs/tailwindcss/releases | github releases | Inclui v4 + plugins |
| **zod** | https://github.com/colinhacks/zod/releases | github releases | v4 reescrita completa |
| **iron-session** | https://github.com/vvo/iron-session/releases | github releases | Patches de segurança são raros mas críticos |

### Versões usadas em P8 (lê de `package.json`)

| Lib | Versão atual em P8 | Notas |
|---|---|---|
| Next.js | 16.2.4 | Turbopack default, React Compiler ativo |
| React | 19.2.5 | Compiler torna useMemo/useCallback obsoletos |
| Prisma | 7.7.0 | `prisma.config.ts`, generator `prisma-client` novo |
| TypeScript | 5 | `tsc --noEmit` no gate |
| Tailwind CSS | 4 | CSS-first via `@theme inline` |
| Zod | 4.3.6 | reescrita; APIs diferentes de v3 |
| Vitest | 4.1.4 | environment: node, mocks Prisma + Stripe |
| Biome | 2.4.12 | formatter + linter único |
| Stripe | 22 | `webhooks.constructEvent` obrigatório |
| iron-session | 8 | SESSION_PASSWORD ≥ 32 chars |
| Sentry | 10.49 | inativo (DSN opcional, não testado) |
| bcryptjs | 3 | hash de senhas |
| Sharp | latest | processamento de imagens |

---

## Update-claude-docs — Anthropic / Claude Code

| Domínio | URL | Tipo |
|---|---|---|
| **release-notes** | https://docs.claude.com/en/release-notes/claude-code | release notes Claude Code |
| **changelog** | https://docs.claude.com/en/docs/claude-code/changelog | changelog Claude Code |
| **skills** | https://docs.claude.com/en/docs/claude-code/skills | doc skills (formato, descrição-otim) |
| **plugins** | https://docs.claude.com/en/docs/claude-code/plugins | doc plugins (.claude-plugin/, marketplace) |
| **hooks** | https://docs.claude.com/en/docs/claude-code/hooks | doc hooks (eventos, matchers) |
| **mcp** | https://docs.claude.com/en/docs/claude-code/mcp | doc MCP (servers, configuração) |
| **settings** | https://docs.claude.com/en/docs/claude-code/settings | doc settings.json (permissions, statusLine) |
| **sub-agents** | https://docs.claude.com/en/docs/claude-code/sub-agents | doc sub-agents customizados |
| **slash-commands** | https://docs.claude.com/en/docs/claude-code/slash-commands | doc slash commands |

---

## Pesquisa de mercado (Oracle pesquisador)

URLs adicionais que `agents/pesquisador.md` pode consultar — não são monitoradas continuamente, mas são fontes confiáveis para passos específicos do Oracle:

| Categoria | URL | Quando |
|---|---|---|
| Best practices UX | https://www.nngroup.com/articles/ | Estratégia Designer |
| Design systems | https://m3.material.io/, https://polaris.shopify.com/ | Estratégia Designer |
| Concorrentes figurinhas | mercadolivre.com.br, shopee.com.br | Estratégia Geral / Marketing |
| Stack survey | https://stackoverflow.com/trends | Estratégia Estrutura |

---

## Convenções de uso

- **Sempre** incluir `currentDate` ou ano corrente nas queries WebSearch para evitar resultados antigos.
- **Sempre** citar fonte + data de acesso nos diffs.
- **Nunca** afirmar fato pós-cutoff (`January 2026` para Opus 4.7) sem fonte explícita fetched na sessão.
- **Cache mental** durante a sessão: se `pesquisador` acabou de buscar "Stripe pricing 2026", reusa em vez de re-buscar.

---

## Atualização desta tabela

Se descobrir fonte canônica nova ou URL mudou:
1. Use `/p8-master:hurdle "nova fonte canonical: ..."` para propor edit.
2. Aprovação humana → edit aplicado em `references/canonical-sources.md`.
3. `state/last-update.json` reseta o domínio afetado.
