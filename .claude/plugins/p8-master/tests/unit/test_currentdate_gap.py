"""Testa scripts/currentdate-gap.py"""

import json
import sys
import subprocess
import tempfile
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "currentdate-gap.py"


def run_script(*args):
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def test_script_exists():
    assert SCRIPT.exists()


def test_help_works():
    rc, out, err = run_script("--help")
    assert rc == 0


def test_first_run_no_state(tmp_path):
    state_path = tmp_path / "state.json"
    rc, out, err = run_script("--state", str(state_path), "--current-date", "2026-05-10")
    assert rc == 0
    data = json.loads(out)
    assert data["current_date"] == "2026-05-10"
    assert data["stale_count"] == 9  # nenhum dominio checado ainda
    assert "nextjs" in data["domains"]


def test_gap_below_threshold(tmp_path):
    state_path = tmp_path / "state.json"
    state_path.write_text(json.dumps({
        "domains": {
            "nextjs": {"last_checked": "2026-05-08"},
        }
    }), encoding="utf-8")
    rc, out, err = run_script("--state", str(state_path),
                              "--current-date", "2026-05-10",
                              "--threshold-days", "14")
    data = json.loads(out)
    assert data["domains"]["nextjs"]["gap_days"] == 2
    assert data["domains"]["nextjs"]["stale"] is False


def test_gap_above_threshold(tmp_path):
    state_path = tmp_path / "state.json"
    state_path.write_text(json.dumps({
        "domains": {
            "stripe": {"last_checked": "2026-04-01"},
        }
    }), encoding="utf-8")
    rc, out, err = run_script("--state", str(state_path),
                              "--current-date", "2026-05-10",
                              "--threshold-days", "14")
    data = json.loads(out)
    assert data["domains"]["stripe"]["gap_days"] == 39
    assert data["domains"]["stripe"]["stale"] is True
    assert "stripe" in data["stale_list"]


def test_handles_corrupted_state(tmp_path):
    state_path = tmp_path / "state.json"
    state_path.write_text("not valid json", encoding="utf-8")
    rc, out, err = run_script("--state", str(state_path), "--current-date", "2026-05-10")
    # Nao deve crashar — trata como vazio
    assert rc == 0
    data = json.loads(out)
    assert data["stale_count"] == 9


def test_custom_threshold(tmp_path):
    state_path = tmp_path / "state.json"
    state_path.write_text(json.dumps({
        "domains": {
            "react": {"last_checked": "2026-05-05"},
        }
    }), encoding="utf-8")
    # threshold 1 dia: 5 dias eh stale
    rc, out, err = run_script("--state", str(state_path),
                              "--current-date", "2026-05-10",
                              "--threshold-days", "1")
    data = json.loads(out)
    assert data["domains"]["react"]["stale"] is True

    # threshold 30 dias: 5 dias nao eh stale
    rc, out, err = run_script("--state", str(state_path),
                              "--current-date", "2026-05-10",
                              "--threshold-days", "30")
    data = json.loads(out)
    assert data["domains"]["react"]["stale"] is False
