@AGENTS.md

# FigurinhasPro

## Stack
Next.js 16.2.1 + React 19.2 + Prisma 7.5 + Neon Postgres + Tailwind 4 + Zod 4.3 + React Compiler

## REGRAS XP (enforced por hooks)

- **Planejamento obrigatorio**: features novas passam por `/plan` antes de codar
- **Build antes de commitar**: hook pre-commit roda `npm run build` automaticamente
- **Commit atomico**: 1 commit = 1 unidade funcional que builda
- **Ciclo**: `/plan` → `/develop` → `/review`

## HOOKS AUTOMATIZADOS

Configurados em `.claude/settings.json`:
- **Pre-commit**: roda `npm run build` antes de cada `git commit`
- **Seguranca**: bloqueia `git add` de `.env`, `dev.db`, credentials
- **Destrutivos**: bloqueia `rm -rf`, `drop table`, `git push --force`

## Comandos
```bash
npm run dev        # Dev server (Turbopack)
npm run build      # Build producao
npm run lint       # ESLint
```
