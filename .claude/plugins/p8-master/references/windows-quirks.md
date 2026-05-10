# Windows Quirks — referência P8-FigurinhasPro

> P8 roda em Windows + Git Bash + PowerShell. Esta doc cobre gotchas conhecidos.

---

## Path issues

### Use paths absolutos em Bash sequencial

Cada Bash tool call **reseta cwd**. Não confie em `cd ../foo`:

```bash
# ❌ ERRADO
cd ../P3-CRMArenaCards
git status
# Em chamada Bash diferente: cd não persiste

# ✅ CORRETO
cd "/c/Users/conta/Projetos/ArenaCards/P3-CRMArenaCards" && git status
```

### Bash vs PowerShell paths

```bash
# Git Bash (MSYS2)
/c/Users/conta/Projetos/...

# PowerShell
C:\Users\conta\Projetos\...

# Mixed (Read tool no Claude Code aceita ambos)
C:\Users\conta\Projetos\...   # preferível em Read absoluto
```

---

## Encoding

### Stdout cp1252 quebra em UTF-8

Python no Windows defaulta cp1252 e quebra em chars como `→`, `–`, `±`, emoji.

```python
# Padrão P8 — adicionar no topo de scripts Python que printam UTF-8:
import io, sys
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass
```

Alternativa: setar env `PYTHONIOENCODING=utf-8` antes de rodar Python.

### Git CRLF warnings

```
warning: in the working copy of 'X', LF will be replaced by CRLF the next time Git touches it
```

Esperado em Windows. Não é erro — Git aplica `core.autocrlf=true` (default em git-for-windows).

Pra silenciar:
```bash
git config --local core.autocrlf input
```

Mas P8 mantém autocrlf padrão pra evitar problemas com colaboradores em Linux/Mac.

---

## PowerShell quirks

### Variáveis em string `&`-call

```powershell
# ❌ ERRADO — $base é interpretado como literal
pwsh -Command "$base = 'foo'; ..."  # bash escapa $base antes de passar

# ✅ CORRETO — usar aspas simples por fora
pwsh -Command '$base = ''foo''; ...'

# OU melhor: usar -File <script.ps1>
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/foo.ps1 -Arg1 valor
```

### `Get-ChildItem` recursivo

```powershell
# Lento em grandes dirs
Get-ChildItem -Recurse  # processa node_modules

# Rápido
Get-ChildItem -Recurse -Exclude node_modules,.next,.git
```

Bash `find` ou `Glob` tool é geralmente mais rápido.

### Output como object array

```powershell
$output = & pwsh -File foo.ps1 2>&1

# $output é array de objetos, não string
# Para regex match, converter:
$outputText = ($output | Out-String)
if ($outputText -match "pattern") { ... }
```

Bug capturado em `tests/integration/test_session_start_hook.ps1` (Fase 2).

---

## Stripe CLI no Windows

```bash
# Instalar via Scoop
scoop install stripe

# Ou via direct download
# https://github.com/stripe/stripe-cli/releases

# Confirmar
stripe --version
```

`stripe listen --forward-to` funciona em Windows mas:
- Não suporta `Ctrl+C` graceful em alguns terminais
- WebSocket pode falhar atrás de proxy corporativo

---

## `npx` first-run lento

Primeira vez que `npx <pacote>` roda em Windows: 30-60s pra baixar.

Pre-aquecer caches:
```bash
npx prisma --version
npx vercel --version
npx tsc --version
npx vitest --version
```

Ou instalar como devDependency em `package.json` pra usar binário local (mais rápido).

---

## Symlinks (gitignored)

`prisma generate` cria symlinks em `node_modules/.prisma/client` que **não funcionam** em Windows sem privilégio admin.

Solução em P8: `output = "../src/generated/prisma"` no schema. Cliente é gerado como pasta normal, não symlink.

---

## Hook execution

Hooks PowerShell (`.ps1`) precisam:
```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File hooks/foo.ps1
```

Sem `-ExecutionPolicy Bypass`, Windows bloqueia scripts não-assinados.

`-NoProfile` evita carregar profile do user (mais rápido + isolado).

---

## VS Code / Cursor terminal

Default em Windows:
- VS Code: PowerShell
- Cursor: PowerShell
- Git for Windows install: Git Bash

Plugin P8-MASTER suporta ambos:
- `.ps1` para Windows nativo
- `.sh` para Git Bash
- Hooks executam em ambos via try-cascade

---

## Long path support

Windows tem limite default de 260 chars em path. P8 pode bater isso em:
- `node_modules/some/deep/nested/package/...`
- `worktrees/<long-hash>/src/...`

Habilitar long paths:
```powershell
# Como admin, uma vez
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

E em `git config`:
```bash
git config --global core.longpaths true
```

---

## Tempo de boot do plugin

Hook `SessionStart` em `.ps1` tem overhead de ~200ms (cold start PowerShell). Aceitável.

Bash equivalente (`session-start.sh`) é mais rápido (~50ms) mas não é nativo Windows.

P8-MASTER prioriza `.ps1` em Windows (consistência), `.sh` como fallback Git Bash.

---

## Common errors

### "The term 'X' is not recognized"

PowerShell não acha comando. Causas:
- Comando não está em PATH (rodar em terminal diferente onde PATH está OK)
- Variável interpretada como comando (escape com `&`)

### "Access to the path 'X' is denied"

Antivírus bloqueando. Solução temporária: desativar real-time protection ou whitelist do projeto P8.

### "Cannot bind argument to parameter"

Aspas confundindo PowerShell. Use `--%` pra desabilitar parsing:
```powershell
pwsh --% -File foo.ps1 -Arg "valor com espaços"
```

---

## Ver também

- [hooks/](../hooks/) — todos os hooks são `.ps1` + `.sh` paralelos
- [scripts/](../scripts/) — wrapper PowerShell + Python cross-platform
- [tests/run-all.ps1](../tests/run-all.ps1), [tests/run-all.sh](../tests/run-all.sh)
- ANTIPATTERN `RELATIVE_CD` em `~/.claude/ANTIPATTERNS.md` — global do user
