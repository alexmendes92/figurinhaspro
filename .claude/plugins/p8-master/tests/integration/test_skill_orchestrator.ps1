# tests/integration/test_skill_orchestrator.ps1
# Plugin P8-MASTER — verifica que SKILL.md da skill orquestradora e dos sub-skills existem e tem frontmatter valido.
#
# Casos:
# 1. skill orquestradora p8-master/SKILL.md existe e tem 'name: p8-master'
# 2. todas as 5 SMA core (pesquisa, plano, valida, implementa, itera) existem
# 3. todas as 4 SMA utilities (commit, pr, handoff, hurdle) existem (Fase 2)
# 4. todos os 3 sub-agents (explorador, historiador, revisor) existem
#
# Exit 0 se OK, 1 se falha.

$ErrorActionPreference = "Stop"

$PluginRoot = Resolve-Path (Join-Path $PSScriptRoot ".." "..")
$failures = 0

function Test-FrontmatterField {
    param(
        [string]$FilePath,
        [string]$Field,
        [string]$ExpectedValueRegex
    )
    if (-not (Test-Path $FilePath)) {
        Write-Host "FAIL: arquivo nao existe: $FilePath" -ForegroundColor Red
        return $false
    }
    $content = Get-Content $FilePath -Raw
    if ($content -notmatch "(?m)^${Field}:\s*$ExpectedValueRegex") {
        Write-Host "FAIL: campo '$Field' invalido em $FilePath" -ForegroundColor Red
        return $false
    }
    return $true
}

# Teste 1: skill orquestradora
Write-Host "=== Teste 1: skill orquestradora p8-master ==="
$orchPath = Join-Path $PluginRoot "skills/p8-master/SKILL.md"
if (Test-FrontmatterField -FilePath $orchPath -Field "name" -ExpectedValueRegex "p8-master") {
    Write-Host "PASS: orquestradora p8-master/SKILL.md OK" -ForegroundColor Green
} else {
    $failures++
}

# Teste 2: SMA core (5)
Write-Host ""
Write-Host "=== Teste 2: 5 SMA core skills ==="
foreach ($skill in @("pesquisa", "plano", "valida", "implementa", "itera")) {
    $path = Join-Path $PluginRoot "skills/$skill/SKILL.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex "p8-master:$skill") {
        Write-Host "  PASS: $skill" -ForegroundColor Green
    } else {
        $failures++
    }
}

# Teste 3: SMA utilities (4) — Fase 2
Write-Host ""
Write-Host "=== Teste 3: 4 SMA utilities ==="
foreach ($skill in @("commit", "pr", "handoff", "hurdle")) {
    $path = Join-Path $PluginRoot "skills/$skill/SKILL.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex "p8-master:$skill") {
        Write-Host "  PASS: $skill" -ForegroundColor Green
    } else {
        $failures++
    }
}

# Teste 4: 9 sub-agents (3 SMA + 6 Oracle)
Write-Host ""
Write-Host "=== Teste 4a: 3 sub-agents SMA ==="
foreach ($agent in @("explorador", "historiador", "revisor")) {
    $path = Join-Path $PluginRoot "agents/$agent.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex $agent) {
        if (Test-FrontmatterField -FilePath $path -Field "model" -ExpectedValueRegex "sonnet") {
            Write-Host "  PASS: $agent (model=sonnet)" -ForegroundColor Green
        } else {
            $failures++
        }
    } else {
        $failures++
    }
}

Write-Host ""
Write-Host "=== Teste 4b: 6 sub-agents Oracle (modelos variados) ==="
$oracleAgents = @{
    "extrator" = "haiku"
    "analista-gerador" = "sonnet"
    "pesquisador" = "sonnet"
    "critico-adversarial" = "opus"
    "arquiteto-estrategico" = "opus"
    "qa-estrutural" = "haiku"
}
foreach ($agent in $oracleAgents.Keys) {
    $path = Join-Path $PluginRoot "agents/$agent.md"
    $expectedModel = $oracleAgents[$agent]
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex $agent) {
        if (Test-FrontmatterField -FilePath $path -Field "model" -ExpectedValueRegex $expectedModel) {
            Write-Host "  PASS: $agent (model=$expectedModel)" -ForegroundColor Green
        } else {
            Write-Host "FAIL: $agent — modelo esperado: $expectedModel" -ForegroundColor Red
            $failures++
        }
    } else {
        $failures++
    }
}

Write-Host ""
Write-Host "=== Teste 4c: 2 Oracle wrapper skills ==="
foreach ($skill in @("oracle-analise", "oracle-reportar")) {
    $path = Join-Path $PluginRoot "skills/$skill/SKILL.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex "p8-master:$skill") {
        Write-Host "  PASS: $skill" -ForegroundColor Green
    } else {
        $failures++
    }
}

Write-Host ""
Write-Host "=== Teste 4d: 4 self-improvement skills (Fase 4) ==="
foreach ($skill in @("lessons-audit", "skill-creator", "stay-current", "update-claude-docs")) {
    $path = Join-Path $PluginRoot "skills/$skill/SKILL.md"
    if (Test-FrontmatterField -FilePath $path -Field "name" -ExpectedValueRegex "p8-master:$skill") {
        Write-Host "  PASS: $skill" -ForegroundColor Green
    } else {
        $failures++
    }
}

# Teste 5: hooks core (Fase 1+2)
Write-Host ""
Write-Host "=== Teste 5: hooks PowerShell ==="
foreach ($hook in @(
    "session-start.ps1", "validate-thoughts.ps1",
    "precommit-router.ps1", "pretooluse-deny-secrets.ps1",
    "stop-lessons-incremental.ps1", "user-prompt-detect-repeat.ps1"
)) {
    $path = Join-Path $PluginRoot "hooks/$hook"
    if (Test-Path $path) {
        Write-Host "  PASS: $hook existe" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $hook nao encontrado em $path" -ForegroundColor Red
        $failures++
    }
}

# Teste 6: scripts core (Fase 1+2+3)
Write-Host ""
Write-Host "=== Teste 6: scripts core ==="
foreach ($script in @(
    "thoughts-init.ps1", "spec-metadata.ps1",
    "validate-frontmatter.py", "inventory.py",
    "grep-evidence.py", "load-prior-reports.py",
    "currentdate-gap.py", "detect-repeat-tools.py", "lessons-extract.py"
)) {
    $path = Join-Path $PluginRoot "scripts/$script"
    if (Test-Path $path) {
        Write-Host "  PASS: $script existe" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $script nao encontrado" -ForegroundColor Red
        $failures++
    }
}

Write-Host ""
Write-Host "=== Teste 7: references + state ==="
foreach ($ref in @(
    "references/p8-glossario.md", "references/stack-cheatsheet.md",
    "references/workflow-sma.md", "references/workflow-akita-bootstrap.md",
    "references/canonical-sources.md", "state/last-update.json"
)) {
    $path = Join-Path $PluginRoot $ref
    if (Test-Path $path) {
        Write-Host "  PASS: $ref existe" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $ref nao encontrado" -ForegroundColor Red
        $failures++
    }
}

Write-Host ""
if ($failures -eq 0) {
    Write-Host "TODOS OS TESTES PASSARAM (skill_orchestrator)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$failures teste(s) falharam" -ForegroundColor Red
    exit 1
}
