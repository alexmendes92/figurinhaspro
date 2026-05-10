---
name: p8-master:ui-review
description: Validação visual real da UI do P8-FigurinhasPro via /chrome nativo (Claude in Chrome, primeira opção) com fallback Playwright MCP. Auto-ativa quando o usuário pedir "testar UI", "validar visual", "rodar pelo browser", "checar tela", "ver se ficou bom no painel", "validar fluxo", "screenshot da feature", OU quando /p8-master:implementa terminar fase tocando *.tsx/*.css/layout/component crítico. Cobre golden path do componente alterado + 3 breakpoints (375/768/1280) + console errors + telas adjacentes. Substitui o protocolo Playwright MCP legado documentado em arenacards.md — use SEMPRE essa skill ao invés de instruir Playwright MCP diretamente, mesmo se o user mencionar "playwright" por reflexo, porque /chrome compartilha session do user (login já ativo, sem CAPTCHA, sem accessibility-tree 50k tokens).
argument-hint: "[componente|rota|feature] (ex: 'logout confirm', '/painel/estoque', 'mobile bottom nav')"
---

Vou validar visualmente: $ARGUMENTS

## Por que essa skill existe

Build verde ≠ UI funciona. Tipo verde, teste verde, lint verde — nada disso prova que o vendedor consegue clicar no botão certo, que o layout não estourou no mobile, ou que o console não está despejando 12 erros silenciosos. O usuário final vê pixels, não AST.

A regra de workspace `arenacards.md` exige isso desde o dia 1, mas até maio/2026 dependia de **Playwright MCP** (third-party Microsoft, accessibility tree de 50k tokens por interação, browser headless sem login do user). Com Claude Code 2.0.73+, a Anthropic shipou `/chrome` nativo que resolve as 3 dores principais:

1. **Compartilha session do user** — se o operador já está logado no `/painel/comercial`, a skill testa rotas admin direto, sem mock de cookie.
2. **Pausa em CAPTCHA/login** automaticamente em vez de travar.
3. **Token-efficient** — não precisa despejar accessibility tree massiva a cada turno.

Quando `/chrome` não estiver disponível (Claude Code antigo, WSL, plano não suportado), caio para Playwright MCP como fallback funcional.

## Pré-condições

Antes de rodar qualquer browser action, valido:

1. **Dev server rodando** em `http://localhost:3009` (P8 usa porta 3009 fixa). Se não estiver, rodo `npm run dev` em background (Bash `run_in_background: true`) e aguardo "Ready in" antes de prosseguir.
2. **`/chrome` disponível** — checo via `/mcp` se `claude-in-chrome` aparece. Se sim, uso. Se não, falo ao user: "Ative com `/chrome` ou inicie sessão nova com `claude --chrome`. Continuo com Playwright MCP se preferir."
3. **Não estou em WSL** — `/chrome` não suporta. Se WSL, vou direto pra Playwright MCP.
4. **Sessão autenticada** quando a rota alvo é `/painel/*` ou outra área logada. Após `navigate` inicial, se URL final contém `/login` ou `reason=session-expired`, **invoco `p8-master:p8-auth`** passando a URL alvo original. Não tento prosseguir até `p8-auth` confirmar `resultado=ok`. Para rotas públicas (`/`, `/loja/[slug]`, `/privacidade`, `/termos`, `/login` em si), pulo essa checagem — auth atrapalha.

## Sequência canônica

### 1. Identificar o que validar

Leio o `$ARGUMENTS` e o git diff recente para descobrir:

- Qual rota/componente foi alterado (`git diff --name-only HEAD~1 HEAD | grep -E '\.(tsx|css|module\.css)$'`).
- Se é fluxo crítico (login/logout/checkout/payment/admin-only) ou cosmético (color/spacing).
- Telas adjacentes que importam o mesmo componente alterado (`grep -l "from.*ComponentName" src/`).

Se `$ARGUMENTS` está vazio, pergunto ao user qual feature validar antes de gastar turnos navegando às cegas.

### 2. Golden path: o fluxo principal

Navego pela jornada do usuário-alvo (vendedor ou comprador, conforme contexto):

- **Vendedor:** `/login` → preenche credenciais → `/painel` → executa ação afetada → captura screenshot do estado final → lê console.
- **Comprador:** `/loja/[slug]` → `/loja/[slug]/[albumSlug]` → adiciona ao carrinho → captura cada transição.

Para cada passo:
- `browser_navigate` ou `browser_click` conforme apropriado
- `browser_take_screenshot` no estado relevante (não em toda transição — só onde a feature muda algo)
- `browser_console_messages` ao final do passo para coletar erros runtime

Se algum passo falhar (elemento não existe, navegação trava, console explode), **paro imediatamente** e reporto ao user com:
- Path do componente provavelmente quebrado
- Texto do erro literal (não paráfrase)
- Hipótese do que aconteceu

### 3. Breakpoints responsivos

A regra de workspace (`arenacards.md` "Review de UI") exige teste em 3 viewports. Para cada um:

```
375 (mobile S)  → browser_resize 375 667 → screenshot
768 (tablet)    → browser_resize 768 1024 → screenshot
1280 (desktop)  → browser_resize 1280 800 → screenshot
```

Verifico especificamente:
- Bottom nav mobile (P8 tem 6 itens: Início/Estoque/Preços/Pedidos/Vitrine/Planos)
- Sidebar collapse em `/painel/estoque/[albumSlug]` (collapse automático)
- Modais cabendo na viewport (CartDrawer, ConfirmDialog, PriceModal)
- Touch targets ≥44px (regra `arenacards.md`)

### 4. Console errors capture

Console errors silenciosos são bug crítico no P8 — vendedor opera com incerteza. Coleto ao final:

```
browser_console_messages
```

Filtros que importam:
- `error` → bloqueia (relatório vermelho)
- `warning` relacionado a React/Next/Prisma → reporta (não bloqueia)
- `info`/`debug` → ignora

### 5. Telas adjacentes (regressão)

Se a mudança tocou componente compartilhado (ex: `ConfirmDialog`, `PainelShell`, `CartContext`), navego em 1-2 telas vizinhas que usam o mesmo componente. Não exaustivo — é sanity check de regressão.

Exemplo: alterei `ConfirmDialog` no logout. Vou testar também:
- Logout em `/painel`
- "Zerar Seção" em `/painel/estoque/[albumSlug]`
- "Cancelar Pedido" em `/painel/pedidos`

### 6. Output: artefato em thoughts/reviews/

Salvo o relatório em `thoughts/reviews/YYYY-MM-DD-<slug>.md` com frontmatter:

```yaml
---
data: <YYYY-MM-DD>
tipo: ui-review
feature: <slug>
autor: <user>
relacionados: [planos/<plano-relevante>.md]
status: <pronto|regressao|bloqueado>
breakpoints-testados: [375, 768, 1280]
console-errors: <quantidade>
---
```

Corpo:

```markdown
# Review UI — <feature>

## Golden path
- Passo 1: <descrição> — ✅ ok / ❌ falhou com <razão>
- Passo 2: <...>

## Breakpoints
| Viewport | Estado | Observação |
|----------|--------|------------|
| 375 mobile | ✅ | bottom nav comporta 6 itens |
| 768 tablet | ⚠️ | modal estoura largura |
| 1280 desktop | ✅ | sem issues |

## Console
- 0 errors / 0 warnings (limpo)
- OU: 2 errors detectados em `<rota>` — `<texto literal>`

## Regressão (telas adjacentes)
- `/rota/A` — ✅ ok
- `/rota/B` — ❌ ConfirmDialog não abre

## Screenshots
- [link ou path para arquivos]

## Veredicto
- ✅ Pronto pra deploy
- ⚠️ Pronto com observações (`/hurdle <X>` para registrar)
- ❌ Bloqueado — voltar pra /implementa ou /itera
```

## Restrições

- **Não declaro UI pronta sem screenshot real.** Build verde + testes verdes não substituem.
- **Não testo em headless** quando `/chrome` está disponível — perde o valor de session compartilhada do user.
- **Não despejo accessibility tree** no relatório (50k tokens cada). Se precisar do tree, deixo no `.cache` e referencio path.
- **Não automatizo login com credenciais hardcoded.** Em preview/dev local com `P8_DEV_AUTO_LOGIN_TOKEN` no shell, delego a `p8-master:p8-auth` que usa endpoint dev-only (sem digitar senha). Em produção, paro e peço login manual no Chrome conectado — `/chrome` aproveita a sessão real do user.
- **Não modifico código.** Essa skill REVISA, não corrige. Se achou bug, gera relatório com veredito ❌ e sugere `/p8-master:itera <plano>` ou nova `/p8-master:pesquisa`.

## Fallback: quando `/chrome` não está disponível

Se a checagem da pré-condição #2 falhou:

1. **Plugin Playwright instalado** (`~/.claude/plugins/cache/claude-plugins-official/playwright/`)? Sim → instruo user: "Ative o Playwright MCP no `.mcp.json` do projeto e reinicie a sessão. Estou pronto pra usar tools `mcp__playwright__browser_*` quando disponíveis."
2. **Sem plugin nenhum disponível**? Caio para validação HTTP via `curl` (testar redirects, status codes, payloads de API) e aviso ao user explicitamente: "Não consegui validar UI visualmente — testei só camada HTTP. Recomendo rodar `/chrome` ou Playwright pra próxima review."

Nunca finjo que validei visualmente quando não validei.

## Triggers (quando essa skill deve disparar)

A description já cobre os principais, mas reforço aqui pro modelo entender o **porquê** de cada um:

- **"testar UI", "validar visual", "checar tela"** → user explicitamente pedindo review. Trigger forte.
- **"rodar pelo browser", "ver no navegador"** → idem.
- **Após `/p8-master:implementa` terminar uma fase que tocou `.tsx`/`.css`** → trigger contextual. Se a fase modificou só backend (`/api/*`, `/lib/*` puros), não dispara — não faz sentido testar UI de coisa sem UI.
- **"screenshot do <feature>"** → trigger forte. User quer evidência visual.
- **"fluxo do <X>"** quando X é uma jornada de usuário (login, checkout, cancelamento) → trigger forte.
- **NÃO dispara em:** alterações em `prisma/schema.prisma` sozinhas, mudanças em `scripts/`, refactor de tipo TypeScript puro, edição de README/docs.

## Modelo recomendado

- **Main session: Sonnet** — execução é mecânica (navegar, clicar, screenshot, ler console). Sem síntese cognitiva complexa.
- **Opus** se a feature for crítica financeiramente (checkout, payment, order creation) — caso o relatório precise julgar trade-offs sutis de UX.

## Ver também

- [references/chrome-setup.md](references/chrome-setup.md) — quick-start + troubleshooting do `/chrome`
- [arenacards.md "Review de UI"](../../../../../../.claude/rules/arenacards.md) — regra de workspace que essa skill operacionaliza
- [/p8-master:p8-snapshot](../p8-snapshot/SKILL.md) — captura snapshot leve do produto em prod (não substitui review)
- Manual 4 §6.5 — intentional compaction (por que review vira artefato em `thoughts/reviews/`)
