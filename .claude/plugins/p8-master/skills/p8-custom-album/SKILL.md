---
name: p8-master:p8-custom-album
description: Auto-ativa quando o usuário pedir validação de custom albums em P8-FigurinhasPro, ou quando há mudanças em `src/lib/custom-albums.ts` ou modelo `CustomAlbum` no schema. Valida parser de stickers (ranges `1-670`, prefixos `BRA1-BRA20`, listas mistas), geração de slug com prefixo `custom_`, e conversão `CustomAlbum` → interface `Album` usada em todo o sistema.
argument-hint: ""
---

Vou auditar / validar custom albums em P8-FigurinhasPro.

**Contexto:** Custom albums permitem ao vendedor criar álbuns próprios (não só os estáticos). [`src/lib/custom-albums.ts`](../../../../src/lib/custom-albums.ts) é o módulo central que:
1. Faz parser de stickers (notação flexível: `1-670`, `BRA1-BRA20`, `BRA1, BRA5, A10-A20`)
2. Gera slug com prefixo `custom_<sellerId>_<nome-slug>` (evita conflito com static albums)
3. Converte modelo `CustomAlbum` (Prisma) → interface `Album` (compartilhada com static)

## Sequência

1. **Spawn `extrator` (Haiku)** com `grep-evidence.py`:
   - Padrão: `parseStickers|generateSlug|customAlbumToAlbum|fromCustomAlbum`
   - Path: `src/`
   - Retorna: definição + callers de cada função

2. **Spawn `p8-domain-expert` (Sonnet)** pra ler:
   - `src/lib/custom-albums.ts` integral
   - `prisma/schema.prisma` modelo `CustomAlbum`
   - `src/lib/albums.ts` interface `Album` (server-only, ~1.4MB — mas leitura targeted)
   - `src/__tests__/setup.ts` mock de `customAlbum`

3. **Validar 5 dimensões:**

### a) Parser de stickers

Casos de teste implícitos:
| Input | Esperado |
|---|---|
| `"1-670"` | Array de 670 stickers numerados de 1 a 670 |
| `"BRA1-BRA20"` | Array de 20 com prefixo BRA |
| `"BRA1, BRA5, A10-A20"` | Mix: 2 individuais + range A10-A20 |
| `""` | Array vazio |
| `"1-1"` | Array com 1 elemento |
| `"1, 2, 3, 1"` | Deduplicação? (verificar comportamento) |
| `"abc"` (inválido) | Erro? Array vazio? (verificar) |
| `"1-1000000"` | Range gigante — limit? (verificar) |

Plugin verifica:
- Função `parseStickers` (ou nome similar) tem testes em `src/lib/__tests__/custom-albums.test.ts`?
- Cobertura cobre todos os casos acima?
- Edge cases tratados (input vazio, range invertido `670-1`, números negativos)?

### b) Slug generation

- Slug sempre tem prefixo `custom_`?
- Slug é único por seller (constraint `@@unique([sellerId, slug])` em `CustomAlbum`)?
- Slug suporta acentos / caracteres especiais (kebab-case)?
- Slug colide com static album slug? (testar)

### c) Conversão `CustomAlbum` → `Album`

Função `customAlbumToAlbum(custom: CustomAlbum): Album`:
- Mapeia todos os campos necessários?
- `coverUrl` é gerada/herdada?
- `stickers` (JSON do CustomAlbum) é transformado em array tipado?
- Sections são geradas (ou opcionais)?

### d) Callsites

Lista de todos os lugares que usam custom albums:
- `src/app/painel/estoque/novo/page.tsx` — criação
- `src/app/api/albums/route.ts` — CRUD API
- `src/app/loja/[slug]/[albumSlug]/page.tsx` — vitrine pública (lista import faltante)
- `src/components/painel/inventory-manager.tsx` — gestão de estoque

Verifica cada um respeita o prefixo `custom_*` e não trata como static.

### e) Schema constraints

- `CustomAlbum.sellerId` → `Seller.id` (FK)
- `@@unique([sellerId, slug])` — sem 2 albums com mesmo slug por vendedor
- `stickers` (JSON) — tipo TypeScript no Prisma client é `Prisma.JsonValue` (validar parse runtime)
- `coverUrl` — opcional? required?

4. **Compilar relatório:**

```markdown
## Custom Albums Health Report

### Parser
- Função: `parseStickers` em `src/lib/custom-albums.ts:N`
- Testes: ✅ 7/8 casos cobertos / ❌ falta caso edge X
- Coverage: 85%

### Slug
- Função: `generateSlug` em `src/lib/custom-albums.ts:N`
- Constraint Prisma: ✅ unique
- Risco de colisão com static: ✅ prefixo `custom_` previne

### Conversão CustomAlbum → Album
- Função: `customAlbumToAlbum` em `src/lib/custom-albums.ts:N`
- Mapping completo: ✅ todos os campos / ⚠️ `coverUrl` opcional
- Testes: ❌ 0% — gap conhecido

### Callsites (4)
1. ...

### Riscos detectados
- Sem teste pra conversão → mudança em schema pode quebrar silently
- Range `1-1000000` aceito? Causa OOM?

### Recomendações
- [ ] Adicionar teste pra range gigante
- [ ] Adicionar teste pra `customAlbumToAlbum`
- [ ] Documentar formato do JSON `stickers` em comentário no schema
```

5. **Sugerir próximos passos:**
   - "Gerar `/p8-master:plano` pra fechar gaps de cobertura?"
   - Se sim: cria plano em `thoughts/planos/`.

## Restrições

- **Não modifica `custom-albums.ts`** automaticamente.
- **Sempre cita arquivo:linha**.
- **Não roda testes destrutivos** (input gigante que pode travar).
- **Cobertura: lê `coverage.xml` se existir**, senão sugere `npm run test -- --coverage`.

## Modelo recomendado

- **Main session: Sonnet** — relatório estruturado.
- **Sub-agents:** `extrator` (Haiku), `p8-domain-expert` (Sonnet).

## Ver também

- [P8-FigurinhasPro/src/lib/custom-albums.ts](../../../../src/lib/custom-albums.ts) — alvo
- [P8-FigurinhasPro/prisma/schema.prisma](../../../../prisma/schema.prisma) — modelo `CustomAlbum`
- [agents/p8-domain-expert.md](../../agents/p8-domain-expert.md)
- [skills/plano/SKILL.md](../plano/SKILL.md) — onde gaps viram plano executável
