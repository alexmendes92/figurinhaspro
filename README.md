# FigurinhasPro

> App moderno de album digital de figurinhas com loja, painel administrativo e controle de estoque. Construido com Next.js 16 + Prisma + SQLite.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Frontend | React 19 + TypeScript 5 |
| Estilizacao | Tailwind CSS 4 |
| Banco de dados | SQLite via Better-SQLite3 + Prisma 7.5 |
| Validacao | Zod 4 |
| Imagens | Sharp |
| Compilador | React Compiler (babel-plugin-react-compiler) |

## Estrutura

```
FigurinhasPro/
├── app/
│   ├── (auth)/            → Autenticacao
│   │   ├── login/         → Tela de login
│   │   └── registro/      → Tela de registro
│   ├── (marketing)/       → Paginas publicas/marketing
│   ├── albuns/            → Visualizacao de albums
│   │   └── [year]/        → Album por ano (viewer)
│   ├── loja/              → Loja publica
│   │   └── [slug]/        → Loja por vendedor
│   │       └── [albumSlug]/ → Album especifico na loja
│   ├── painel/            → Painel administrativo
│   │   ├── estoque/       → Gestao de estoque
│   │   ├── loja/          → Config da loja
│   │   ├── pedidos/       → Gestao de pedidos
│   │   └── precos/        → Gestao de precos
│   ├── api/               → API Routes
│   │   ├── auth/          → Login, logout, registro
│   │   ├── inventory/     → Estoque (CRUD + bulk)
│   │   ├── orders/        → Pedidos
│   │   └── prices/        → Precos
│   ├── layout.tsx         → Layout raiz
│   └── page.tsx           → Home
│
├── components/
│   ├── album-shelf.tsx    → Prateleira de albums
│   ├── album-viewer.tsx   → Visualizador de album
│   ├── app-shell.tsx      → Shell da aplicacao
│   ├── cart-drawer.tsx    → Carrinho lateral
│   ├── sticker-panel.tsx  → Painel de figurinhas
│   ├── toast.tsx          → Notificacoes
│   ├── loja/              → Componentes da loja
│   └── painel/            → Componentes do painel
│
├── lib/
│   ├── db.ts              → Conexao Prisma/SQLite
│   ├── auth.ts            → Logica de autenticacao
│   ├── albums.ts          → Dados de albums
│   ├── albums-data.ts     → Catalogo de albums
│   ├── album-covers.ts    → Capas dos albums
│   ├── page-sticker-map.ts → Mapeamento figurinha-pagina
│   ├── cart-context.tsx   → Contexto do carrinho
│   └── toast-context.tsx  → Contexto de notificacoes
│
├── public/                → Assets estaticos
└── dev.db                 → Banco SQLite local
```

## Setup Local

```bash
npm install
npm run dev
```

O banco SQLite (`dev.db`) ja esta incluido no projeto.

## Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Inicia dev server (Next.js) |
| `npm run build` | Build de producao |
| `npm run start` | Inicia producao |
| `npm run lint` | Linter ESLint |

## Funcionalidades

- **Albums:** Visualizacao de albums de figurinhas por ano com viewer interativo
- **Loja:** Loja publica por vendedor com carrinho de compras
- **Painel Admin:** Estoque, pedidos, precos, configuracao da loja
- **Auth:** Login/registro com rotas protegidas
- **API REST:** Endpoints para auth, inventario, pedidos e precos

## Notas Importantes

- **Next.js 16**: APIs de request assincronas (`await params`, `await cookies()`), `proxy.ts` substitui `middleware.ts`, Turbopack como bundler padrao. Consultar `AGENTS.md` ou `node_modules/next/dist/docs/`.
- **Prisma 7**: Config centralizada em `prisma.config.ts`, driver adapters obrigatorios, `.env` nao carrega automaticamente.
- **Tailwind CSS 4**: Config via CSS (`@theme inline` em `globals.css`), sem `tailwind.config.js`.
- **Zod 4**: Reescrita completa — APIs podem diferir do Zod 3.
- **React Compiler**: Ativado — `useMemo`/`useCallback`/`React.memo` sao desnecessarios.

## Hospedagem

Configurado para Vercel (`.vercel/` presente). SQLite local funciona em dev mas tem limitacoes em serverless.
