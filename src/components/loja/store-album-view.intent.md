---
component: StoreAlbumView + módulo loja
created_at: 2026-04-20
updated_at: 2026-04-21
status: promoted-to-variant
variant: vitrine (DESIGN_SYSTEM.md §11.1)
---

# Intent — loja/store-album-view

Vitrine pública consumer-facing que diverge intencionalmente do DS core. Quando o refactor `0dbc343` nasceu, não existia §11 "Route variants" no DESIGN_SYSTEM — o módulo construiu um sub-sistema paralelo sem autorização formal. O review `2026-04-21-1400` apontou isso como 5 críticos de Axis 1. A resposta **não** foi migrar para o core (caminho B), nem expandir variante para toda a app (caminho A), mas **formalizar a divergência** como variante oficial (caminho C).

## Decisões não óbvias

### Variante ao invés de tokens do core

**Escolhido:** sub-sistema próprio em CSS module scoped na `.root`.
**Rejeitado:** usar `.btn-primary`/`.btn-ghost`/surfaces do `globals.css`.
**Por quê:** vitrine precisa de identidade editorial distinta do painel admin. Mesma paleta amber da Arena, porém com canvas mais fundo (`#05070b` vs `#0b0e14`) para stickers brilharem mais, e densidade maior (base 14px vs 16px) para empacotar mais cards por viewport. Força visual > uniformidade.

### OKLCH ao invés de HEX

**Escolhido:** `oklch(0.82 0.15 85)` como accent, não `#fbbf24`.
**Rejeitado:** manter HEX do DS core.
**Por quê:** gradient amber→laranja (`--grad`) é identidade da vitrine (logo da loja, card type badges, CTA primário). HEX em `linear-gradient` produz midtones marrons (interpolação em sRGB). OKLCH preserva chroma perceptualmente. Trade-off aceito: paleta não é bit-identica ao `#fbbf24` do core (quem abrir DevTools verá hue ~0.82 não exatamente `#fbbf24`), mas visualmente equivalente para olhos humanos.

### Bebas Neue como hero font

**Escolhido:** Bebas Neue só no `.heroTitle` (`clamp(56px, 8vw, 82px)`).
**Rejeitado:** Geist Sans black text-7xl (padrão DS §9 core).
**Por quê:** hero vitrine tem função diferente do hero landing. Landing vende o produto SaaS (tom editorial cinematográfico). Vitrine vende figurinhas (tom marketplace colecionável). Narrow display sans (Bebas) remete a magazine covers Panini, pôsteres de futebol, merchandising de copa — semântica visual alinhada ao domínio. Single-use: NÃO se espalha para body, labels, CTAs.

### Shadow como drama

**Escolhido:** box-shadow proeminente em `.heroStk` (60px blur), `.card:hover` (32px), `.drawer` (60px), `.mobileBarBtn` (amber glow).
**Rejeitado:** DS §6 core que diz "drama vem de gradient+motion, não shadow".
**Por quê:** vitrine precisa de hierarquia visual IMEDIATA (sticker brilha → quero comprar) sem depender de animação carregada. Sombra entrega isso estaticamente, motion fica reservada para micro-feedback (add-to-cart bounce, etc.). Core page faz jornada lenta (editorial); vitrine faz decisão rápida (compra).

## Trade-offs aceitos

- **Surface ladder triplicado no repo** — agora coexistem: DS MD (`#0d1017/#0f1219/#111318/#1a1f2e`), design-tokens.json (alinhado ao MD após reconciliação), e variante vitrine (`#05070b → #242a3a`). Reconciliação ✓ em 2026-04-21, mas variante tem seu próprio ladder propositalmente.
- **Botões duplicados** — `.btnPrimary`/`.btnGhost` do módulo coexistem com `.btn-primary`/`.btn-ghost` do globals. DESIGN_SYSTEM §11.1 documenta: na vitrine, prefira o do módulo; no core, o do globals. Não é ideal, é explícito.
- **Radius arbitrário 4-14px** — fora do Tailwind scale (6/8/12). Documentado em §11.1 como escala micro da variante.

## Não-negociáveis

- **Nenhum token da variante vaza para fora da rota `/loja/**`** — se outra rota precisar de drawer/card parecido, cria SUA variante ou promove o pattern para o core.
- **Motion fica uno no projeto** — `@keyframes slideInRight`/`fadeIn` foram removidos do módulo em 2026-04-21; agora usa `slide-in-right`/`fade-in` do `globals.css`. Se alguém reintroduzir keyframes com nome duplicado, rejeitar no review.
- **Acessibilidade não é sacrificada pela estética** — `--fg-ghost`/`--fg-mute` foram recalibrados em 2026-04-21 para ≥4.5:1 AA. Modais ganharam `useDialog` (Escape + focus-trap + role). Botões do card foram desaninhados. Futuros tweaks visuais não regridem isso.

## Questões em aberto

- **Drawer migrar para core?** — se `/painel` precisar de drawer lateral, vale promover para componente compartilhado em `src/components/ui/drawer.tsx` e usar dos dois lados.
- **Emojis permanecem na promo row?** — trocados para SVG Heroicons em 2026-04-21. Decisão: manter SVG como padrão; emojis ficam fora por inconsistência cross-platform (render diferente em Windows/Mac/Linux).
- **Variante promove para P1 (Sistema Arena Cards)?** — P1 já tem identidade cinematic-dark; adotar vitrine OKLCH lá muda personalidade. Não há plano. Revisitar se P1 ganhar loja pública similar.

## Supersedes

- Pre-2026-04-21: módulo usava HEX não declarados + @keyframes duplicados + botões aninhados + fg-ghost/fg-mute com contraste abaixo de 4.5:1. Review `2026-04-21-1400` capturou como 12 críticos. Corrigido + formalizado nesta iteração.
