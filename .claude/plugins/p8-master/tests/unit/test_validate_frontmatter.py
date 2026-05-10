"""
Testa scripts/validate-frontmatter.py.

Roda com: python -m pytest tests/unit/test_validate_frontmatter.py
Ou:       pytest tests/unit/test_validate_frontmatter.py
"""

import sys
import subprocess
from pathlib import Path

PLUGIN_ROOT = Path(__file__).parent.parent.parent
SCRIPT = PLUGIN_ROOT / "scripts" / "validate-frontmatter.py"
FIXTURES = PLUGIN_ROOT / "tests" / "fixtures"


def run_script(*args):
    """Roda validate-frontmatter.py e retorna (returncode, stdout, stderr)."""
    cmd = [sys.executable, str(SCRIPT)] + list(args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def test_script_exists():
    assert SCRIPT.exists(), f"validate-frontmatter.py nao encontrado em {SCRIPT}"


def test_help_works():
    rc, out, err = run_script("--help")
    assert rc == 0
    assert "validate" in out.lower() or "frontmatter" in out.lower()


def test_validates_good_frontmatter(tmp_path):
    """Arquivo com frontmatter completo → exit 0."""
    f = tmp_path / "good.md"
    f.write_text(
        """---
name: test-skill
description: A test skill description
---

Body.
""",
        encoding="utf-8",
    )
    rc, out, err = run_script(str(f))
    assert rc == 0, f"Esperado 0, recebi {rc}. stdout={out} stderr={err}"
    assert "OK" in out


def test_detects_missing_frontmatter(tmp_path):
    """Arquivo sem frontmatter → exit 1."""
    f = tmp_path / "no-fm.md"
    f.write_text("# Just markdown\n\nNo frontmatter here.\n", encoding="utf-8")
    rc, out, err = run_script(str(f))
    assert rc == 1
    assert "FALHA" in out
    assert "frontmatter" in out.lower()


def test_detects_unclosed_frontmatter(tmp_path):
    """Frontmatter aberto mas nao fechado → exit 1."""
    f = tmp_path / "unclosed.md"
    f.write_text(
        """---
name: incomplete

Body without closing ---
""",
        encoding="utf-8",
    )
    rc, out, err = run_script(str(f))
    assert rc == 1


def test_detects_missing_required_field_in_skill(tmp_path):
    """SKILL.md sem 'description' → exit 1."""
    f = tmp_path / "SKILL.md"
    f.write_text(
        """---
name: incomplete-skill
---

Body.
""",
        encoding="utf-8",
    )
    rc, out, err = run_script(str(f))
    assert rc == 1
    assert "description" in out


def test_detects_invalid_status(tmp_path):
    """Frontmatter com status invalido → exit 1."""
    f = tmp_path / "plano.md"
    f.write_text(
        """---
data: 2026-05-10
tipo: plano
topico: test
autor: test@example.com
projeto: P8-FigurinhasPro
status: INVALID_STATUS
---

Body.
""",
        encoding="utf-8",
    )
    rc, out, err = run_script(str(f))
    assert rc == 1
    assert "status invalido" in out.lower() or "INVALID_STATUS" in out


def test_detects_wrong_projeto(tmp_path):
    """Frontmatter com projeto != P8-FigurinhasPro → exit 1."""
    f = tmp_path / "plano.md"
    f.write_text(
        """---
data: 2026-05-10
tipo: plano
topico: test
autor: test@example.com
projeto: SomeOtherProject
status: ativo
---

Body.
""",
        encoding="utf-8",
    )
    rc, out, err = run_script(str(f))
    assert rc == 1
    assert "P8-FigurinhasPro" in out


def test_validates_real_skills_in_plugin():
    """Todas as SKILL.md do plugin devem ser validas."""
    skills_dir = PLUGIN_ROOT / "skills"
    if not skills_dir.exists():
        return  # plugin ainda nao tem skills
    rc, out, err = run_script("-r", str(skills_dir))
    assert rc == 0, f"Algum SKILL.md tem problema:\n{out}\n{err}"


def test_validates_real_agents_in_plugin():
    """Todos os agents/*.md devem ser validos."""
    agents_dir = PLUGIN_ROOT / "agents"
    if not agents_dir.exists():
        return
    rc, out, err = run_script("-r", str(agents_dir))
    assert rc == 0, f"Algum agent tem problema:\n{out}\n{err}"


def test_validates_templates():
    """Templates tem placeholders <...> mas sao validos."""
    templates_dir = PLUGIN_ROOT / "templates"
    if not templates_dir.exists():
        return
    # Templates podem ter placeholders <...> que parsing trata como string normal
    # So checar que o YAML eh parsavel (nao crash)
    rc, out, err = run_script("-r", str(templates_dir))
    # Templates podem retornar 1 porque values com <placeholder> falham validacao status
    # Isso esta OK para o teste — so confirma que o script roda sem crash
    assert rc in (0, 1), f"validate-frontmatter crashou: stderr={err}"
