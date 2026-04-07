# Estudo Critico — Subagentes Claude Code para o Ecossistema Arena Cards

## Escopo

Este documento substitui a versao anterior por uma analise em **3 camadas reais** do seu setup:

1. `C:\Users\conta\.claude`
2. `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards`
3. projetos individuais, com foco especial em `8 - FigurinhasPro`

Objetivo:

- separar o que deve ser **global**
- separar o que deve ser **do ecossistema Arena Cards**
- separar o que deve ser **especifico por projeto**
- evitar que regras de um projeto contaminem outro
- definir uma implantacao de subagentes que faca sentido para o seu projeto principal

---

## Base analisada

## Camada 1 — Global do usuario

Arquivos revisados em `C:\Users\conta\.claude`:

- `C:\Users\conta\.claude\CLAUDE.md`
- `C:\Users\conta\.claude\settings.json`
- `C:\Users\conta\.claude\docs\workflow-7-fases.md`
- `C:\Users\conta\.claude\docs\structure.md`
- `C:\Users\conta\.claude\docs\performance-profile.md`
- `C:\Users\conta\.claude\hooks\README.md`
- `C:\Users\conta\.claude\agents\planner-profundo.md`
- `C:\Users\conta\.claude\agents\reviewer-profundo.md`
- `C:\Users\conta\.claude\agents\architect-review.md`
- `C:\Users\conta\.claude\agents\executor-equilibrado.md`
- `C:\Users\conta\.claude\agents\explorer-rapido.md`
- `C:\Users\conta\.claude\agents\implementer-fast.md`
- `C:\Users\conta\.claude\agents\simplifier.md`
- `C:\Users\conta\.claude\rules\tools.md`
- `C:\Users\conta\.claude\rules\workflow.md`
- `C:\Users\conta\.claude\rules\arena-cards.md`
- `C:\Users\conta\.claude\commands\plan.md`
- `C:\Users\conta\.claude\commands\review.md`
- `C:\Users\conta\.claude\commands\desenvolver.md`
- `C:\Users\conta\.claude\skills\desenvolvimento-7-fases\SKILL.md`
- `C:\Users\conta\.claude\skills\code-reviewer\SKILL.md`
- `C:\Users\conta\.claude\skills\testing-patterns\SKILL.md`
- `C:\Users\conta\.claude\skills\performance-audit\SKILL.md`
- `C:\Users\conta\.claude\skills\arena-preflight\SKILL.md`
- `C:\Users\conta\.claude\skills\arena-deploy\SKILL.md`

## Camada 2 — Ecossistema Arena Cards

Arquivos revisados em `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards`:

- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\CLAUDE.md`
- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\.claude\launch.json`

Tambem considerei a estrutura real desta raiz:

- `1 - Sistema Arena Cards`
- `2 - Gestão Arena Cards`
- `3 - CRM Arena Cards`
- `4 - CRM Colecionaveis`
- `5 - Sistema Extrator`
- `6 - Gestão Mercado Livre`
- `7 - Documentação da Vertex AI`
- `8 - FigurinhasPro`
- `9 - Arena Command Center`
- `10 - StickerScan`
- `11 - Vertex Planejador`

## Camada 3 — Projeto alvo atual

Arquivos revisados em `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro`:

- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro\AGENTS.md`
- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro\CLAUDE.md`
- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro\.claude\settings.json`
- `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro\.claude\skills\next16-prisma7\SKILL.md`

---

## Conclusao Executiva

O erro da versao anterior foi tratar o FigurinhasPro como se ele estivesse solto, quando na pratica ele faz parte de um **workspace principal maior**, com:

- 10 projetos ativos
- stacks diferentes
- processos de deploy diferentes
- ferramentas compartilhadas
- contexto operacional compartilhado

Isso muda a analise.

O desenho correto nao e:

- um `.claude` global tentando ser detalhado o suficiente para todos os projetos

Tambem nao e:

- cada projeto se comportando como se fosse um universo isolado

O desenho correto para voce e:

1. `C:\Users\conta\.claude`
   - regras globais de seguranca, workflow e modelos
2. `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards`
   - orquestracao do ecossistema, mapa de projetos, rotas de deploy, navegacao entre stacks
3. cada projeto
   - regras de stack, hooks locais, skills especializadas e agentes locais

Em termos de subagentes, isso significa:

- o **global** nao deve carregar conhecimento especifico de Arena/Firebase/FigurinhasPro
- a **raiz Arena Cards** deve ter apenas o conhecimento de navegacao/orquestracao entre projetos
- o **FigurinhasPro** deve ter os agentes realmente alinhados com Next.js 16, Prisma 7, React Compiler e Stripe

---

## O Que Esta Correto em Cada Camada

## Camada 1 — `C:\Users\conta\.claude`

### O que esta bom

1. Estrutura autoral separada de estado operacional
2. Hooks globais de protecao
3. Workflow de 7 fases como disciplina geral
4. Separacao de papeis por agente
5. Comandos operacionais como `/plan`, `/review`, `/desenvolver`

### O que isso deve continuar sendo

Essa camada deve continuar servindo para:

- higiene de sessao
- protecao contra comandos destrutivos
- checklists de review
- orquestracao de modelos
- principios gerais de uso de agentes

Ela **nao** deve ser a fonte principal de:

- deploy especifico de P1, P8, P10 etc.
- regras de stack de Next 16 por projeto
- comandos de negocio ou fluxo local de um app especifico

## Camada 2 — `Arena Cards` raiz

### O que esta bom

O arquivo [CLAUDE.md](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/CLAUDE.md) na raiz acerta no que realmente importa nesta camada:

- mapa dos projetos
- stack de cada projeto
- portas
- deploy
- repos
- servicos compartilhados
- regra de navegacao: identificar o projeto e ir para o `CLAUDE.md` local

Isso e exatamente o papel certo da raiz.

### O que essa camada deve continuar sendo

Ela deve ser uma **camada de roteamento e governanca**, nao uma camada de implementacao detalhada.

Ou seja:

- quando estiver na raiz, o sistema precisa decidir **qual projeto** esta em jogo
- so depois entra no detalhe tecnico do projeto escolhido

## Camada 3 — Projeto local

No FigurinhasPro, a base atual tambem esta boa:

- `AGENTS.md` esta forte e atualizado
- `CLAUDE.md` local esta orientado ao repo
- `.claude/settings.json` local tem hooks proprios
- `next16-prisma7` cobre o stack mais sensivel

Essa camada e onde o conhecimento mais especifico deve viver.

---

## O Que Esta Errado na Distribuicao Atual de Responsabilidades

## 1. O `.claude` global esta carregando contexto demais de Arena

Exemplos:

- `C:\Users\conta\.claude\rules\arena-cards.md`
- `C:\Users\conta\.claude\skills\arena-preflight\SKILL.md`
- `C:\Users\conta\.claude\skills\arena-deploy\SKILL.md`

Problema:

- a camada global do usuario esta absorvendo regras que deveriam estar na raiz do ecossistema ou nos projetos
- isso aumenta o risco de aplicar instrucoes de um projeto no lugar errado

**Critica:** o `.claude` global esta parcialmente contaminado por contexto de workspace.

## 2. A raiz `Arena Cards` ainda nao esta sendo usada como camada de policy tecnica leve

Hoje a raiz tem um bom [CLAUDE.md](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/CLAUDE.md), mas quase nao tem uma `.claude` propria alem de [launch.json](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/.claude/launch.json).

Isso cria um buraco:

- o global fica pesado demais
- o projeto local fica estreito demais
- falta uma camada intermediaria para regras do ecossistema

**Critica:** o workspace principal esta bem documentado, mas subinstrumentado.

## 3. O roteamento de modelo no global esta caro

No global, hoje, o default ainda pende para **Opus**:

- `C:\Users\conta\.claude\settings.json`
- `C:\Users\conta\.claude\CLAUDE.md`
- `C:\Users\conta\.claude\docs\performance-profile.md`

Para um workspace com muitos projetos e muita tarefa de navegacao, isso e caro demais como policy-base.

No ecossistema Arena Cards, voce tem:

- tarefas de exploracao
- tarefas administrativas
- comparacoes entre projetos
- leitura de docs
- manutencao simples

Isso tudo **nao** deveria partir de Opus por default.

**Critica:** o default global em Opus ate pode funcionar para qualidade, mas nao e ideal para um workspace principal multi-repo.

## 4. Falta uma politica clara de "qual camada manda"

Hoje a hierarquia existe de fato, mas nao esta plenamente formalizada:

- `C:\Users\conta\.claude`
- raiz `Arena Cards`
- projeto local

O problema pratico e que instrucoes podem colidir.

**Critica:** falta documentar explicitamente a precedencia entre camadas.

---

## Hierarquia Correta de Autoridade

Para o seu caso, a regra deveria ser esta:

1. **Projeto local manda no comportamento tecnico do codigo**
   - stack
   - hooks locais
   - build
   - deploy
   - convencoes de codigo

2. **Raiz Arena Cards manda na navegacao entre projetos**
   - qual projeto e afetado
   - como localizar o repo certo
   - qual stack esta em jogo
   - que servicos compartilhados existem

3. **`C:\Users\conta\.claude` manda nas politicas gerais**
   - seguranca
   - higiene
   - modelo por tipo de tarefa
   - workflow generico

Se eu fosse escrever isso em uma linha:

**global protege, raiz roteia, projeto executa.**

---

## Analise Critica do Que Deve Ficar em Cada Lugar

## Deve ficar em `C:\Users\conta\.claude`

- hooks globais de seguranca
- regras de higiene de sessao
- workflow de 7 fases
- templates genericos de review
- agentes genericos de planejamento, review e exploracao
- policy de modelos

## Deve sair de `C:\Users\conta\.claude`

- skills de deploy de projeto especifico
- checklists ligados a um unico produto
- mapa dos projetos Arena Cards
- comandos altamente dependentes de stack local

## Deve ficar na raiz `Arena Cards`

- mapa de projetos e stacks
- criterio para identificar qual projeto esta envolvido
- rotas de deploy por projeto
- portas e servicos compartilhados
- comandos de navegacao do ecossistema
- possivel skill de "escolha do projeto correto" ou "triagem de workspace"

## Deve ser criado na raiz `Arena Cards`

Em `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\.claude\` eu recomendaria criar:

- `skills/workspace-triage/SKILL.md`
  - identifica quais projetos sao afetados por um pedido
- `skills/cross-project-impact/SKILL.md`
  - checklist para mudancas que cruzam P1/P2/P8/P9 etc.
- `commands/router.md`
  - comando para classificar a tarefa e apontar o cwd correto
- `docs/layers.md`
  - explicando a hierarquia global -> workspace -> projeto

Hoje, essa camada esta subaproveitada.

## Deve ficar no projeto local

No FigurinhasPro:

- regras de Next 16
- Prisma 7
- React Compiler
- Stripe
- deploy Vercel especifico
- hooks do repo
- agents alinhados ao repo

---

## O Que Eu Mudaria no Global (`C:\Users\conta\.claude`)

## Prioridade Alta

### 1. Mudar o modelo padrao para Sonnet

Arquivos:

- `C:\Users\conta\.claude\settings.json`
- `C:\Users\conta\.claude\CLAUDE.md`
- `C:\Users\conta\.claude\docs\performance-profile.md`

Motivo:

- o workspace principal tem muitas tarefas que nao justificam Opus
- economiza uso incluido do Max
- deixa Opus para planejamento e review

### 2. Corrigir divergencia de auto-compact

Arquivos:

- `C:\Users\conta\.claude\settings.json`
- `C:\Users\conta\.claude\docs\performance-profile.md`

Motivo:

- hoje a documentacao e a configuracao nao batem

### 3. Remover worktree onde nao agrega

Arquivos:

- `C:\Users\conta\.claude\agents\explorer-rapido.md`
- `C:\Users\conta\.claude\agents\executor-equilibrado.md`

Motivo:

- worktree para agente read-only e overhead
- worktree para todo executor e exagero

### 4. Tirar contexto Arena do global

Arquivos candidatos:

- `C:\Users\conta\.claude\rules\arena-cards.md`
- `C:\Users\conta\.claude\skills\arena-preflight\SKILL.md`
- `C:\Users\conta\.claude\skills\arena-deploy\SKILL.md`

Motivo:

- isso pertence mais a raiz do ecossistema ou ao projeto

## Prioridade Media

### 5. Dividir `architect-review`

Arquivo:

- `C:\Users\conta\.claude\agents\architect-review.md`

Melhoria:

- `architect-opus` sem web
- `architect-research` com web

### 6. Endurecer `implementer-fast`

Arquivo:

- `C:\Users\conta\.claude\agents\implementer-fast.md`

Melhoria:

- promover para Sonnet
- ou restringir muito mais o escopo de escrita

### 7. Atualizar skills genericos para stacks modernas

Arquivos:

- `C:\Users\conta\.claude\skills\performance-audit\SKILL.md`
- `C:\Users\conta\.claude\skills\testing-patterns\SKILL.md`
- `C:\Users\conta\.claude\skills\code-reviewer\SKILL.md`

Motivo:

- hoje ainda carregam conselhos genericos demais
- alguns conflitam com React Compiler e com stacks locais

---

## O Que Eu Mudaria na Raiz `Arena Cards`

Esta e a parte que faltava considerar.

## Prioridade Alta

### 1. Formalizar a camada de workspace

Criar em `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\.claude\`:

- `docs/layers.md`
- `commands/router.md`
- `skills/workspace-triage/SKILL.md`

Motivo:

- hoje o [CLAUDE.md](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/CLAUDE.md) faz bem o papel documental
- falta transformar isso em workflow operacional reutilizavel

### 2. Mover regras de Arena do global para a raiz do workspace

Itens candidatos:

- `arena-preflight`
- `arena-deploy`
- mapa de projetos Arena

Motivo:

- eles sao do ecossistema Arena, nao do usuario global

### 3. Criar regra explicita de precedencia

Documentar na raiz:

- global protege
- raiz roteia
- projeto local manda no tecnico

Motivo:

- isso reduz conflito de instrucao e confusao de escopo

## Prioridade Media

### 4. Criar skill de impacto cruzado entre projetos

Exemplos de pedidos que exigem isso:

- mudanças em identidade visual
- mudanças em credenciais compartilhadas
- alterações de integrações de Neon, Vercel ou Sentry
- mudanças que afetam P8 + P9 + P10

Skill sugerida:

- `cross-project-impact`

### 5. Criar agentes de workspace, nao de projeto

Nao para codar, e sim para orquestrar:

- `workspace-router-sonnet`
- `workspace-impact-reviewer-opus`

Esses agentes serviriam para:

- identificar quais projetos sao afetados
- apontar a ordem de trabalho
- revisar risco cross-project

---

## O Que Eu Mudaria no FigurinhasPro

Agora sim, dentro do contexto certo.

## O que manter

- [AGENTS.md](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/8%20-%20FigurinhasPro/AGENTS.md)
- [CLAUDE.md](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/8%20-%20FigurinhasPro/CLAUDE.md)
- [.claude/settings.json](C:/Users/conta/Desktop/Empresas%20e%20Projetos/1%20-%20Projetos/1%20-%20Arena%20Cards/8%20-%20FigurinhasPro/.claude/settings.json)
- `next16-prisma7`

## O que falta

Faltam agentes locais adaptados ao repo.

Eu criaria em `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards\8 - FigurinhasPro\.claude\agents\`:

- `architect-opus.md`
- `reviewer-opus.md`
- `researcher-sonnet.md`
- `test-runner-sonnet.md`

## O que eu nao criaria agora

- `builder` local
- `implementer-fast` local em Haiku
- `simplifier` local automatico
- qualquer agente com worktree por default

Motivo:

- a thread principal ja e o melhor lugar para implementacao cotidiana
- a lacuna mais real do projeto hoje e exploracao/review, nao falta de executor

---

## Implantacao Ideal por Camada

## Camada Global — `C:\Users\conta\.claude`

Modelo:

- Sonnet por default
- Opus para planner/reviewer
- Haiku para leitura leve

Papel:

- seguranca
- higiene
- workflow generico

## Camada Workspace — `Arena Cards`

Modelo:

- Sonnet por default
- Opus apenas para impacto cross-project

Papel:

- descobrir qual projeto esta em jogo
- mapear impacto entre projetos
- rotear para o cwd correto

## Camada Projeto — `FigurinhasPro`

Modelo:

- Sonnet para implementacao
- Opus para arquitetura/review

Papel:

- executar trabalho tecnico real
- aplicar regras de stack
- build, lint e deploy do projeto

---

## Recomendacao Final

Levando em conta que `C:\Users\conta\Desktop\Empresas e Projetos\1 - Projetos\1 - Arena Cards` e o seu **projeto principal / workspace principal**, a recomendacao correta nao e otimizar apenas o FigurinhasPro.

A recomendacao correta e esta:

1. **limpar o `C:\Users\conta\.claude` para ele voltar a ser realmente global**
2. **fortalecer a raiz `Arena Cards` como camada de roteamento e impacto cross-project**
3. **deixar os agentes tecnicos fortes dentro de cada projeto**
4. **no FigurinhasPro, criar apenas o conjunto minimo de agentes locais**

Se eu resumir em uma frase:

**seu problema principal nao e falta de agentes; e falta de distribuicao correta entre global, workspace e projeto.**

---

## Fontes Externas

## Oficiais

- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Model Configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Costs](https://code.claude.com/docs/en/costs)
- [Claude Code com plano Pro/Max](https://support.anthropic.com/pt/articles/11145838-usando-o-claude-code-com-seu-plano-max)
- [Usage and Length Limits](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

## Comunidade e GitHub — 2026-04-01 a 2026-04-04

- [Zenn — Claude discovery 2026-04-01](https://zenn.dev/shin_agent/articles/claude-discovery-2026-04-01)
- [AutoHarness (Zenn, 2026-04-01)](https://zenn.dev/shintaroamaike/articles/df3ecc0ddee047)
- [Zenn — Claude discovery 2026-04-02](https://zenn.dev/shin_agent/articles/claude-discovery-2026-04-02)
- [Reddit — three-man-team (2026-04-02)](https://www.reddit.com/r/ClaudeAI/comments/1sa7ju4/i_replaced_chaotic_solo_claude_coding_with_a/)
- [GitHub — three-man-team](https://github.com/russelleNVy/three-man-team)
- [DEV — Parallel agents with worktrees (2026-04-03)](https://dev.to/subprime2010/claude-code-parallel-agents-run-4-tasks-simultaneously-and-merge-with-git-3471)
- [DEV — Local agent instead of switching completely (2026-04-03)](https://dev.to/tsunamayo7/claude-code-token-crisis-why-i-built-a-local-agent-instead-of-switching-to-codex-1p1b)
- [Qiita — Hybrid/local workflow (2026-04-03)](https://qiita.com/tsunamayo7/items/0007a1badb74d468fdb0)
- [Claude Lab — Custom Subagents @-mention Guide (2026-04-04)](https://claudelab.net/en/articles/claude-code/claude-code-custom-subagents-at-mention-guide)
- [GitHub — awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Zenn — TAKT adoption and harness comparison (2026-04-04)](https://zenn.dev/purple_matsu1/articles/20260402-takt-adoption)
- [TechCrunch — Extra billing for third-party support (2026-04-04)](https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/)
