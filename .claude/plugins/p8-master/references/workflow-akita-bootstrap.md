# Workflow Akita Bootstrap — referência condensada

> Metodologia de Fabio Akita (Agile Vibe Coding), adaptada para projetos com IA. **Adotada pelo plugin P8-MASTER junto com SMA e Oracle**. Foco em disciplina XP + TDD + refactor em micro-passos.

---

## Regra-mãe

**Humano decide o QUÊ. Agente decide o COMO.**

- Arquitetura, escopo, prioridades, trade-offs, escolha de bibliotecas, decisão de release → humano.
- Implementação linha-a-linha → agente.
- "Já que estou aqui" + escopo alargado → humano aprova.

---

## Ciclo TDD (unidade atômica)

```
RED → GREEN → REFACTOR → COMMIT
```

1. **RED**: escreve teste que falha. Descreve comportamento desejado, não implementação.
2. **GREEN**: implementa o mínimo pra passar. Sem abstrações especulativas.
3. **REFACTOR**: micro-passos com rede de testes. Cada extração:
   - <50 linhas
   - <2 arquivos
   - 1 commit isolado
4. **COMMIT**: mensagem imperativa, descreve intent + por quê.

**Em P8-MASTER:** ciclo TDD é o que acontece dentro de cada fase de `/p8-master:implementa`. Hook pre-commit garante gate verde (`npm run test → tsc --noEmit → npm run build`).

---

## Ritmo: build-build-build-STOP + micro-passos

- Cada extração refactor é cirurgia pequena.
- "Já que estou aqui" + 5000 linhas de código gerado em 6 cirurgias = anti-padrão.
- 27 extrações em commits de minutos = ritmo Akita correto.
- **STOP após ciclo completo** — não emende próxima feature antes de fechar a atual.
- Se aparecer 2ª oportunidade: vira tarefa nova, não amplia escopo.

---

## As 5 fases de Bootstrap (B.1 → B.5)

### B.1 — Auditoria

- **Read-only.** Inspeciona projeto sem modificar.
- Saída: `AUDIT.md` em `thoughts/decisoes/` ou raiz.
- Cobre:
  - Estrutura (árvore de pastas + linguagens via `inventory.py`)
  - Stack (versões, frameworks, libs)
  - Testes (existem? cobrem o quê? rodam?)
  - CI (.github/workflows/, hooks)
  - Legado (código não-tocado há >6 meses, dependências desatualizadas)
  - Gaps documentais

**Em P8:** já existe — [P8-FigurinhasPro/akita/blueprint.md](../../../../akita/blueprint.md) é o resultado da B.1.

### B.2 — AGENTS.md retrospectivo

- Descreve projeto **como é hoje**, não como se aspira.
- Inclui Gotchas reais (libs com comportamento surpreendente, env vars críticas, anti-padrões evitados).
- Output: `AGENTS.md` na raiz.

**Em P8:** [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) cobre Next 16, Prisma 7, Tailwind 4, Zod 4, React 19, iron-session, Stripe SDK 22, Sentry 10.49.

### Infra transversal

Configurar antes de B.3:
- CI roda `lint + tsc + test + build` em todo PR.
- Hooks pre-commit ativos.
- Templates de PR (problema/abordagem/test plan/rollback).

**Em P8:** hook `precommit-router.sh` ativo, gate `npm run test → tsc → build` bloqueando commit ruim.

### B.3 — Testes de caracterização

- Capturam comportamento atual (inclusive bugs) em PR separada.
- **Zero mudança de produção.**
- Servem de rede de segurança pra B.4.

**Em P8:** ADR 0005 (Testing + Spec Evolution) define padrão `RED → GREEN → REFACTOR → UPDATE SPEC → COMMIT`. Testing rollout em `docs/testing-rollout.md`.

### B.4 — UMA cirurgia

- 1 arquivo de `CIRURGIA_CANDIDATES.md` em `thoughts/`.
- Refatora **com suite passando antes/depois**.
- Cada cirurgia:
  - Toca 1 área conceitual.
  - <500 linhas no diff.
  - Suite verde do início ao fim.
- Ao terminar: PR único, mensagem clara.

**Em P8:** candidatos conhecidos:
- Restaurar plan-limits.ts (gates desabilitados — TODO)
- Idempotência Stripe webhook (gap conhecido)
- Ativar Sentry em prod (DSN opcional → required)
- Adicionar rate limit em rotas públicas

### B.5 — Disciplina ongoing

**Regra do Escoteiro:** código legado tocado → deixa 1 teste a mais que achou.

- Suite verde sempre.
- Pre-commit hook nunca pulado.
- ADRs evoluem com código (`docs/decisoes/` ou `thoughts/decisoes/`).
- Especificações vivas (CLAUDE.md, AGENTS.md) atualizadas conforme convenção muda.

---

## Integração SMA + Akita Bootstrap em P8-MASTER

| Etapa | Skill P8-MASTER | Origem metodológica |
|---|---|---|
| Pesquisar antes de planejar | `/p8-master:pesquisa` | SMA (ACE) |
| Plano com gate humano | `/p8-master:plano` | SMA |
| Validar plano | `/p8-master:valida` | SMA |
| TDD Red→Green→Refactor | dentro de `/p8-master:implementa` | Akita |
| Commit atômico | `/p8-master:commit` | Akita XP |
| PR estruturado | `/p8-master:pr` | SMA |
| Capturar handoff | `/p8-master:handoff` | SMA |
| Documentar hurdle | `/p8-master:hurdle` | Akita ("regra do escoteiro") |
| Análise estratégica | `/p8-master:oracle-analise` | Oracle (extensão Akita) |
| Auto-melhoria contínua | `/p8-master:lessons-audit` | Fase 4 (futuro) |

---

## Anti-padrões Akita evitados em P8-MASTER

- ❌ State machine com >5 estados pra problema simples
- ❌ Abstract factory / strategy / observer prematuro
- ❌ Função >30 linhas
- ❌ Indentação >3 níveis
- ❌ Nomes genéricos: `Manager`, `Service`, `Handler`, `Helper`, `Util`, `Processor`
- ❌ `any` / `Dict` sem parâmetros
- ❌ `useMemo` / `useCallback` em React 19 + Compiler (já otimiza)
- ❌ Mensagem de commit `WIP`, `update`, `fix stuff`
- ❌ `git add .` ou `git add -A` (lista explícita sempre)
- ❌ `git push --force` (bloqueado hard)
- ❌ `--no-verify` em pre-commit hook
- ❌ Test patching silencioso (alterar teste pra passar)
- ❌ Mock dentro do código sob teste (mock dependências externas, não interno)

---

## Comandos cheat-sheet (Akita XP no P8)

```bash
# Disciplina de cada commit
npm run test          # gate parte 1 (Vitest)
npx tsc --noEmit      # gate parte 2 (type check)
npm run build         # gate parte 3 (prisma generate + next build)
git add <arquivos>    # NUNCA git add -A
git commit -m "feat(escopo): mensagem imperativa"  # NUNCA --amend pushed

# Refactor pequeno
git diff --stat <arquivo>   # checa tamanho antes
# se > 50 linhas / 2 arquivos: SPLIT em 2 commits

# Suite reset (só se cirurgia)
git stash                # preserva mudanças não-commitadas
npm run test             # gate verde antes da cirurgia
# faça cirurgia
npm run test             # gate verde depois
git stash pop            # se stashou
```

---

## Referências de origem

- **Fabio Akita** — palestras e textos de Agile Vibe Coding (2026).
- **System Master ACE** — `C:\Users\conta\Projetos\Documentação\System Master ACE\` (versão padrão SMA + Akita, fora de P8).
- **HumanLayer / CodeLayer** — workflow Research → Plan → Implement, conceito ACE.

Plugin P8-MASTER = SMA + Akita Bootstrap + Oracle + auto-melhoria, customizado pra P8-FigurinhasPro.
