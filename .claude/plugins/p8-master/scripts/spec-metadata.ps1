# scripts/spec-metadata.ps1
# Plugin P8-MASTER — coleta metadata pra frontmatter de artefatos thoughts/.
#
# Output: JSON em stdout com SHA, branch, data ISO, autor, repo URL.
# Usado por /p8-master:pesquisa, /p8-master:plano, /p8-master:handoff.

$ErrorActionPreference = "SilentlyContinue"

$sha = (git rev-parse --short HEAD 2>$null)
$branch = (git branch --show-current 2>$null)
$repoUrl = (git config --get remote.origin.url 2>$null)
$author = (git config --get user.email 2>$null)
$date = Get-Date -Format "yyyy-MM-dd"
$dateTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"

$metadata = @{
    sha = if ($sha) { $sha } else { "no-git" }
    branch = if ($branch) { $branch } else { "no-branch" }
    repo = if ($repoUrl) { $repoUrl } else { "no-remote" }
    autor = if ($author) { $author } else { "unknown" }
    data = $date
    timestamp = $dateTime
    projeto = "P8-FigurinhasPro"
}

$metadata | ConvertTo-Json
