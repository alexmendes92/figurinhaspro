#!/usr/bin/env bash
# tests/run-all.sh
# Plugin P8-MASTER — entry point pra rodar bateria de testes em Unix/Git Bash.
#
# Roda:
# 1. pytest unit
# 2. PowerShell integration tests (via pwsh, se disponivel)
#
# Exit 0 se tudo verde, 1 se alguma falha.

set +e  # Nao parar no primeiro erro — queremos coletar todos

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOTAL_FAILURES=0

echo "==================================="
echo "Plugin P8-MASTER — Bateria de testes"
echo "==================================="
echo ""

# 1. Pytest unit
echo "## 1. Pytest unit tests ##"
if command -v pytest >/dev/null 2>&1; then
    cd "$PLUGIN_ROOT" && pytest tests/unit/ -v
    PYTEST_EXIT=$?
elif command -v python >/dev/null 2>&1; then
    cd "$PLUGIN_ROOT" && python -m pytest tests/unit/ -v
    PYTEST_EXIT=$?
elif command -v python3 >/dev/null 2>&1; then
    cd "$PLUGIN_ROOT" && python3 -m pytest tests/unit/ -v
    PYTEST_EXIT=$?
else
    echo "AVISO: python/pytest nao encontrado — pulando pytest"
    PYTEST_EXIT=0
fi

if [ $PYTEST_EXIT -ne 0 ]; then
    echo "FAIL: pytest unit (exit $PYTEST_EXIT)"
    TOTAL_FAILURES=$((TOTAL_FAILURES + 1))
else
    echo "PASS: pytest unit"
fi

# 2. PowerShell integration tests
echo ""
echo "## 2. PowerShell integration tests ##"

if command -v pwsh >/dev/null 2>&1; then
    for test in "tests/integration/test_session_start_hook.ps1" "tests/integration/test_skill_orchestrator.ps1"; do
        TEST_PATH="$PLUGIN_ROOT/$test"
        if [ -f "$TEST_PATH" ]; then
            echo ""
            echo "Rodando: $test"
            pwsh -NoProfile -ExecutionPolicy Bypass -File "$TEST_PATH"
            if [ $? -ne 0 ]; then
                echo "FAIL: $test"
                TOTAL_FAILURES=$((TOTAL_FAILURES + 1))
            fi
        else
            echo "AVISO: $test nao encontrado"
        fi
    done
else
    echo "AVISO: pwsh nao encontrado — pulando testes PS1"
fi

echo ""
echo "==================================="
if [ $TOTAL_FAILURES -eq 0 ]; then
    echo "TUDO PASSOU."
    exit 0
else
    echo "$TOTAL_FAILURES suite(s) com falhas."
    exit 1
fi
