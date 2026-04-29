# Glossário — Akita ↔ ACE / HumanLayer

Tabela de equivalências entre vocabulário da metodologia Akita (Agile Vibe Coding) e da metodologia HumanLayer (Advanced Context Engineering).

| Conceito Akita | Conceito ACE/HumanLayer | Notas |
|---|---|---|
| 4 blocos (O QUÊ, COMO, NÃO, VALIDAR) | structured prompt / spec-driven prompt | Akita formalizou via blocos; ACE materializa via slash command (`/tarefa`, `/plano`). |
| Plano antes de código | research-plan-implement (RPI) workflow | RPI separa em 3 fases distintas; Akita prega o mesmo princípio sem forçar a separação por sessão. |
| Hurdle | context discovery / domain knowledge gap | Algo que o agente não sabia e descobre durante o trabalho. Vai pro `./CLAUDE.md`. |
| `./CLAUDE.md` evolução orgânica | living spec / agent context evolution | Documento que cresce a cada hurdle. Equivalente: `thoughts/decisoes/` para decisões arquiteturais. |
| Pair programming | sub-agent execution | Akita: humano pareando agente. ACE: agente pai delegando pra sub-agents especializados. |
| Pequenos commits | small atomic commits + intentional compaction | Akita pega o lado git. ACE adiciona dimensão de contexto (compactar entre fases). |
| TDD | TDD (mesmo conceito) | Sem variação semântica. Ambas metodologias prescrevem teste antes da implementação. |
| Refactoring contínuo | continuous refactor (mesmo conceito) | Sem variação. |
| CI gate | gate via hooks (precommit-router) | Akita prescreve gate; ACE adiciona implementação determinística via hooks. |
| Anti-padrão "prompt-and-leave" | autonomous-loop anti-pattern | Disparar prompt e sair = perda de contexto e qualidade. |
| Anti-padrão "test-patching" | silent test mutation | Mudar teste pra ele passar em vez de consertar código. Pior anti-padrão por morrer em silêncio. |
| `bin/ci` rápido | gate hook PreToolUse | Akita: script rápido < 30s. ACE: hook bloqueante antes de commit/push. Mesma intenção. |
| Subagents para tarefa mecânica | Task tool / sub-agent dispatch | Implementação técnica em ACE; conceito metodológico em Akita. |
| `thoughts/` (não existe em Akita puro) | thoughts/ directory | Adição do ACE. Akita usa `./CLAUDE.md` + commit messages como spec viva. |
| Cirurgia de emergência (FrankMD) | unbounded context drift | Quando deixa o agente empilhar sem disciplina, vira refactor de 5000 linhas em pânico. |
| `/compact` | intentional compaction | Built-in do Claude Code. ACE prescreve uso ativo entre fases (ver `/refoco`). |
| Mesmo desenvolvedor + mesmo agente + processo diferente = resultado diferente | "context engineering is the lever" | A variável é o processo, não a IA. |

## Termos novos do ACE

- **Research-Plan-Implement (RPI)** — 3 fases sequenciais com sub-sessões idealmente separadas.
- **Intentional compaction** — distilar conversa em artefato markdown ~200 linhas entre fases.
- **Sub-agent specialization** — agentes com `tools:` restrito por design (read-only por default).
- **Plugin marketplace** — mecanismo de distribuição de pacotes de slash commands + agents + hooks.

## Termos novos do Akita

- **Stark + Jarvis** — metáfora central. Você é Stark (decisão), agente é Jarvis (execução).
- **Mark LXXXV** — 85ª iteração do terno. Iteração nunca foi opcional.
- **Espelho** — IA acelera o que você já é (disciplinado ou relapso).

## Quando usar qual termo

Em discussões internas: prefira o termo do System Master ACE (Akita). Em colaboração com community que usa HumanLayer/CodeLayer: traduza pra terminologia ACE pra evitar confusão.
