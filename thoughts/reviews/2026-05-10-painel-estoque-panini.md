---
data: 2026-05-10
tipo: ui-review
feature: painel-estoque-panini-fifa-world-cup-2022
autor: alex (via claude opus 4.7)
relacionados:
  - docs/dev-auto-login.md
  - .claude/plugins/p8-master/skills/p8-auth/SKILL.md
status: pronto-com-observacoes
breakpoints-testados: [1536 desktop — limitação do /chrome no Windows pra resize CSS efetivo]
console-errors: 0 (após restart do dev server)
seller-usado: contato@santanamendes.com.br (Santana, Plano Starter)
---

# Review UI — `/painel/estoque/panini_fifa_world_cup_2022`

## Veredicto

**PRONTO COM OBSERVAÇÕES.** Página renderiza bem após restart do dev server. UX é sólida, mas há 12 melhorias visuais e arquiteturais identificadas — 4 são críticas (watermark "LastSticker.com" cobrindo nome dos jogadores, contador "8 exibidas" desalinhado com cards visíveis, inconsistência de active state na sidebar, bug Turbopack recorrente).

## Histórico da sessão

1. Auto-login `/api/dev/auto-login` funcionou (shipado nesta mesma sessão).
2. Primeira tentativa: Runtime Error "Jest worker exceeding retry limit" — bug do Turbopack 16.2.4 (banner "stale"). Bug aconteceu **3 vezes** em sequência (Copa 2022, Copa 2018, voltar pra 2022).
3. **Restart do dev server resolveu.** `Stop-Process` no PID antigo (5h de uptime) + `npm run dev` novo → `Ready in 1957ms` → página renderiza em ~6s.
4. Review completa abaixo executada após o restart.

## Bug crítico recorrente — Turbopack jest-worker

**Severidade:** alta em dev, zero em prod. **Recorrente:** acontece após algumas horas de uptime do dev server.

**Stack trace** (literal, console):
```
Error: Jest worker encountered 2 child process exceptions, exceeding retry limit
  at ChildProcessWorker.initialize (node_modules/next/dist/compiled/jest-worker/index.js:1:11580)
```

Banner: "Next.js 16.2.4 (stale)".

**Workarounds:**
- **Imediato:** restart do dev server (validado nesta sessão — resolveu em 1 tentativa).
- **Médio prazo:** `npm install next@latest` (sair de 16.2.4 stale).
- **Longo prazo:** extrair sub-componentes do `inventory-manager.tsx` (1079 linhas) — reduz pressão no jest-worker.

Recomendação: **automatizar restart preventivo** no `package.json` (`"dev": "next dev --max-restart-on-error=3"` ou script wrapper). Bug é provavelmente memory leak acumulado, não falha de código.

## `/painel/estoque/panini_fifa_world_cup_2022` — review visual

### Pontos fortes

1. **Sidebar de seções** é o ponto alto da UX. 15 seções (Content/Stadiums/Official Match Ball + 12 países) com contagem `X/Y` em cada. Permite navegação por país sem scroll infinito.
2. **Filtros `Todas/Tenho/Faltam`** com contagens dinâmicas — vendedor sabe imediatamente onde está.
3. **Chip "8 faltando ↓"** (vermelho) atalha pra próxima faltante. Micro-feature de alto valor.
4. **Cards de figurinhas têm cover REAL** — diferencia FIFA logo (Especial), troféu, mascote (La'eeb), e jogadores com retrato.
5. **Badge "Especial"** (amarelo) destaca FWC1-FWC20 vs jogadores regulares — boa hierarquia.
6. **Stepper `- N +`** com qty atual em verde dentro do card. Editar é 1 click — não precisa modal pra ajustar quantidade.
7. **Preço `R$2,50` / `R$5,00`** visível no card sem necessidade de hover ou expand.
8. **Atalhos `/` `1` `2` `3`** documentados no rodapé da toolbar — power user.
9. **Breadcrumb `Painel / Estoque / Panini Fifa World Cup 2022`** orienta sem competir com conteúdo.
10. **Botões `Marcar todas` / `Zerar`** no top-right pra ações em lote.

### Issues críticos

**1. Watermark "LastSticker.com" sobre o NOME do jogador.**

Capturado em QAT15 "Yousuf Abdurisag": o watermark `LastSticker.com` é renderizado em cima do nome dele no centro inferior do cover. Resultado: texto vira "YOUSUFLAREDETICAEDR.coGM" — ilegível.

Mesma issue afeta: QAT13 (Hatem), QAT14 (Madibo), QAT16 (Afif), QAT17 (Alaaeldin), QAT18 (Al-Haydos) — TODOS os jogadores. Em FWC1 (FIFA logo) o watermark também aparece mas sobre área neutra, menos crítico.

**Impacto:** vendedor mostra essa página pra clientes (vitrine pública é gerada do mesmo banco de stickers). Watermark sugere que o conteúdo é raspado de outro site. Pode ser problema **legal** (copyright Panini + LastSticker) e **comercial** (cliente vê watermark e desconfia da legitimidade).

**Fix sugerido:** processar as covers via `sharp` no upload original — crop pra área sem watermark, OU substituir por covers próprias.

**2. Contador "8 exibidas" desalinhado com cards visíveis.**

Filtro "Faltam" mostra "667/675 em estoque · **8 exibidas**" no header. Mas no viewport vejo apenas **3 cards** (00 Panini, FWC3, FWC4) na seção CONTENT.

Causa provável: contador "8 exibidas" se refere ao total de figurinhas faltantes no album inteiro, mas o usuário está visualizando seção CONTENT (5/8) — só 3 das 8 faltantes pertencem a essa seção.

**Fix sugerido:** texto contextual — "**3 exibidas na seção** · 8 faltam no álbum total" OU expor um link "Ver outras 5 em outras seções" que pula scroll.

**3. Sidebar mostra DOIS itens "active" simultaneamente.**

Em uma das interações capturei screenshot onde `Todas` (top) e `Official Match Ball` (linha 271) ambos estavam destacados em amarelo (`bg-amber-500/10 text-amber-400`).

Causa provável: estado `activeSection` + `visibleSectionIndex` não sincronizado durante scroll observer. O `IntersectionObserver` muda `visibleSectionIndex` durante o scroll, criando estado "Todas filtrado + Official Match Ball visível" — visual fica ambíguo.

**Fix sugerido:** quando `activeSection === "all"`, a section "ativa" do observer deve ter visual sutilmente diferente (ex: borda esquerda amarela em vez de background) pra não competir com o item "Todas" que é explicitamente clicado.

**4. Bug Turbopack jest-worker recorrente.**
(Já documentado acima — bloqueia review periodicamente.)

### Issues médios

**5. Hover na 2ª linha de cards mostra FWC5 com stepper, mas FWC3 e FWC4 sem stepper.**

Cards na 1ª linha (Todas, sem filtro): FWC1, FWC2 têm `- 1 +` (qty 1). FWC3 e FWC4 estão **vazios** no rodapé. FWC5 tem stepper.

Hipótese: FWC3 e FWC4 são qty=0 e o componente esconde o stepper. Mas vendedor pode querer adicionar 1 unidade de FWC3 — não tem affordance visível. Precisa clicar no card ou em outro lugar.

**Fix sugerido:** mostrar stepper em **todos** os cards com state inicial "0" (ou um botão "+ Adicionar" visível quando qty=0). Card vazio sugere "item bloqueado" — falsa intuição.

**6. ~~Sticker code "QAT13" + nome "Abdulaziz Hatem" — convenção do código não bate com Panini real.~~** ← **REVISADO 2026-05-10 19:50: ISSUE INVÁLIDO.**

**O autor (claude opus 4.7) errou aqui — alucinou uma "convenção Panini canônica numérica" que não existe.** Os códigos `QAT13`, `FWC1`, `00`, etc. são literalmente os códigos oficiais do álbum Panini FIFA World Cup Qatar 2022. Fonte de verdade: `src/lib/albums.ts` linha 242-245 — `"code": "QAT13", "name": "Abdulaziz Hatem"`. Mesma convenção em todos os países (`QAT1`-`QAT20`, `ECU1`-`ECU20`, etc.) + `FWC1`-`FWC20` para figurinhas especiais + `00` para o sticker do logo Panini.

**Aprendizado registrado em:**
- `~/.claude/LESSONS.md` (global) — extensão do antipattern `API_HALLUCINATION` para fatos de domínio
- `.claude/plugins/p8-master/references/p8-glossario.md` — convenção Panini documentada
- `.claude/plugins/p8-master/skills/ui-review/SKILL.md` — regra dura: consultar `src/lib/albums.ts` antes de afirmar qualquer fato sobre código/nome de figurinha

**7. Data de nascimento aparece sobre o watermark.**

QAT13 mostra "28-10-1990" no rodapé do cover, **abaixo** do watermark "LastSticker.com". Ambos ficam misturados. Vendedor talvez nem perceba que tem data de nascimento na sticker.

**Fix sugerido:** mover data pra texto descritivo abaixo do cover, junto ao nome do jogador. Liberar a área visual do cover pra arte pura.

**8. Stepper `- 1 +`** com qty em verde, mas o número `1` ocupa muito pouco visual.

Vendedor com 50+ figurinhas idênticas (caso típico de Copa em circulação) edita uma a uma com clicks repetidos. **Não há input de texto** pra digitar "23" direto.

**Fix sugerido:** clicar no `1` central abre input numérico inline. Já existe `PriceModal` pra preço — fazer um `QuantityModal` análogo, ou input inline. Casos com qty alta (>10) viram tortura no stepper.

### Issues cosméticos (baixa prioridade)

**9. Cards têm aspect ratio retrato (~3:4)** — boa correspondência com figurinha real. **Mas** em viewport 1536px vejo 6 cards por linha — pode ficar denso. Em viewport 1920 (monitor maior), 8 cards = melhor uso. Validar com `grid-cols` dinâmico.

**10. Tipografia "FWC1 — FIFA" / "FWC2 — Official Trophy"** está no rodapé do card sem hierarquia clara entre código e nome. Sugiro: nome maior, código menor monospace abaixo (inverter a hierarquia atual).

**11. Header da seção `CONTENT 5/8` tem linha decorativa horizontal** que se estende por todo o viewport. Em viewport largo, vira muito visual. Pode ser `divider` mais sutil ou só texto sem border.

**12. Footer da sidebar mostra "Plano Starter • ver planos"** — clicável mas tipografia 11px + área pequena. Em mobile vira miss tap (regra workspace ≥44px).

## Console errors

Após restart do dev server: **0 errors / 0 warnings**.

(As 4 errors anteriores eram do dev server quebrado, não da aplicação.)

## Responsivo

**Não consegui validar via screenshot.** Limitação confirmada do `/chrome` integration no Windows:
- `resize_window 375x667` resize a janela do Chrome MAS
- Screenshot é renderizado em 1536×639 (display físico)
- `window.innerWidth` retorna 1536 mesmo após resize
- Media queries CSS não disparam

**Validação responsiva ficou baseada em leitura do código:**
- `flex flex-col lg:flex-row` no shell → pivota em ≥1024px (sidebar lateral → topo)
- Sidebar `lg:w-52` → 13rem desktop, full-width mobile
- Toolbar `text-base sm:text-lg` → escalonamento de fonte
- Grid de stickers: precisa confirmar `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6` (não inspecionado em detalhe)

Para teste real, recomendo **DevTools mobile emulation manual** (`F12 → Toggle Device Toolbar → iPhone 12 Pro`) — Chrome integration não substitui isso no Windows.

## Sugestões arquiteturais (código)

**1. Extrair sub-componentes (resolve bug Turbopack + manutenibilidade).**
- `components/painel/inventory/price-modal.tsx` (linhas 17-179)
- `components/painel/inventory/sticker-card.tsx` (181-341)
- `components/painel/inventory/section-block.tsx` (343-399)

Sobra ~500 linhas no `InventoryManager` — gerenciável. Cada sub-componente fica testável isoladamente.

**2. Debounce `updateQuantity`.** Cada click dispara POST. Marcando 50 figurinhas em 10s = 50 requests. Debounce de 500ms + flush em blur agrupa mudanças sem perder responsividade (optimistic update mantém UI fluida).

**3. Remover `useCallback`/`useMemo` desnecessários.** AGENTS.md afirma React Compiler ativo — `useMemo`/`useCallback` viraram no-op. 5 ocorrências no arquivo são ruído.

**4. AbortController em `startSaving`.** 5 clicks rápidos = 5 fetches em vôo, race condition silenciosa. Adicionar cancelamento da request anterior.

**5. `Map<string, StockEntry>`** em vez de `Record`. Para 670 stickers, lookup O(1) garantido. Mudança transparente, ganho silencioso.

**6. Discriminated union para modais.**
```tsx
type Modal =
  | { kind: "clear" }
  | { kind: "markAll" }
  | { kind: "price", sticker: Sticker };
const [modal, setModal] = useState<Modal | null>(null);
```
Elimina 3 `useState<boolean>` e impede 2 modais abrirem juntos.

## Screenshots desta sessão

- `ss_3749a03t7` — Vista inicial (Content 5/8 + Todas)
- `ss_92379gw4t` — Seção QATAR mostrando QAT3, QAT4
- `ss_42143a8qn` — Scroll down Qatar (QAT13-18 visíveis, watermark sobre nomes)
- `ss_9961gi8xm` — Filtro "Faltam" (00 Panini, FWC3, FWC4)
- `ss_878329d9c` — Scroll inicial Especiais (2ª linha)

## Próximos passos sugeridos (priorizados)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| 1 | Trocar covers com watermark "LastSticker.com" por covers limpas | Alto (legal + comercial) | Médio (precisa pipeline novo) |
| 2 | Corrigir contador "X exibidas" pra ser contextual à seção visível | Alto (UX) | Baixo (~10 linhas) |
| 3 | Mostrar stepper em TODOS os cards (qty=0 com "+ Adicionar") | Alto (UX) | Baixo |
| 4 | `npm install next@latest` + smoke test (sair de 16.2.4 stale) | Médio (mata bug dev) | Baixo |
| 5 | Extrair sub-componentes `PriceModal`, `StickerCard`, `SectionBlock` | Médio (manutenibilidade) | Alto (~3h) |
| 6 | QuantityModal/input inline pra qty > 1 | Médio (vendedor frequente) | Baixo |
| 7 | Resolver inconsistência sidebar active (Todas + visível) | Baixo (cosmético) | Baixo |
| 8 | Debounce `updateQuantity` | Médio (rede + DB) | Baixo |

## Sobre a sessão

Esta review SÓ foi possível porque o **auto-login funcionou** (feature shipada nesta mesma sessão). Sem ela, sessão expirada bloqueava acesso à rota.

**Ciclo end-to-end validado:**
1. Sessão expira em prod → skill `p8-auth` ativa Caminho A
2. Bate `/api/dev/auto-login` com token de env
3. Cookie iron-session setada
4. Rota alvo carrega
5. Review acontece sem fricção

A skill atendeu exatamente o pitch. Próximo gap (Turbopack jest-worker) é problema da plataforma Next, não da skill.
