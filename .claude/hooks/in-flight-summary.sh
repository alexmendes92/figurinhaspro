#!/usr/bin/env bash
# SessionStart hook — printa resumo de thoughts/IN-FLIGHT.md no boot da sessão.
# Objetivo: cada sessão Claude começa sabendo o que está em voo paralelo
# (planos ativos + arquivos zona-quente com risco de conflito).
#
# Bloqueio? Nunca. Falha silenciosa preserva sessão.
# Usa substrings ASCII para evitar quirks de UTF-8 no awk/grep do Git Bash.

set -u

IFL="thoughts/IN-FLIGHT.md"
[ ! -f "$IFL" ] && exit 0

# Conta linhas "| ativo |" dentro da seção "Planos ativos" (entre 2º H2 e próximo H2)
ATIVOS=$(awk '
  /^## .*Planos ativos/         { in_section=1; next }
  /^## .*Planos em rascunho/    { in_section=0 }
  in_section && /^\| ativo \|/  { count++ }
  END                            { print count+0 }
' "$IFL")

# Conta linhas "| rascunho |" dentro da seção "Planos em rascunho"
RASCUNHOS=$(awk '
  /^## .*Planos em rascunho/      { in_section=1; next }
  /^## .*CONFLITOS/                { in_section=0 }
  in_section && /^\| rascunho \|/  { count++ }
  END                              { print count+0 }
' "$IFL")

# Conta arquivos em conflito (linhas "### `path`") dentro da seção CONFLITOS
CONFLITOS=$(awk '
  /^## .*CONFLITOS/      { in_section=1; next }
  /^## .*Pesquisas/      { in_section=0 }
  in_section && /^### /  { count++ }
  END                     { print count+0 }
' "$IFL")

# Branch atual
BRANCH=$(git branch --show-current 2>/dev/null || echo "?")

echo "[p8-master] IN-FLIGHT: $ATIVOS planos ativos, $RASCUNHOS rascunhos, $CONFLITOS arquivos zona-quente. (branch atual: $BRANCH)"

# Lista até 3 arquivos de conflito principais (extrai só o backtick path)
TOP=$(awk '
  /^## .*CONFLITOS/      { in_section=1; next }
  /^## .*Pesquisas/      { in_section=0 }
  in_section && /^### /  { print }
' "$IFL" | head -3 | sed -E 's/^### //; s/ — .*$//' | tr '\n' ' ')

if [ -n "$TOP" ]; then
  echo "[p8-master] Zona quente (toque com cuidado): $TOP"
fi

echo "[p8-master] Antes de criar pesquisa/plano novo: cat thoughts/IN-FLIGHT.md"
exit 0
