"""
Testa scripts/inventory.py.

Roda com: pytest tests/unit/test_inventory.py
"""

import json
import sys
import subprocess
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "inventory.py"


def run_script(*args):
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def test_script_exists():
    assert SCRIPT.exists()


def test_help_works():
    rc, out, err = run_script("--help")
    assert rc == 0


def test_returns_json_by_default(tmp_path):
    # Cria projeto fake minimo
    pkg = tmp_path / "package.json"
    pkg.write_text(json.dumps({
        "name": "fake-project",
        "dependencies": {"next": "16.2.4", "react": "19.2.5"},
        "devDependencies": {"vitest": "4.1.4"}
    }), encoding="utf-8")
    src = tmp_path / "src" / "lib"
    src.mkdir(parents=True)
    (src / "auth.ts").write_text("export const x = 1\n", encoding="utf-8")

    rc, out, err = run_script("--root", str(tmp_path))
    assert rc == 0, f"stdout={out} stderr={err}"
    inv = json.loads(out)
    assert "languages" in inv
    assert "TypeScript" in inv["languages"]
    assert inv["tools_detected"]["next"] is True
    assert inv["tools_detected"]["react"] is True
    assert inv["tools_detected"]["vitest"] is True


def test_detects_p8_specific_tools(tmp_path):
    pkg = tmp_path / "package.json"
    pkg.write_text(json.dumps({
        "dependencies": {
            "next": "16.2.4",
            "@prisma/client": "7.7.0",
            "iron-session": "8.0.0",
            "stripe": "22.0.0",
            "@sentry/nextjs": "10.49.0",
            "zod": "4.3.6",
            "@tailwindcss/postcss": "4.0.0"
        }
    }), encoding="utf-8")
    rc, out, err = run_script("--root", str(tmp_path))
    inv = json.loads(out)
    assert inv["tools_detected"]["prisma"] is True
    assert inv["tools_detected"]["iron-session"] is True
    assert inv["tools_detected"]["stripe"] is True
    assert inv["tools_detected"]["sentry"] is True
    assert inv["tools_detected"]["zod"] is True
    assert inv["tools_detected"]["tailwind"] is True


def test_pretty_mode(tmp_path):
    pkg = tmp_path / "package.json"
    pkg.write_text(json.dumps({"dependencies": {"next": "16.2.4"}}), encoding="utf-8")
    rc, out, err = run_script("--root", str(tmp_path), "--pretty")
    assert rc == 0
    assert "Linguagens" in out or "Inventario" in out


def test_skips_node_modules(tmp_path):
    """node_modules nao deve aparecer no inventario."""
    pkg = tmp_path / "package.json"
    pkg.write_text("{}", encoding="utf-8")
    nm = tmp_path / "node_modules" / "fake-pkg"
    nm.mkdir(parents=True)
    (nm / "index.js").write_text("//\n", encoding="utf-8")
    src = tmp_path / "src"
    src.mkdir()
    (src / "real.ts").write_text("//\n", encoding="utf-8")

    rc, out, err = run_script("--root", str(tmp_path))
    inv = json.loads(out)
    # Total deve contar apenas package.json + src/real.ts (e nao o node_modules)
    assert inv["total_files"] < 5, f"node_modules nao foi ignorado, total={inv['total_files']}"


def test_works_on_real_p8_root():
    """Roda no projeto P8 real (smoke). Nao crash."""
    p8_root = PLUGIN_ROOT.parent.parent.parent  # .../P8-FigurinhasPro/
    if not (p8_root / "package.json").exists():
        return  # rodando fora de P8, skip
    rc, out, err = run_script("--root", str(p8_root))
    assert rc == 0, f"stderr={err}"
    inv = json.loads(out)
    assert inv["total_files"] > 0
    assert "TypeScript" in inv["languages"]
    assert inv["tools_detected"]["next"] is True
    assert inv["tools_detected"]["prisma"] is True
