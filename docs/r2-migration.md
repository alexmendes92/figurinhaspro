# Migracao de imagens para Cloudflare R2

Atualizado em 2026-04-20.

## Escopo

- Projeto: `P8-FigurinhasPro`
- Bucket R2: `figurinhapro-images`
- Dominio publico: `https://figurinhasproimg.arenacards.com.br`
- Objetivo: remover a dependencia de `public/albums`, `public/stickers`, `public/covers` e `public/flags` no deploy da Vercel

## O que mudou

- `src/lib/images.ts` passou a normalizar paths relativos e montar URLs absolutas usando `NEXT_PUBLIC_IMAGES_BASE_URL`
- rotas e telas publicas/admin que renderizam capas, paginas e bandeiras passaram a consumir `imgUrl(...)`
- `next.config.ts` recebeu `remotePatterns` para `figurinhasproimg.arenacards.com.br`
- `next.config.ts` recebeu redirects legados de `/albums/*`, `/stickers/*`, `/covers/*` e `/flags/*` para o dominio publico do R2
- scripts one-shot foram adicionados para auditoria de paridade e upload de faltantes

## Variaveis de ambiente

### Publica

```dotenv
NEXT_PUBLIC_IMAGES_BASE_URL=https://figurinhasproimg.arenacards.com.br
```

### Auditoria/upload R2

```dotenv
R2_ACCOUNT_ID=0385cd88c3c30bc626d1585d53b62590
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=figurinhapro-images
R2_PUBLIC_BASE=https://figurinhasproimg.arenacards.com.br
```

## Scripts

```bash
npm run r2:audit -- --public-root "C:\\Users\\conta\\Projetos\\ArenaCards\\P8-FigurinhasPro\\public"
npm run r2:upload-missing -- --public-root "C:\\Users\\conta\\Projetos\\ArenaCards\\P8-FigurinhasPro\\public"
```

### Observacoes

- `r2:audit` funciona em dois modos:
  - S3 API, quando `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` existem
  - HTTP HEAD, quando apenas `R2_PUBLIC_BASE` existe
- no worktree da migracao, os assets gigantes nao estavam presentes porque essas pastas sao ignoradas no git; por isso a auditoria foi executada apontando para o checkout original com `--public-root`

## Verificacoes executadas

- `npm run test`
- `npm run build`
- `npm run r2:audit -- --public-root "C:\\Users\\conta\\Projetos\\ArenaCards\\P8-FigurinhasPro\\public"`
- preview deploy validado em:
  - `/albuns` com `src` direto no dominio do R2
  - `/loja/santana?browse=true` com capas e bandeiras no dominio do R2
  - `/covers/2022.webp` respondendo com redirect `307` para `https://figurinhasproimg.arenacards.com.br/covers/2022.webp`
- producao validada em:
  - `https://album-digital-ashen.vercel.app/albuns` respondendo `200` com imagens no dominio do R2
  - `https://album-digital-ashen.vercel.app/loja/santana?browse=true` renderizando capas e bandeiras no dominio do R2
  - `https://album-digital-ashen.vercel.app/covers/2022.webp` respondendo `307` para `https://figurinhasproimg.arenacards.com.br/covers/2022.webp`

## Limpeza local dos assets

As pastas `public/albums`, `public/stickers`, `public/covers` e `public/flags` ja estavam fora do controle de versao. A remocao fisica foi feita no checkout original apos a validacao final, com backup em:

```text
C:\Users\conta\Projetos\ArenaCards\_backups\P8-FigurinhasPro-public-assets-2026-04-20
```
