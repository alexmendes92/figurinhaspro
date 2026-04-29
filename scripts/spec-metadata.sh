#!/usr/bin/env bash
# scripts/spec-metadata.sh
# Coleta metadata do repositório atual e devolve JSON.
# Output: { "data": "YYYY-MM-DD", "commit_sha": "...", "branch": "...", "autor": "...", "repo_url": "..." }
# Usado por slash commands ACE pra embed no frontmatter de artefatos.
set -euo pipefail

# Roda a partir do cwd — assume cwd é repo git
data=$(date -u +%Y-%m-%d)
commit_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
branch=$(git branch --show-current 2>/dev/null || echo "no-git")
autor=$(git config user.email 2>/dev/null || echo "unknown")
repo_url=$(git config --get remote.origin.url 2>/dev/null || echo "")

# Output JSON via jq pra escapar corretamente
jq -n \
  --arg data "$data" \
  --arg commit_sha "$commit_sha" \
  --arg branch "$branch" \
  --arg autor "$autor" \
  --arg repo_url "$repo_url" \
  '{data: $data, commit_sha: $commit_sha, branch: $branch, autor: $autor, repo_url: $repo_url}'
