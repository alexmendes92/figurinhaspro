---
name: p8-master:update-claude-docs
description: Auto-ativa quando o usuário pedir pra atualizar referência da documentação Anthropic / Claude Code, "checar docs Claude", ou hook detecta cron semanal. Faz fetch incremental das URLs canônicas (code.claude.com/docs, docs.claude.com/release-notes) e propõe diff em `references/claude-docs/`. Útil pra manter o plugin alinhado com mudanças no Claude Code (hooks, skills, MCPs, plugins).
argument-hint: "[--force pra ignorar gap, default checa só se gap > 7 dias]"
---

Vou checar atualizações da documentação Anthropic / Claude Code: $ARGUMENTS

## Por que essa skill existe

Claude Code lança features/breaking changes regularmente:
- Hooks (novos eventos, matchers, comportamento)
- Skills (descoberta, descrição-otimization, namespaces)
- Plugins (formato, marketplace, hooks)
- MCPs (novos servers, configuração)
- Settings (permissions, statusLine, environment)

Sem checagem regular, o plugin fica desatualizado.

## Sequência

1. **Lê `currentDate` + state:** `state/last-claude-docs-update.json` (separado de `last-update.json` que é pra libs).

2. **Calcula gap:**
   - `gap < 7d` E sem `--force`: skip.
   - `gap >= 7d`: continua.

3. **Spawn `pesquisador` (Sonnet)** em paralelo nas URLs canônicas:
   - `https://docs.claude.com/en/release-notes/claude-code` (release notes Claude Code)
   - `https://docs.claude.com/en/docs/claude-code/changelog` (changelog Claude Code)
   - `https://docs.claude.com/en/docs/claude-code/skills` (skills doc)
   - `https://docs.claude.com/en/docs/claude-code/plugins` (plugins doc)
   - `https://docs.claude.com/en/docs/claude-code/hooks` (hooks doc)
   - `https://docs.claude.com/en/docs/claude-code/mcp` (MCP doc)

4. **Compara com snapshot anterior** em `references/claude-docs/`:
   - Se primeiro fetch: cria snapshot inicial.
   - Se snapshot existe: faz diff entre versões.

5. **Identifica mudanças:**
   - **Breaking** (sintaxe mudou, recurso removido, deprecation curta) → notifica user.
   - **Novo recurso** (nova feature, novo hook, novo MCP) → registra como oportunidade.
   - **Bug fix / clarificação** → registra silencioso.

6. **Gera diff** em `thoughts/atualizacoes/<YYYY-MM-DD>-claude-docs.md`:

```yaml
---
data: <YYYY-MM-DD>
tipo: atualizacao
topico: claude-docs
autor: <user>
projeto: P8-FigurinhasPro
status: ativo
breaking-claude-code: <N>
novos-recursos: <N>
---
```

Conteúdo:
- **Versão Claude Code atual upstream** vs versão usada em P8 (lida via `claude --version` se disponível)
- **Breaking changes desde último fetch** (numerados, com URL fonte)
- **Recursos novos** (numerados, com URL e 1-frase descrição)
- **Recomendações pra plugin P8-MASTER:**
  - Skills/hooks que podem ser refinados com nova feature
  - Hooks que podem ser deprecados se Claude Code migrou
  - Configurações `settings.json` que mudaram

7. **Atualiza snapshot** em `references/claude-docs/<dominio>.md` com conteúdo fetched.

8. **Atualiza** `state/last-claude-docs-update.json`.

9. **Se breaking detectado:** propõe `/p8-master:plano` de migração (ex: "se hooks PreToolUse mudou matcher syntax, propor plano de atualizar `hooks/precommit-router.ps1`").

## Diferença entre `stay-current` e `update-claude-docs`

| Skill | Foco | Frequência |
|---|---|---|
| `stay-current` | Libs externas usadas em P8 (Next, Prisma, Stripe, ...) | gap > 24h (default) |
| `update-claude-docs` | Documentação Anthropic / Claude Code | gap > 7d |

São complementares — uma cuida do código P8, outra cuida do harness.

## Restrições

- **Sempre cita URL + data de acesso** nos diffs.
- **Não invoca em background sem necessidade** — Claude Code muda mais devagar que libs P8 (semanal vs diário).
- **Não modifica plugin automaticamente** baseado em mudança do Claude Code. Sempre propõe `/p8-master:plano` pra humano revisar.
- **Sem rede**: aborta gracioso, registra `[OFFLINE]` em state.

## Quando NÃO usar

- Sessão offline.
- Tarefa não toca configuração do harness.
- `gap < 7d` sem `--force`.

## Modelo recomendado

- **Main session: Sonnet** — fetch + diff incremental.
- **Sub-agent: `pesquisador`** (Sonnet, com WebFetch).

## Ver também

- [skills/stay-current/SKILL.md](../stay-current/SKILL.md) — pra libs (não Claude Code)
- [agents/pesquisador.md](../../agents/pesquisador.md)
- [references/canonical-sources.md](../../references/canonical-sources.md) — também lista fontes Claude Code
