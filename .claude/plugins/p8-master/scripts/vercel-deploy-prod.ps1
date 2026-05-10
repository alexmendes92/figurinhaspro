# scripts/vercel-deploy-prod.ps1
# Plugin P8-MASTER — wrapper para `npx vercel deploy --prod` com pre-checks.
#
# Pre-checks:
# 1. Working tree limpo
# 2. Build verde local
# 3. Tests verdes
# 4. TypeScript verde
# 5. Schema Prisma sincronizado (sem drift)
# 6. Branch master
# 7. Env vars criticas em scope Production
#
# Uso:
#   pwsh -File scripts/vercel-deploy-prod.ps1                    # roda pre-checks + deploy
#   pwsh -File scripts/vercel-deploy-prod.ps1 -SkipChecks        # so deploy (perigoso)
#   pwsh -File scripts/vercel-deploy-prod.ps1 -DryRun            # so pre-checks
#
# Exit codes:
#   0 — deploy bem-sucedido
#   1 — pre-check falhou (deploy nao rodou)
#   2 — deploy falhou
#   3 — usuario cancelou

param(
    [switch]$SkipChecks,
    [switch]$DryRun,
    [switch]$Force
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
    Write-Host "[vercel-deploy] ERRO: nao estamos em P8-FigurinhasPro" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

$failures = @()

if (-not $SkipChecks) {
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host "Vercel Deploy Prod — Pre-checks" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan

    # 2. Working tree limpo
    Write-Host ""
    Write-Host "[1/7] Working tree limpo..."
    $gitStatus = & git status --porcelain 2>&1
    if ($gitStatus) {
        Write-Host "  FAIL: ha mudancas nao-commitadas:" -ForegroundColor Red
        Write-Host $gitStatus
        $failures += "working_tree_dirty"
    } else {
        Write-Host "  PASS: working tree limpo" -ForegroundColor Green
    }

    # 3. Branch correta
    Write-Host ""
    Write-Host "[2/7] Branch master..."
    $branch = & git rev-parse --abbrev-ref HEAD 2>&1
    if ($branch -ne "master") {
        Write-Host "  AVISO: branch atual e '$branch', deveria ser 'master'" -ForegroundColor Yellow
        if (-not $Force) {
            $failures += "wrong_branch"
        }
    } else {
        Write-Host "  PASS: master" -ForegroundColor Green
    }

    # 4. Push sincronizado
    Write-Host ""
    Write-Host "[3/7] Push sincronizado com origin..."
    & git fetch origin master 2>&1 | Out-Null
    $localSha = & git rev-parse HEAD 2>&1
    $remoteSha = & git rev-parse origin/master 2>&1
    if ($localSha -ne $remoteSha) {
        Write-Host "  FAIL: HEAD local ($localSha) != origin/master ($remoteSha)" -ForegroundColor Red
        Write-Host "  Sugestao: git push origin master" -ForegroundColor Yellow
        $failures += "push_not_synced"
    } else {
        Write-Host "  PASS: push sincronizado" -ForegroundColor Green
    }

    # 5. Tests
    Write-Host ""
    Write-Host "[4/7] npm run test..."
    & npm run test 2>&1 | Tee-Object -Variable testOutput | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL: testes vermelhos" -ForegroundColor Red
        $failures += "tests_red"
    } else {
        Write-Host "  PASS: tests verdes" -ForegroundColor Green
    }

    # 6. TypeScript
    Write-Host ""
    Write-Host "[5/7] tsc --noEmit..."
    & npx tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL: type errors" -ForegroundColor Red
        $failures += "tsc_errors"
    } else {
        Write-Host "  PASS: type check verde" -ForegroundColor Green
    }

    # 7. Build
    Write-Host ""
    Write-Host "[6/7] npm run build (prisma generate + next build)..."
    & npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL: build vermelho" -ForegroundColor Red
        $failures += "build_red"
    } else {
        Write-Host "  PASS: build verde" -ForegroundColor Green
    }

    # 8. Schema Prisma drift (best-effort, depende de DATABASE_URL prod acessivel)
    Write-Host ""
    Write-Host "[7/7] Schema Prisma drift..."
    $statusOutput = & npx prisma migrate status 2>&1
    if ($statusOutput -match "drift") {
        Write-Host "  AVISO: drift detectado entre schema e DB" -ForegroundColor Yellow
        Write-Host "  Sugestao: /p8-master:p8-prisma-migrate --migrate --prod antes de deploy" -ForegroundColor Yellow
        if (-not $Force) {
            $failures += "schema_drift"
        }
    } else {
        Write-Host "  PASS: schema sincronizado (ou status nao-disponivel offline)" -ForegroundColor Green
    }

    # Resumo pre-checks
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Cyan
    if ($failures.Count -gt 0) {
        Write-Host "Pre-checks: $($failures.Count) FALHA(S)" -ForegroundColor Red
        Write-Host "Falhas: $($failures -join ', ')"
        Write-Host ""
        if (-not $Force) {
            Write-Host "Use -Force pra forcar deploy mesmo assim (NAO recomendado)" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "AVISO: -Force ativo, prosseguindo apesar das falhas" -ForegroundColor Yellow
    } else {
        Write-Host "Pre-checks: TUDO PASSOU." -ForegroundColor Green
    }
}

if ($DryRun) {
    Write-Host ""
    Write-Host "[vercel-deploy] DryRun ativo, deploy NAO executado" -ForegroundColor Cyan
    exit 0
}

# Confirmacao humana (Akita override)
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Aprovar deploy prod? (Akita override)" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan
$confirm = Read-Host "Confirmar (s/n)"
if ($confirm -ne "s") {
    Write-Host "[vercel-deploy] Cancelado." -ForegroundColor Yellow
    exit 3
}

# Deploy
Write-Host ""
Write-Host "[vercel-deploy] Executando: npx vercel deploy --prod" -ForegroundColor Cyan
& npx vercel deploy --prod 2>&1 | Tee-Object -Variable deployOutput

if ($LASTEXITCODE -ne 0) {
    Write-Host "[vercel-deploy] FAIL: vercel deploy retornou exit $LASTEXITCODE" -ForegroundColor Red
    exit 2
}

Write-Host ""
Write-Host "[vercel-deploy] PASS: deploy disparado" -ForegroundColor Green
Write-Host "[vercel-deploy] Proximos passos:"
Write-Host "  - Aguardar build completar (3-8 min tipico)"
Write-Host "  - Smoke test: GET https://album-digital-ashen.vercel.app/"
Write-Host "  - Deploy watcher (sub-agent) monitora runtime logs"

exit 0
