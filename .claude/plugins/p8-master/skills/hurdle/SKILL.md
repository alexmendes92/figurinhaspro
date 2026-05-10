---
name: p8-master:hurdle
description: Auto-ativa quando o usuário descobrir um gotcha, constraint, comportamento surpreendente ou aprendizado novo em P8-FigurinhasPro que merece virar regra durável no CLAUDE.md/AGENTS.md. Propõe bullet imperativo, espera aprovação humana antes de editar.
argument-hint: <descoberta>
disable-model-invocation: false
---

Acabamos de descobrir algo que o agente não sabia: $ARGUMENTS

Vou propor UM bullet curto e imperativo para adicionar ao `CLAUDE.md` ou `AGENTS.md` do P8-FigurinhasPro.

## Onde o bullet vai

| Tipo de hurdle | Destino |
|---|---|
| Convenção de processo (ciclo, gate, deploy, testing) | `CLAUDE.md` (regras XP do projeto) |
| Breaking change da stack (Next 16, Prisma 7, Tailwind 4, Zod 4, React 19) | `AGENTS.md` (seção da lib) |
| Padrão arquitetural específico de P8 (price-resolver, custom-album, plan-limits) | `AGENTS.md` (seção "Padroes Importantes") |
| Gotcha isolado (lib X tem comportamento Y) | `AGENTS.md` ou comentário inline `// @spec:` no código |
| Aprendizado cross-project (vale pra qualquer projeto) | proponho promover pra `~/.claude/CLAUDE.md` global (mas NÃO modifico sem aprovação separada) |

## Formato do bullet

- **Imperativo, direto** (não "deveríamos considerar...")
- **Explica POR QUE em 1 linha** (a constraint, o bug, a convenção)
- **Cita arquivo/linha/issue** se aplicável

### Exemplos bons

- ✅ `Stripe webhook em prod exige env vars no scope Production, não Development. Sem isso, falha silenciosa em vercel.com (2026-05-10 sessão).`
- ✅ `Plan limits gates em src/lib/plan-limits.ts:36 retornam true temporariamente — não habilitar sem coverage de teste primeiro (TODO restaurar).`
- ✅ `Webhook Stripe duplicado cria Order duplicada — adicionar tracking de event.id em SubscriptionEvent (gap conhecido até 2026-05-10).`
- ✅ `Em React 19 + Compiler, useMemo/useCallback são desnecessários e podem confundir Compiler. Remover quando encontrar.`

### Exemplos ruins

- ❌ `Cuidado com Stripe.` (vago)
- ❌ `Lembrar de testar bem.` (não cita constraint)
- ❌ `useMemo é ruim.` (não cita por que em P8 especificamente)

## Sequência

1. **Analisar a descoberta:** o que aconteceu, qual a evidência (arquivo:linha, output de comando, link de doc), em que circunstância apareceu.

2. **Decidir destino:** CLAUDE.md (processo) vs AGENTS.md (stack/arquitetura) vs comentário inline.

3. **Formular bullet** seguindo o formato.

4. **Mostrar bullet proposto** + caminho do arquivo de destino + linha onde inserir.

5. **PARAR.** Espero aprovação humana explícita.

6. **Após aprovação:** edito o arquivo destino com o bullet.

7. **Se a hurdle parece valer pra qualquer projeto** (cross-project): sugiro promoção pro `~/.claude/CLAUDE.md` global. **NÃO modifico esse arquivo sem aprovação humana separada.**

## Restrições

- **Não modifico CLAUDE.md/AGENTS.md sem mostrar bullet primeiro.**
- **Não modifico `~/.claude/CLAUDE.md` global sem autorização explícita.**
- **Não escrevo bullet vago.** "Cuidado com X" é inútil; bullet correto cita arquivo:linha + razão concreta + (se aplicável) issue/SHA da sessão atual.
- **Não acumulo hurdles em batch.** Uma descoberta = um bullet, um turno de `/p8-master:hurdle`. Batch dilui o significado.
- **Não promovo pra global automaticamente.** Decisão de promoção é humana — só sugiro se vejo padrão claro.

## Modelo recomendado

- **`/model sonnet`** — formular bullet imperativo curto a partir de descoberta é trivial.
- **Opus** só se hurdle envolve raciocínio sobre causa-raiz não-óbvia — caso em que provavelmente ainda nem é hurdle, é debugging em curso.

## Ver também

- [P8-FigurinhasPro/CLAUDE.md](../../../../CLAUDE.md) — destino principal de hurdles de processo
- [P8-FigurinhasPro/AGENTS.md](../../../../AGENTS.md) — destino de hurdles de stack/arquitetura
- `~/.claude/CLAUDE.md` global do user — destino se hurdle for cross-project (com aprovação separada)
