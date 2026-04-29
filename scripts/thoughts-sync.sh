#!/usr/bin/env bash
# scripts/thoughts-sync.sh
# Sincroniza thoughts/ com upstream quando configurado como git submodule.
# Uso: bash thoughts-sync.sh [--target /path] [--push]
set -euo pipefail

TARGET="."
PUSH=0

while [ $# -gt 0 ]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --push)
      PUSH=1
      shift
      ;;
    -h|--help)
      cat <<EOF
Uso: thoughts-sync.sh [--target /path] [--push]

Sincroniza thoughts/ com upstream se configurado como git submodule.
Sem submodule, mostra aviso e sai 0.

Argumentos:
  --target /path    Projeto-alvo (default: cwd)
  --push            Push commits locais de thoughts/ pro upstream
  -h, --help        Mostra essa mensagem
EOF
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      exit 1
      ;;
  esac
done

TARGET="$(cd "$TARGET" 2>/dev/null && pwd || echo "$TARGET")"

if [ ! -d "$TARGET/thoughts" ]; then
  echo "ERRO: '$TARGET/thoughts' não existe. Rode 'thoughts-init.sh' primeiro." >&2
  exit 1
fi

cd "$TARGET"

# Detectar se thoughts/ é submodule
if [ ! -f .gitmodules ] || ! grep -q "path = thoughts" .gitmodules 2>/dev/null; then
  echo "Aviso: thoughts/ não é git submodule neste projeto." >&2
  echo "Sync via submodule não aplica. thoughts/ é versionado com o código." >&2
  echo "Pra setup como submodule: configure git submodule manualmente (Manual 6 arquivado em manuais/_arquivado/06-manual-para-equipes.md tem detalhes históricos)." >&2
  exit 0
fi

echo "Sync thoughts/ submodule..."

# Pull mais recente do upstream
git submodule update --remote --merge thoughts

if [ "$PUSH" = 1 ]; then
  echo ""
  echo "Pushing commits locais de thoughts/ pro upstream..."
  cd thoughts
  current_branch=$(git branch --show-current)
  if [ -z "$current_branch" ]; then
    echo "ERRO: thoughts/ está em detached HEAD. Faça 'git checkout main' (ou branch desejado) primeiro." >&2
    exit 1
  fi
  git push origin "$current_branch"
  cd ..
fi

# Atualizar referência no parent repo
git add thoughts
if ! git diff --staged --quiet; then
  echo ""
  echo "Submodule referência atualizada. Considere commitar o parent:"
  echo "  git commit -m \"Update thoughts/ submodule reference\""
fi

echo ""
echo "Sync completo."
