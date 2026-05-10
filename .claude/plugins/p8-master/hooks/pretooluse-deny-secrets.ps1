# hooks/pretooluse-deny-secrets.ps1
# Plugin P8-MASTER — hook PreToolUse Read|Bash.
#
# Defesa em profundidade contra leitura/exposicao de secrets.
# Coexiste com permissions.json deny — esta e a segunda camada (defesa em profundidade).
#
# Bloqueia:
# - Read em .env, .env.*, **/secrets/**, ~/.ssh/**, ~/.aws/**, ~/.gnupg/**
# - Bash com `cat .env*`, `echo $TOKEN`, `printenv | grep KEY`, etc.
# - Bash que ecoa secrets para stdout/stderr (TOKEN, SECRET, KEY, PASSWORD em var name)
#
# Saida: 0 (continua), 2 (bloqueia tool call).

$ErrorActionPreference = "SilentlyContinue"

$inputJson = $input | Out-String
if (-not $inputJson) { exit 0 }

try {
    $hookData = $inputJson | ConvertFrom-Json
    $toolName = $hookData.tool_name
    $toolInput = $hookData.tool_input
} catch {
    exit 0
}

# Lista de paths sensiveis (regex)
$sensitivePaths = @(
    "(^|[/\\])\.env(\.|$)",
    "(^|[/\\])\.env\.local",
    "(^|[/\\])\.env\.production",
    "[/\\]secrets[/\\]",
    "[/\\]\.ssh[/\\]",
    "[/\\]\.aws[/\\]",
    "[/\\]\.gnupg[/\\]",
    "id_rsa",
    "credentials\.json",
    "master\.key"
)

# 1. Bloquear Read em path sensivel
if ($toolName -eq "Read") {
    $filePath = $toolInput.file_path
    if ($filePath) {
        foreach ($pattern in $sensitivePaths) {
            if ($filePath -match $pattern) {
                Write-Host "[p8-master:deny-secrets] BLOQUEADO: Read em path sensivel: $filePath" -ForegroundColor Red
                Write-Host "[p8-master:deny-secrets] Plugin nao permite leitura de secrets/.env/credentials." -ForegroundColor Red
                exit 2
            }
        }
    }
}

# 2. Bloquear Bash que tenta ler/ecoar secrets
if ($toolName -eq "Bash") {
    $cmd = $toolInput.command
    if ($cmd) {
        # Comandos perigosos que tipicamente expoem secrets
        $dangerousCmds = @(
            "cat\s+\.env",
            "cat\s+.*\.env\.",
            "type\s+\.env",
            "grep\s+.*\.env",
            "less\s+\.env",
            "more\s+\.env",
            "head\s+\.env",
            "tail\s+\.env",
            "echo\s+\`$.*(?:TOKEN|SECRET|KEY|PASSWORD|API_KEY|DSN|SESSION_PASSWORD|STRIPE_SECRET)",
            "printenv\s*\|.*(?:TOKEN|SECRET|KEY|PASSWORD)",
            "env\s*\|.*(?:TOKEN|SECRET|KEY|PASSWORD)",
            "set\s*\|.*(?:TOKEN|SECRET|KEY|PASSWORD)"
        )

        foreach ($pattern in $dangerousCmds) {
            if ($cmd -match $pattern) {
                Write-Host "[p8-master:deny-secrets] BLOQUEADO: comando expoe secrets: $cmd" -ForegroundColor Red
                Write-Host "[p8-master:deny-secrets] Use src/lib/env.ts (Zod schema) pra validar env sem ecoar." -ForegroundColor Red
                exit 2
            }
        }

        # Bloquear leitura direta de paths sensiveis via Bash
        foreach ($pattern in $sensitivePaths) {
            if ($cmd -match $pattern) {
                # Evitar falso-positivo: comando que SO referencia o path em arg posicional sensitivo
                # (ex: ls .env.example pode ser legitimo)
                if ($cmd -match "(cat|less|more|head|tail|type|less)\s+.*$pattern") {
                    Write-Host "[p8-master:deny-secrets] BLOQUEADO: Bash leitura de path sensivel: $cmd" -ForegroundColor Red
                    exit 2
                }
            }
        }
    }
}

exit 0
