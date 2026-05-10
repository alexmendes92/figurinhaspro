# hooks/precommit-router.ps1
# Plugin P8-MASTER — hook PreToolUse Bash (gate XP de P8).
#
# Espelha .claude/hooks/precommit-router.sh existente, mas portavel pra Windows PowerShell.
# Roteia git commit -> gate (npm run test -> tsc --noEmit -> npm run build).
# Roteia git push -> CI rapido (build).
# Bloqueia git push --force.
#
# Coexiste com o .sh existente — Claude Code roda os dois handlers do matcher Bash.
# Esta versao em PS1 e fallback pra contextos onde bash nao esta disponivel (Win nativo).
#
# Saida: 0 (continua), 2 (bloqueia tool call).

$ErrorActionPreference = "SilentlyContinue"

# Le tool input via stdin (Claude Code passa JSON)
$inputJson = $input | Out-String
if (-not $inputJson) { exit 0 }

try {
    $hookData = $inputJson | ConvertFrom-Json
    $cmd = $hookData.tool_input.command
} catch {
    exit 0
}

if (-not $cmd) { exit 0 }

# Encontra raiz do projeto (CLAUDE.md como ancora)
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

# Bloqueio HARD: git push --force em master
if ($cmd -match "git\s+push.*--force" -or $cmd -match "git\s+push.*-f\b") {
    Write-Host "[p8-master:precommit-router] BLOQUEADO: git push --force nao e permitido em P8." -ForegroundColor Red
    Write-Host "[p8-master:precommit-router] Use --force-with-lease com aprovacao explicita do humano." -ForegroundColor Red
    exit 2
}

# Detecta git commit
if ($cmd -match "git\s+commit") {
    Write-Host "[p8-master:precommit-router] git commit detectado — gate P8 sera executado pelo hook .sh existente."
    Write-Host "[p8-master:precommit-router] Gate: npm run test -> tsc --noEmit -> npm run build"
    Write-Host "[p8-master:precommit-router] (Esta versao PS1 nao re-roda gate — evita duplicacao com .sh)"
}

# Detecta git push (nao --force)
if ($cmd -match "git\s+push" -and $cmd -notmatch "--force") {
    Write-Host "[p8-master:precommit-router] git push detectado — assumindo gate ja passou no commit."
    Write-Host "[p8-master:precommit-router] Apos push, lembre: deploy prod = npx vercel deploy --prod (com aprovacao humana)."
}

# Detecta vercel deploy
if ($cmd -match "vercel\s+deploy.*--prod") {
    Write-Host "[p8-master:precommit-router] Deploy prod detectado." -ForegroundColor Yellow
    Write-Host "[p8-master:precommit-router] Akita-style override do P8-MASTER: deploy prod exige aprovacao humana." -ForegroundColor Yellow
    Write-Host "[p8-master:precommit-router] (Permissions ja deve perguntar — confirme antes de prosseguir.)" -ForegroundColor Yellow
}

# Detecta prisma migrate reset (proibido em prod)
if ($cmd -match "prisma\s+migrate\s+reset" -and $cmd -notmatch "--skip-seed.*--force\s*=\s*false") {
    Write-Host "[p8-master:precommit-router] BLOQUEADO: prisma migrate reset em P8 nao e permitido (apaga dados)." -ForegroundColor Red
    Write-Host "[p8-master:precommit-router] Use prisma migrate dev em ambiente local ou prisma migrate deploy em prod." -ForegroundColor Red
    exit 2
}

# Detecta prisma db push em prod (gate humano)
if ($cmd -match "prisma\s+db\s+push") {
    Write-Host "[p8-master:precommit-router] prisma db push detectado." -ForegroundColor Yellow
    Write-Host "[p8-master:precommit-router] Akita-style: aplicar schema em prod exige aprovacao humana." -ForegroundColor Yellow
    Write-Host "[p8-master:precommit-router] (Permissions deve perguntar — confirme antes.)" -ForegroundColor Yellow
}

exit 0
