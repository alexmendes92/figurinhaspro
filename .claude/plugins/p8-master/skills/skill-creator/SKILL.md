---
name: p8-master:skill-creator
description: Auto-ativa quando o usuário pedir pra criar/refinar uma skill do plugin P8-MASTER, otimizar descrição (triggers Akita-style "pushy"), gerar evals JSON, ou aplicar proposta aprovada vinda de `/p8-master:lessons-audit`. Sempre exige aprovação humana antes de editar SKILL.md.
argument-hint: "<acao>: create | refine <skill-name> | apply-proposal <path> | optimize-description <skill-name>"
---

Vou trabalhar a skill: $ARGUMENTS

## Modos

### Mode 1: `create <skill-name>`

Cria nova skill em `skills/<skill-name>/SKILL.md`.

1. **Pergunta:** propósito da skill, trigger principal, args, output esperado.
2. **Gera SKILL.md** seguindo padrão P8-MASTER:
   - Frontmatter `name: p8-master:<skill-name>`, description "pushy" (auto-ativa quando..., NÃO É OPCIONAL...).
   - Sequência numerada (passos do que a skill faz).
   - Modelo recomendado (Haiku/Sonnet/Opus + justificativa).
   - Restrições (não modifica X, não pula gate Y).
   - "Ver também" com links pra skills/scripts/agents relacionados.
3. **Gera evals iniciais** em `evals/<skill-name>.evals.json` com 2-3 casos.
4. **Atualiza `tests/integration/test_skill_orchestrator.ps1`** adicionando verificação da skill nova.
5. **GATE HUMANO:** mostra arquivos gerados, pede aprovação antes de criar.

### Mode 2: `refine <skill-name>`

Refina SKILL.md existente.

1. **Lê** `skills/<skill-name>/SKILL.md` atual.
2. **Pergunta:** o que precisa mudar (description mais pushy, sequência mais clara, restrições novas, etc).
3. **Mostra diff proposto.**
4. **GATE HUMANO:** aprovação antes de aplicar.
5. **Aplica edit** + bumpa `plugin.json` patch (X.Y.**Z**+1).

### Mode 3: `apply-proposal <path>`

Aplica proposta aprovada vinda de `/p8-master:lessons-audit`.

1. **Lê** `thoughts/auto-melhoria/<arquivo>.md` (status: rascunho ou aprovado).
2. **Confere status:** se ainda `rascunho`, pergunta "Aprovar e aplicar agora?".
3. **Aplica diffs** descritos na proposta:
   - Se categoria A (erro recorrente): edit em CLAUDE.md/AGENTS.md/SKILL.md.
   - Se categoria B (sequência repetida): cria `scripts/auto-generated/<slug>.ps1` ou skill nova.
   - Se categoria C (skill lenta): refina description (encolhe, remove exemplos longos).
   - Se categoria D (skill mal-acionada): refina trigger words em description.
4. **Bumpa `plugin.json`:**
   - patch (X.Y.**Z**) — edit em docs/SKILL.md.
   - minor (X.**Y**.0) — script novo, skill nova, agent novo.
5. **Atualiza `CHANGELOG.md`** com entrada `[auto-melhoria]`.
6. **Atualiza proposta** pra `status: ativo` (após aplicada) e move pra `thoughts/auto-melhoria/_aplicadas/`.
7. **Roda `tests/run-all.ps1`** pra confirmar que nada quebrou.
8. **Commit** com mensagem `feat(p8-master): aplicar proposta auto-melhoria <slug>`.

### Mode 4: `optimize-description <skill-name>`

Otimiza apenas o campo `description` no frontmatter.

1. **Lê** SKILL.md atual.
2. **Roda heurísticas:**
   - É curto (< 150 caracteres)? → Adiciona triggers ("auto-ativa quando...", "use SEMPRE quando...")
   - Tem exemplos longos no body que poderiam estar concentrados na description? → Move concisos.
   - Trigger words batem com o que user tipicamente diz? → Refina a partir de sinais reais (de `lessons-audit`).
3. **Mostra antes/depois.**
4. **GATE HUMANO:** aprovação.
5. **Aplica edit** + bumpa patch.

## Padrão de description "pushy" (P8-MASTER)

Description deve:
- Começar com "Auto-ativa quando..." (gatilho explícito).
- Listar 2-3 triggers verbais (palavras que user tipicamente diz).
- Mencionar "P8-FigurinhasPro" ou contexto do domínio.
- Terminar com "use SEMPRE..." ou "NÃO É OPCIONAL".

**Exemplo bom (skill `pesquisa`):**
> "Auto-ativa quando o usuário pedir pra investigar, mapear ou entender como o codebase P8-FigurinhasPro funciona em torno de um tópico — antes de planejar mudança. Gera artefato em `thoughts/pesquisas/`, documenta sem propor. Use SEMPRE antes de `/p8-master:plano`."

**Exemplo ruim:**
> "Pesquisa codebase." (curto, sem trigger, sem contexto, sem regra de uso)

## Versionamento

| Tipo de mudança | Bump |
|---|---|
| Edit em description / docs / SKILL.md body | patch (0.X.Y → 0.X.**Y+1**) |
| Skill nova OU agent novo OU script novo | minor (0.**X**.Y → 0.**X+1**.0) |
| Breaking change na interface dos slash commands | major (**X**.Y.Z → **X+1**.0.0) |

## Restrições

- **Sempre exige aprovação humana antes de editar SKILL.md / CLAUDE.md / AGENTS.md.**
- **Não bumpa versão sem mudança real** (não cria patch fantasma).
- **Não aplica proposta sem rodar `tests/run-all.ps1`** depois.
- **Não cria skill sem evals iniciais** (mínimo 2 casos).
- **Não cria skill que duplica outra existente** — checa se já há skill com função similar.

## Modelo recomendado

- **Main session: Sonnet** — refinar description / aplicar diff é texto estruturado.
- **Opus** se tiver que decidir entre 2 abordagens (criar nova skill OU refinar existente).

## Ver também

- [skills/lessons-audit/SKILL.md](../lessons-audit/SKILL.md) — fonte das propostas
- [evals/](../../evals/) — formato dos arquivos JSON
- [.claude-plugin/plugin.json](../../.claude-plugin/plugin.json) — versão atual
- [CHANGELOG.md](../../CHANGELOG.md) — registro de bumps
