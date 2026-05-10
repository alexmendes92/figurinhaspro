# scripts/prisma-diff-guard.ps1
# Plugin P8-MASTER — wrapper para `prisma migrate diff` + prompt antes de aplicar.
#
# Mostra diff entre schema atual e DB target, exige confirmação humana antes
# de aplicar via `prisma db push` ou `prisma migrate deploy`.
#
# Uso:
#   pwsh -File scripts/prisma-diff-guard.ps1 -Mode push -Env dev
#   pwsh -File scripts/prisma-diff-guard.ps1 -Mode push -Env prod         # bloqueado HARD
#   pwsh -File scripts/prisma-diff-guard.ps1 -Mode migrate -Env prod      # exige confirmação dupla
#   pwsh -File scripts/prisma-diff-guard.ps1 -Mode diff-only              # so mostra, nao aplica
#
# Exit codes:
#   0 — diff aplicado com sucesso (ou diff-only mostrado)
#   1 — pre-check falhou
#   2 — usuario cancelou
#   3 — bloqueio HARD (modo proibido)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("push", "migrate", "diff-only")]
    [string]$Mode = "diff-only",

    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Env = "dev",

    [string]$MigrationName = ""
)

$ErrorActionPreference = "Stop"

# 1. Find raiz P8
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    Write-Host "[prisma-diff-guard] ERRO: nao estamos em P8-FigurinhasPro" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# 2. Bloqueio HARD: push em prod
if ($Mode -eq "push" -and $Env -eq "prod") {
    Write-Host "[prisma-diff-guard] BLOQUEADO: 'prisma db push' em prod e proibido em P8." -ForegroundColor Red
    Write-Host "[prisma-diff-guard] Use -Mode migrate em vez de push pra prod (cria migration formal)." -ForegroundColor Red
    exit 3
}

# 3. Verifica schema valido
Write-Host "[prisma-diff-guard] Verificando schema..."
$schemaPath = Join-Path $projectRoot "prisma\schema.prisma"
if (-not (Test-Path $schemaPath)) {
    Write-Host "[prisma-diff-guard] ERRO: prisma/schema.prisma nao encontrado" -ForegroundColor Red
    exit 1
}

# 4. Mostra diff
Write-Host ""
Write-Host "=== DIFF: schema.prisma vs DB ($Env) ===" -ForegroundColor Cyan

$diffArgs = @(
    "prisma", "migrate", "diff",
    "--from-schema-datasource", "prisma\schema.prisma",
    "--to-schema-datamodel", "prisma\schema.prisma",
    "--script"
)

if ($Env -eq "prod") {
    Write-Host "[prisma-diff-guard] AVISO: usando DATABASE_URL de prod (Vercel env)" -ForegroundColor Yellow
}

$diffOutput = & npx @diffArgs 2>&1
Write-Host $diffOutput
Write-Host ""

# 5. Se diff-only, para aqui
if ($Mode -eq "diff-only") {
    Write-Host "[prisma-diff-guard] Modo diff-only: nada aplicado." -ForegroundColor Green
    exit 0
}

# 6. Resumo + confirmacao
Write-Host "=== Aplicar a $Env? ===" -ForegroundColor Yellow
Write-Host "Modo: $Mode"
Write-Host "Env: $Env"

if ($Env -eq "prod") {
    Write-Host ""
    Write-Host "[prisma-diff-guard] APLICAR EM PROD requer confirmacao DUPLA." -ForegroundColor Red
    Write-Host "[prisma-diff-guard] Pressione 's' duas vezes (em prompts separados)." -ForegroundColor Red
    Write-Host ""

    $confirm1 = Read-Host "Confirmar 1/2 (s/n)"
    if ($confirm1 -ne "s") {
        Write-Host "[prisma-diff-guard] Cancelado." -ForegroundColor Yellow
        exit 2
    }

    $confirm2 = Read-Host "Confirmar 2/2 (s/n)"
    if ($confirm2 -ne "s") {
        Write-Host "[prisma-diff-guard] Cancelado." -ForegroundColor Yellow
        exit 2
    }
} else {
    $confirm = Read-Host "Confirmar (s/n)"
    if ($confirm -ne "s") {
        Write-Host "[prisma-diff-guard] Cancelado." -ForegroundColor Yellow
        exit 2
    }
}

# 7. Aplica
Write-Host ""
Write-Host "[prisma-diff-guard] Aplicando..." -ForegroundColor Cyan

if ($Mode -eq "push") {
    & npx prisma db push
} elseif ($Mode -eq "migrate") {
    if ($Env -eq "dev") {
        if (-not $MigrationName) {
            $MigrationName = Read-Host "Nome da migration"
        }
        & npx prisma migrate dev --name $MigrationName
    } else {
        & npx prisma migrate deploy
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[prisma-diff-guard] FAIL: prisma command retornou exit $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# 8. Regenera client
Write-Host ""
Write-Host "[prisma-diff-guard] Regenerando Prisma Client..."
& npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "[prisma-diff-guard] AVISO: prisma generate falhou. Rode manualmente." -ForegroundColor Yellow
}

# 9. Status final
Write-Host ""
Write-Host "[prisma-diff-guard] PASS: aplicado com sucesso." -ForegroundColor Green
Write-Host "[prisma-diff-guard] Proximos passos:"
Write-Host "  - npm run test (mocks Prisma podem precisar update em src/__tests__/setup.ts)"
Write-Host "  - npm run build"
if ($Env -eq "prod") {
    Write-Host "  - /p8-master:p8-deploy"
}

exit 0
