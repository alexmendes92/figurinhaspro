# scripts/stripe-smoke.ps1
# Plugin P8-MASTER — wrapper para `stripe trigger` + parse webhook log.
#
# Pre-requisitos:
# - Stripe CLI instalado (`stripe --version`)
# - .env.local com STRIPE_SECRET_KEY=sk_test_*** e STRIPE_WEBHOOK_SECRET=whsec_***
# - Dev server rodando em localhost:3009 (`npm run dev`)
#
# Uso:
#   pwsh -File scripts/stripe-smoke.ps1                                    # default: checkout.session.completed
#   pwsh -File scripts/stripe-smoke.ps1 -Event invoice.paid
#   pwsh -File scripts/stripe-smoke.ps1 -Event customer.subscription.updated -Wait 30
#
# Exit codes:
#   0 — webhook processado, Order/Subscription atualizada
#   1 — Stripe CLI ausente ou config invalida
#   2 — webhook nao respondeu 200 dentro do timeout
#   3 — Stripe key e sk_live_ (ABORTA — soh dev)

param(
    [string]$Event = "checkout.session.completed",
    [int]$Wait = 15,
    [string]$ForwardUrl = "http://localhost:3009/api/stripe/webhook"
)

$ErrorActionPreference = "Stop"

# Find raiz P8
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    Write-Host "[stripe-smoke] ERRO: nao estamos em P8-FigurinhasPro" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot

# 1. Pre-checks
Write-Host "[stripe-smoke] Pre-checks..."

$stripeCli = Get-Command stripe -ErrorAction SilentlyContinue
if (-not $stripeCli) {
    Write-Host "[stripe-smoke] ERRO: Stripe CLI nao instalado. Veja https://stripe.com/docs/stripe-cli" -ForegroundColor Red
    exit 1
}
Write-Host "  PASS: Stripe CLI: $($stripeCli.Source)" -ForegroundColor Green

# 2. Verifica chave NAO eh prod
$envFile = Join-Path $projectRoot ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'STRIPE_SECRET_KEY=sk_live_') {
        Write-Host "[stripe-smoke] BLOQUEADO: STRIPE_SECRET_KEY=sk_live_ detectado em .env.local" -ForegroundColor Red
        Write-Host "[stripe-smoke] Esta skill SO funciona em dev. Use sk_test_*** ." -ForegroundColor Red
        exit 3
    }
    Write-Host "  PASS: chave Stripe e dev (sk_test_)" -ForegroundColor Green
}

# 3. Verifica dev server up
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3009" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "  PASS: dev server up em :3009" -ForegroundColor Green
} catch {
    Write-Host "[stripe-smoke] AVISO: dev server pode nao estar rodando em :3009. Continuando..." -ForegroundColor Yellow
}

# 4. Inicia listen em background
Write-Host ""
Write-Host "[stripe-smoke] Iniciando stripe listen em background..."
$listenJob = Start-Job -ScriptBlock {
    param($url)
    & stripe listen --forward-to $url 2>&1
} -ArgumentList $ForwardUrl

Start-Sleep -Seconds 3

# 5. Dispara evento
Write-Host "[stripe-smoke] Disparando evento: $Event"
$triggerOutput = & stripe trigger $Event 2>&1
Write-Host $triggerOutput

# 6. Aguarda + tail logs
Write-Host ""
Write-Host "[stripe-smoke] Aguardando $Wait segundos pra logs..."
Start-Sleep -Seconds $Wait

# 7. Captura output do listen
$listenOutput = Receive-Job $listenJob -Keep
Write-Host ""
Write-Host "[stripe-smoke] Output do listen:" -ForegroundColor Cyan
Write-Host $listenOutput

# 8. Cleanup
Stop-Job $listenJob -ErrorAction SilentlyContinue
Remove-Job $listenJob -ErrorAction SilentlyContinue

# 9. Parse status
$webhook200 = $listenOutput -match "200 OK"
$webhook400 = $listenOutput -match "400|signature"

if ($webhook400) {
    Write-Host ""
    Write-Host "[stripe-smoke] FAIL: webhook respondeu 400 (signature invalida?)" -ForegroundColor Red
    Write-Host "[stripe-smoke] Verifique: webhook handler em src/app/api/stripe/webhook/route.ts usa stripe.webhooks.constructEvent corretamente?" -ForegroundColor Yellow
    exit 2
}

if (-not $webhook200) {
    Write-Host ""
    Write-Host "[stripe-smoke] FAIL: webhook nao respondeu 200 dentro de $Wait segundos" -ForegroundColor Red
    Write-Host "[stripe-smoke] Verifique logs do dev server (Sentry, console)" -ForegroundColor Yellow
    exit 2
}

Write-Host ""
Write-Host "[stripe-smoke] PASS: webhook processou evento $Event com 200 OK" -ForegroundColor Green
Write-Host "[stripe-smoke] Proximos passos:"
Write-Host "  - Verificar Order/Subscription criada/atualizada via Prisma Studio"
Write-Host "  - Confirmar SubscriptionEvent log em DB"
Write-Host "  - Se Sentry ativo: confirmar zero erros capturados"

exit 0
