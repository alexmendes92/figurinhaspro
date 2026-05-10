"""Testa scripts/detect-repeat-tools.py"""

import json
import sys
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "detect-repeat-tools.py"


def run_script(*args):
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def make_session_jsonl(path: Path, tool_calls: list, ts_base: datetime):
    """Cria jsonl fake com sequência de tool calls."""
    lines = []
    for i, (name, inp) in enumerate(tool_calls):
        ts = (ts_base + timedelta(seconds=i * 5)).isoformat()
        ev = {
            "timestamp": ts,
            "message": {
                "role": "assistant",
                "content": [
                    {"type": "tool_use", "name": name, "input": inp}
                ]
            }
        }
        lines.append(json.dumps(ev))
    path.write_text("\n".join(lines), encoding="utf-8")


def test_script_exists():
    assert SCRIPT.exists()


def test_no_transcripts(tmp_path):
    rc, out, err = run_script("--transcripts-dir", str(tmp_path))
    assert rc == 0
    data = json.loads(out)
    assert data.get("error") or data["candidates_count"] == 0


def test_below_threshold(tmp_path):
    """Sequencia que aparece menos que threshold nao deve virar candidata."""
    base = datetime.now(timezone.utc) - timedelta(days=2)
    seq = [("Bash", {"command": "git status"}),
           ("Bash", {"command": "git diff"}),
           ("Read", {"file_path": "src/lib/auth.ts"})]
    # 2 sessoes, 1 ocorrencia cada (abaixo do threshold padrao 5x3)
    make_session_jsonl(tmp_path / "session1.jsonl", seq, base)
    make_session_jsonl(tmp_path / "session2.jsonl", seq, base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path))
    data = json.loads(out)
    # Threshold default 5 ocorrencias, 3 sessoes — 2x1 nao bate
    assert data["candidates_count"] == 0


def test_above_threshold(tmp_path):
    """Sequencia que aparece >= 5x em >= 3 sessoes vira candidata."""
    base = datetime.now(timezone.utc) - timedelta(days=2)
    seq = [("Bash", {"command": "stripe trigger checkout.session.completed"}),
           ("Bash", {"command": "stripe logs tail"}),
           ("Read", {"file_path": "src/app/api/stripe/webhook/route.ts"})]

    # 4 sessoes, cada uma com a mesma sequencia repetida 2x = 8 ocorrencias total
    for i in range(4):
        long_seq = seq + seq  # repete dentro da mesma sessao
        make_session_jsonl(tmp_path / f"session{i}.jsonl", long_seq, base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path),
                              "--threshold-occurrences", "5",
                              "--threshold-sessions", "3")
    data = json.loads(out)
    assert data["candidates_count"] >= 1
    # Top candidate deve ter a sequencia stripe
    top = data["candidates"][0]
    assert top["distinct_sessions"] >= 3
    assert top["occurrences"] >= 5


def test_window_filter(tmp_path):
    """Sessoes fora da janela devem ser filtradas."""
    old_base = datetime.now(timezone.utc) - timedelta(days=60)
    seq = [("Bash", {"command": "git status"}),
           ("Read", {"file_path": "x.ts"}),
           ("Edit", {"file_path": "x.ts"})]
    for i in range(5):
        make_session_jsonl(tmp_path / f"old{i}.jsonl", seq * 2, old_base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path),
                              "--days", "30",
                              "--threshold-occurrences", "5",
                              "--threshold-sessions", "3")
    data = json.loads(out)
    # Janela 30d, sessoes 60d antes sao ignoradas
    assert data["transcripts_in_window"] == 0


def test_normalizes_worktree_paths(tmp_path):
    """Paths /worktrees/<hash>/ devem ser normalizados pra evitar over-discrimination."""
    base = datetime.now(timezone.utc) - timedelta(days=1)
    seq_a = [("Read", {"file_path": "/c/wt/worktrees/abc123/src/lib/auth.ts"}),
             ("Edit", {"file_path": "/c/wt/worktrees/abc123/src/lib/auth.ts"}),
             ("Bash", {"command": "git status"})]
    seq_b = [("Read", {"file_path": "/c/wt/worktrees/xyz789/src/lib/auth.ts"}),
             ("Edit", {"file_path": "/c/wt/worktrees/xyz789/src/lib/auth.ts"}),
             ("Bash", {"command": "git status"})]
    # 5 ocorrencias em 5 sessoes — 3 com worktree A, 2 com worktree B
    for i in range(3):
        make_session_jsonl(tmp_path / f"a{i}.jsonl", seq_a, base)
    for i in range(2):
        make_session_jsonl(tmp_path / f"b{i}.jsonl", seq_b, base)

    rc, out, err = run_script("--transcripts-dir", str(tmp_path))
    data = json.loads(out)
    # Como paths sao normalizados, as duas worktrees viram a mesma sequencia
    assert data["candidates_count"] >= 1
