# hooks/user-prompt-detect-repeat.ps1
# Plugin P8-MASTER — hook UserPromptSubmit.
#
# Compara o prompt atual com cache de padroes repetitivos detectados por
# lessons-audit. Se match com pattern conhecido, sugere skill ja existente
# ou propoe novo script (via state/proposed-scripts.json).
#
# Performance: alvo <50ms (lookup em arquivo cache pequeno).
# Nao bloqueia (exit 0 sempre).

$ErrorActionPreference = "SilentlyContinue"

$inputJson = $input | Out-String
if (-not $inputJson) { exit 0 }

try {
    $hookData = $inputJson | ConvertFrom-Json
    $userPrompt = $hookData.prompt
} catch {
    exit 0
}

if (-not $userPrompt) { exit 0 }

# Encontra raiz P8
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
$cacheFile = Join-Path $pluginRoot "state\detected-patterns.json"

if (-not (Test-Path $cacheFile)) {
    # Cache ainda nao existe (Fase 4 inicial — lessons-audit nao rodou ainda)
    exit 0
}

try {
    $cache = Get-Content $cacheFile -Raw | ConvertFrom-Json
} catch {
    exit 0
}

# Heuristica simples: matches por keywords nos triggers conhecidos
$lowerPrompt = $userPrompt.ToLower()
$matched = @()

foreach ($pattern in $cache.patterns) {
    $hits = 0
    foreach ($keyword in $pattern.trigger_keywords) {
        if ($lowerPrompt -match [regex]::Escape($keyword.ToLower())) {
            $hits++
        }
    }
    if ($hits -ge $pattern.min_keyword_hits) {
        $matched += $pattern
    }
}

if ($matched.Count -gt 0) {
    Write-Host "[p8-master:detect-repeat] Detectei padrao repetitivo:" -ForegroundColor Cyan
    foreach ($m in $matched) {
        Write-Host "  - $($m.suggestion)" -ForegroundColor Cyan
        if ($m.suggested_script) {
            Write-Host "    Script proposto: $($m.suggested_script)" -ForegroundColor Cyan
        }
        if ($m.suggested_skill) {
            Write-Host "    Skill existente: /$($m.suggested_skill)" -ForegroundColor Cyan
        }
    }
}

exit 0
