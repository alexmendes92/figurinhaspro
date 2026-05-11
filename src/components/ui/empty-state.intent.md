---
component: EmptyState
created_at: 2026-05-11
updated_at: 2026-05-11
status: experimental
score: 6/10 (audit 2026-05-11)
---

# Intent — ui/empty-state

Componente reutilizável pra estados vazios (lista sem itens, busca sem resultado, painel sem dados). Estrutura: ícone SVG (via path) + título + descrição opcional + action opcional.

## Decisões não óbvias

### `icon` como string (path SVG), não componente React

**Escolhido:** prop `icon: string` (caminho SVG passado em `d=`).
**Rejeitado:** `icon: ReactNode` ou `icon: LucideIcon`.
**Por quê:** simplicidade — caller passa string compatível com Lucide ou Heroicons sem importar componente. Trade-off: menos flexibilidade (não anima o ícone), mas API mais simples.

### Action polimórfico (`href` OU `onClick`)

**Escolhido:** prop `action: { label, href?, onClick? }`. Render `<Link>` se `href`, `<button>` se `onClick`.
**Rejeitado:** 2 props separadas (`actionLink` + `actionButton`).
**Por quê:** semântica única — "ação principal do empty state". Polimorfismo evita duplicar.

### Sem variants (todo empty state é igual)

**Escolhido:** estilo único — fundo `card`, borda sutil, ícone neutro.
**Rejeitado:** variants `success` / `error` / `info`.
**Por quê:** KISS — diferenciar visualmente quando lista falha vs quando está vazia é responsabilidade do CALLER (passar ícone vermelho ou texto "Erro ao carregar"), não do primitive. Reavaliar se 3+ callers precisarem.

## Trade-offs aceitos

- **`bg-[var(--card,#111318)]`** — usa CSS var legacy com fallback hex. Versão Tailwind 4 puro seria `bg-card`. Migrar quando Pacote A confirmar tokens.
- **Action renderiza `<button>`/`<Link>` inline**, não `<Button>` shadcn — duplica estilos. Migrar pós-Pacote A/B (quando contrato de variants estabilizar).
- **`text-gray-{400,600}`** — não usa tokens semânticos. Sticky do audit.

## Não-negociáveis

- **Estado único renderiza** — não tem múltiplos modos (loading + empty + error). EmptyState é APENAS empty.
- **Action opcional** — empty state sem CTA também é válido.
- **`text-center`** — empty state nunca é left-aligned (decisão estética).

## Questões em aberto

- **Variant `error` quando lista falha?** — abrir se 3+ callers passarem ícone vermelho + descrição "Erro".
- **Migrar para `<Button>` shadcn na action?** — pendente Pacote B fechar.
- **Tokens semânticos** (`bg-card`, `text-muted-foreground`) — pendente Pacote A consolidar.
