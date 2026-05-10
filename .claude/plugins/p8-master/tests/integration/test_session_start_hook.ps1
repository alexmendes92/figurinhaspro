# tests/integration/test_session_start_hook.ps1
# Plugin P8-MASTER — testa hook session-start.ps1.
#
# Casos:
# 1. Rodar dentro de P8-FigurinhasPro -> deve anunciar plugin ativo
# 2. Rodar fora de P8 -> deve anunciar inativo
# 3. Exit code 0 nos dois casos (nao bloquear sessao)

$ErrorActionPreference = "Stop"

$ScriptPath = Join-Path $PSScriptRoot ".." ".." "hooks" "session-start.ps1"
$ScriptPath = (Resolve-Path $ScriptPath).Path

if (-not (Test-Path $ScriptPath)) {
    Write-Host "FAIL: session-start.ps1 nao encontrado em $ScriptPath" -ForegroundColor Red
    exit 1
}

$P8Root = Resolve-Path (Join-Path $PSScriptRoot ".." ".." ".." ".." "..")
$failures = 0

# Caso 1: dentro de P8
Write-Host "=== Teste 1: rodar dentro de P8 ==="
Push-Location $P8Root.Path
try {
    $output = & pwsh -NoProfile -ExecutionPolicy Bypass -File $ScriptPath 2>&1
    $exitCode = $LASTEXITCODE
    $outputText = ($output | Out-String)
    if ($exitCode -ne 0) {
        Write-Host "FAIL: exit code = $exitCode (esperado 0)" -ForegroundColor Red
        $failures++
    } elseif ($outputText -notmatch "Plugin ativo em P8-FigurinhasPro") {
        Write-Host "FAIL: nao anunciou 'Plugin ativo'. Output:" -ForegroundColor Red
        Write-Host $outputText
        $failures++
    } else {
        Write-Host "PASS: plugin anunciou ativacao em P8" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# Caso 2: fora de P8
Write-Host ""
Write-Host "=== Teste 2: rodar fora de P8 ==="
$tempDir = [System.IO.Path]::GetTempPath()
Push-Location $tempDir
try {
    $output = & pwsh -NoProfile -ExecutionPolicy Bypass -File $ScriptPath 2>&1
    $exitCode = $LASTEXITCODE
    $outputText = ($output | Out-String)
    if ($exitCode -ne 0) {
        Write-Host "FAIL: exit code = $exitCode (esperado 0 mesmo fora de P8)" -ForegroundColor Red
        $failures++
    } elseif ($outputText -notmatch "plugin inativo") {
        Write-Host "FAIL: nao anunciou 'plugin inativo'. Output:" -ForegroundColor Red
        Write-Host $outputText
        $failures++
    } else {
        Write-Host "PASS: plugin desativou fora de P8 corretamente" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Write-Host ""
if ($failures -eq 0) {
    Write-Host "TODOS OS TESTES PASSARAM (session-start.ps1)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$failures teste(s) falharam" -ForegroundColor Red
    exit 1
}
