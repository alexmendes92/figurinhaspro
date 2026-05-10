"""Testa scripts/lessons-extract.py"""

import json
import sys
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "lessons-extract.py"


def run_script(*args):
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def make_session(path: Path, events: list, ts_base: datetime):
    """events e lista de dicts {role, content}"""
    lines = []
    for i, ev_input in enumerate(events):
        ts = (ts_base + timedelta(seconds=i * 5)).isoformat()
        ev = {
            "timestamp": ts,
            "message": ev_input,
        }
        lines.append(json.dumps(ev))
    path.write_text("\n".join(lines), encoding="utf-8")


def test_script_exists():
    assert SCRIPT.exists()


def test_help_works():
    rc, out, err = run_script("--help")
    assert rc == 0


def test_no_transcripts(tmp_path):
    rc, out, err = run_script("--transcripts-dir", str(tmp_path))
    data = json.loads(out)
    assert data["sessions_processed"] == 0


def test_extracts_recurring_errors(tmp_path):
    base = datetime.now(timezone.utc) - timedelta(days=2)

    # Erro recorrente: mesma signature em 3 sessoes
    error_event = {
        "role": "user",
        "content": [
            {
                "type": "tool_result",
                "is_error": True,
                "content": "BLOQUEADO: git push --force nao e permitido em P8."
            }
        ]
    }
    for i in range(3):
        make_session(tmp_path / f"s{i}.jsonl", [error_event] * 2, base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path),
                              "--threshold-error-occurrences", "3",
                              "--threshold-error-sessions", "2")
    data = json.loads(out)
    errors = data["categorias"]["a_erros_recorrentes"]
    assert len(errors) >= 1
    assert errors[0]["distinct_sessions"] >= 2


def test_excludes_self_audit_sessions(tmp_path):
    """Sessao com flag selfAudit deve ser excluida."""
    base = datetime.now(timezone.utc) - timedelta(days=2)
    # Sessao 1: marcada como selfAudit (evento mencionando 'lessons-audit')
    make_session(tmp_path / "selfaudit.jsonl", [
        {"role": "user", "content": "rodar /p8-master:lessons-audit"},
        {"role": "user", "content": [
            {"type": "tool_result", "is_error": True, "content": "erro X"}
        ]}
    ], base)

    # Sessao 2: normal com mesmo erro
    make_session(tmp_path / "normal.jsonl", [
        {"role": "user", "content": [
            {"type": "tool_result", "is_error": True, "content": "erro X"}
        ]}
    ], base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path),
                              "--exclude-self-audit",
                              "--threshold-error-occurrences", "1",
                              "--threshold-error-sessions", "1")
    data = json.loads(out)
    assert data["sessions_skipped_self_audit"] >= 1


def test_collects_skill_invocations(tmp_path):
    base = datetime.now(timezone.utc) - timedelta(days=1)
    skill_event = {
        "role": "assistant",
        "content": [
            {
                "type": "tool_use",
                "name": "Skill",
                "input": {"skill": "p8-master:pesquisa", "args": "stripe webhook"}
            }
        ]
    }
    make_session(tmp_path / "s1.jsonl", [skill_event] * 3, base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path))
    data = json.loads(out)
    skills = data["categorias"]["b_skills_invocacoes"]
    assert len(skills) >= 1
    assert skills[0]["skill"] == "p8-master:pesquisa"
    assert skills[0]["invocations"] == 3
