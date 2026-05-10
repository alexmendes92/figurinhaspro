# hooks/stop-lessons-incremental.ps1
# Plugin P8-MASTER — hook Stop.
#
# Append da sessao atual em state/sessions/<YYYY-MM-DD>-<sessionId>.jsonl.
# Consumido depois por /p8-master:lessons-audit pra detectar padroes.
#
# Nao bloqueia (exit 0 sempre). Performance: alvo <100ms.

$ErrorActionPreference = "SilentlyContinue"

$inputJson = $input | Out-String
if (-not $inputJson) { exit 0 }

try {
    $hookData = $inputJson | ConvertFrom-Json
} catch {
    exit 0
}

# Encontra raiz do projeto P8
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

$pluginRoot = Join-Path $projectRoot ".claude\plugins\p8-master"
if (-not (Test-Path $pluginRoot)) { exit 0 }

$sessionsDir = Join-Path $pluginRoot "state\sessions"
if (-not (Test-Path $sessionsDir)) {
    New-Item -ItemType Directory -Force -Path $sessionsDir | Out-Null
}

# Constroi entry minima da sessao
$today = Get-Date -Format "yyyy-MM-dd"
$timestamp = Get-Date -Format "o"
$sessionId = if ($hookData.session_id) { $hookData.session_id } else { "unknown" }
$entry = @{
    timestamp = $timestamp
    session_id = $sessionId
    project = "P8-FigurinhasPro"
    cwd = $cwd
    selfAudit = $false
    metadata = $hookData
} | ConvertTo-Json -Compress -Depth 5

# Append no jsonl do dia
$file = Join-Path $sessionsDir "$today.jsonl"
Add-Content -Path $file -Value $entry -Encoding UTF8

exit 0
