# hooks/session-start.ps1
# Plugin P8-MASTER — hook de SessionStart
#
# Responsabilidades:
# 1. Validar que cwd está dentro de P8-FigurinhasPro (caso contrário, plugin nao deveria estar ativo).
# 2. Carregar referencias rapidas no contexto (glossario, stack-cheatsheet) — sinaliza presenca.
# 3. Disparar verificacao de gap de data (currentdate-gap.py) em background pra disparar stay-current se necessario.
#
# Saida (stdout): mensagem curta resumindo. Stderr: erros.
# Codigo de saida: 0 sempre (nao bloquear sessao).
#
# Performance: alvo <500ms sincrono. Tudo pesado vai pra background.

$ErrorActionPreference = "SilentlyContinue"

# 1. Detectar raiz do projeto P8 a partir de cwd
$cwd = (Get-Location).Path
$marker = "P8-FigurinhasPro"

# Se cwd nao tem o marker no path, nao estamos em P8 — sair silenciosamente
if ($cwd -notmatch [regex]::Escape($marker)) {
    Write-Host "[p8-master] cwd nao e P8-FigurinhasPro — plugin inativo."
    exit 0
}

# Encontrar a raiz do projeto (procurar package.json + CLAUDE.md)
$projectRoot = $cwd
while ($projectRoot -and -not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    $parent = Split-Path $projectRoot -Parent
    if ($parent -eq $projectRoot) { break }
    $projectRoot = $parent
}

if (-not (Test-Path (Join-Path $projectRoot "CLAUDE.md"))) {
    Write-Host "[p8-master] nao encontrei CLAUDE.md em ancestor de cwd. Plugin pode estar mal-instalado."
    exit 0
}

# 2. Caminhos do plugin
$pluginRoot = Join-Path $projectRoot ".claude\plugins\p8-master"
$statePath = Join-Path $pluginRoot "state\last-update.json"
$glossarioPath = Join-Path $pluginRoot "references\p8-glossario.md"

# 3. Mensagem de boot
Write-Host "[p8-master] Plugin ativo em P8-FigurinhasPro."
Write-Host "[p8-master] Pipeline canonico: /p8-master pesquisa -> plano -> valida -> implementa -> commit."
Write-Host "[p8-master] Gates humanos: aprovacao de plano + deploy prod sempre."

# 4. Disparar verificacao de gap de data em background (se script existir)
$gapScript = Join-Path $pluginRoot "scripts\currentdate-gap.py"
if (Test-Path $gapScript) {
    # Roda em background, nao bloqueia
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonExe) {
        Start-Process -FilePath $pythonExe.Source -ArgumentList "`"$gapScript`"", "--state", "`"$statePath`"" -NoNewWindow -RedirectStandardOutput "$pluginRoot\state\last-gap-check.log" -ErrorAction SilentlyContinue
        Write-Host "[p8-master] currentdate-gap.py disparado em background."
    } else {
        Write-Host "[p8-master] python nao encontrado — pulando currentdate-gap."
    }
} else {
    # Fase 1: script ainda nao existe (sera criado na Fase 4)
    Write-Host "[p8-master] currentdate-gap.py ainda nao instalado (Fase 4 do build)."
}

# 5. Sinalizar referencia disponivel
if (Test-Path $glossarioPath) {
    Write-Host "[p8-master] references/p8-glossario.md disponivel — consulte antes de afirmar termos do dominio."
}

# 6. Lembretes do dia (Akita-style)
Write-Host "[p8-master] Lembretes:"
Write-Host "  - Tarefa nao-trivial = /p8-master pesquisa + plano antes de codar."
Write-Host "  - Gate pre-commit roda automatico: npm run test -> tsc --noEmit -> npm run build."
Write-Host "  - Deploy prod = npx vercel deploy --prod (com aprovacao humana)."

exit 0
