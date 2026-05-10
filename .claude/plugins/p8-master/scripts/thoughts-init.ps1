# scripts/thoughts-init.ps1
# Plugin P8-MASTER — bootstrap do diretorio thoughts/ no projeto P8-FigurinhasPro.
#
# Idempotente: nao sobrescreve arquivos existentes (a menos que --force).
# Cria pastas pesquisas/, planos/, valida coisas, decisoes/, handoffs/, auto-melhoria/, atualizacoes/, shared/.
# Copia README + glossario inicial dos templates do plugin.

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Encontra raiz do projeto P8 (CLAUDE.md como ancora)
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    Write-Error "[thoughts-init] nao encontrei CLAUDE.md — rode dentro do projeto P8-FigurinhasPro."
    exit 1
}

$thoughtsDir = Join-Path $projectRoot "thoughts"
$pluginRoot = Join-Path $projectRoot ".claude\plugins\p8-master"
$templatesDir = Join-Path $pluginRoot "templates"

Write-Host "[thoughts-init] Raiz do projeto: $projectRoot"
Write-Host "[thoughts-init] Bootstrapping $thoughtsDir"

# 1. Criar pastas
$subdirs = @("pesquisas", "planos", "valida-coisas", "revisoes", "decisoes", "handoffs", "auto-melhoria", "atualizacoes", "shared")
foreach ($sub in $subdirs) {
    $path = Join-Path $thoughtsDir $sub
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        # .gitkeep para versionar pasta vazia
        New-Item -ItemType File -Force -Path (Join-Path $path ".gitkeep") | Out-Null
        Write-Host "  + criado: thoughts/$sub/"
    } else {
        Write-Host "  = existente: thoughts/$sub/"
    }
}

# 2. Copiar README do thoughts (se nao existe)
$readmePath = Join-Path $thoughtsDir "README.md"
$readmeTemplate = Join-Path $templatesDir "thoughts-readme.md"
if (-not (Test-Path $readmePath) -or $Force) {
    if (Test-Path $readmeTemplate) {
        Copy-Item -Path $readmeTemplate -Destination $readmePath -Force
        Write-Host "  + criado: thoughts/README.md"
    }
} else {
    Write-Host "  = existente: thoughts/README.md (use -Force para sobrescrever)"
}

# 3. Copiar glossario inicial
$glossarioPath = Join-Path $thoughtsDir "shared\glossario.md"
$glossarioTemplate = Join-Path $templatesDir "thoughts-glossario.md"
if (-not (Test-Path $glossarioPath) -or $Force) {
    if (Test-Path $glossarioTemplate) {
        Copy-Item -Path $glossarioTemplate -Destination $glossarioPath -Force
        Write-Host "  + criado: thoughts/shared/glossario.md"
    }
} else {
    Write-Host "  = existente: thoughts/shared/glossario.md (use -Force para sobrescrever)"
}

Write-Host ""
Write-Host "[thoughts-init] Pronto. Estrutura:"
Get-ChildItem -Path $thoughtsDir -Directory | ForEach-Object { Write-Host "  $($_.Name)/" }
Write-Host ""
Write-Host "[thoughts-init] Proximo passo: rodar /p8-master:pesquisa <topico> para gerar primeiro artefato."
