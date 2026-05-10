# hooks/validate-thoughts.ps1
# Plugin P8-MASTER — hook PreToolUse Write|Edit
#
# Responsabilidade: avisar se o usuario tenta escrever em thoughts/ sem o diretorio existir.
# Nao bloqueia — so avisa. Se thoughts/ ausente, sugere rodar scripts/thoughts-init.ps1.
#
# Saida: 0 sempre (nao bloquear).

$ErrorActionPreference = "SilentlyContinue"

# Le argumentos do hook (file_path passado pelo Claude Code via JSON em stdin)
$inputJson = $input | Out-String
if (-not $inputJson) {
    exit 0
}

try {
    $hookData = $inputJson | ConvertFrom-Json
    $filePath = $hookData.tool_input.file_path
} catch {
    exit 0
}

if (-not $filePath) { exit 0 }

# So validar se path tem 'thoughts/' no meio
if ($filePath -notmatch "thoughts[/\\]") {
    exit 0
}

# Encontrar a raiz do projeto P8
$cwd = (Get-Location).Path
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    exit 0
}

$thoughtsDir = Join-Path $projectRoot "thoughts"

if (-not (Test-Path $thoughtsDir)) {
    Write-Host "[p8-master:validate-thoughts] thoughts/ nao existe em $projectRoot." -ForegroundColor Yellow
    Write-Host "[p8-master:validate-thoughts] Rode: pwsh -File .claude/plugins/p8-master/scripts/thoughts-init.ps1" -ForegroundColor Yellow
    Write-Host "[p8-master:validate-thoughts] Continuando assim mesmo (apenas aviso)." -ForegroundColor Yellow
}

exit 0
