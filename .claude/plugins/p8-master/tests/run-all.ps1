# tests/run-all.ps1
# Plugin P8-MASTER — entry point pra rodar toda bateria de testes em Windows.
#
# Roda:
# 1. pytest unit (test_inventory.py, test_validate_frontmatter.py)
# 2. PowerShell integration tests
#
# Exit 0 se tudo verde, 1 se alguma falha.

$ErrorActionPreference = "Continue"

$PluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$totalFailures = 0

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Plugin P8-MASTER — Bateria de testes" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# 1. Pytest unit
Write-Host "## 1. Pytest unit tests ##" -ForegroundColor Yellow
$pytestExe = Get-Command pytest -ErrorAction SilentlyContinue
if (-not $pytestExe) {
    # Tenta python -m pytest
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonExe) {
        Write-Host "AVISO: python nao encontrado — pulando pytest" -ForegroundColor Yellow
    } else {
        Write-Host "Rodando: python -m pytest tests/unit/"
        Push-Location $PluginRoot.Path
        & python -m pytest tests/unit/ -v 2>&1 | Tee-Object -Variable pytestOutput
        $pytestExit = $LASTEXITCODE
        Pop-Location
        if ($pytestExit -ne 0) {
            Write-Host "FAIL: pytest unit (exit $pytestExit)" -ForegroundColor Red
            $totalFailures++
        } else {
            Write-Host "PASS: pytest unit" -ForegroundColor Green
        }
    }
} else {
    Push-Location $PluginRoot.Path
    & pytest tests/unit/ -v 2>&1
    $pytestExit = $LASTEXITCODE
    Pop-Location
    if ($pytestExit -ne 0) {
        Write-Host "FAIL: pytest unit (exit $pytestExit)" -ForegroundColor Red
        $totalFailures++
    } else {
        Write-Host "PASS: pytest unit" -ForegroundColor Green
    }
}

# 2. PowerShell integration tests
Write-Host ""
Write-Host "## 2. PowerShell integration tests ##" -ForegroundColor Yellow

$integrationTests = @(
    "tests/integration/test_session_start_hook.ps1",
    "tests/integration/test_skill_orchestrator.ps1"
)

foreach ($test in $integrationTests) {
    $testPath = Join-Path $PluginRoot.Path $test
    if (Test-Path $testPath) {
        Write-Host ""
        Write-Host "Rodando: $test"
        & pwsh -NoProfile -ExecutionPolicy Bypass -File $testPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "FAIL: $test (exit $LASTEXITCODE)" -ForegroundColor Red
            $totalFailures++
        }
    } else {
        Write-Host "AVISO: $test nao encontrado" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
if ($totalFailures -eq 0) {
    Write-Host "TUDO PASSOU." -ForegroundColor Green
    exit 0
} else {
    Write-Host "$totalFailures suite(s) com falhas." -ForegroundColor Red
    exit 1
}
