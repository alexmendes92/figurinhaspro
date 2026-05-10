#!/usr/bin/env python3
"""
load-prior-reports.py — lê os relatórios já gerados em output/ e devolve
metadata estruturada (frontmatter + sumário) pra fases dependentes do Oracle.

Roda no Step 0 das fases 2+ (Marketing, Estrutura, Designer, etc).
Evita que cada agent re-leia + re-parseie os relatórios anteriores.

Uso:
    python load-prior-reports.py <path-output-dir> [--output <arquivo.json>]
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
from pathlib import Path
from typing import Any

# Forca stdout/stderr UTF-8 no Windows. Default cp1252 quebra em '->' e outros
# caracteres unicode comuns nos relatorios Oracle (gerados em PT-BR com setas).
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

REPORT_PATTERN = re.compile(r"^(\d{2})-(.+)\.md$")
FRONTMATTER_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_yaml_simple(text: str) -> dict[str, Any]:
    """
    Parser YAML minimalista (sem dependência externa).

    Cobre o subset usado pelos relatórios Oracle:
    - chave: valor
    - chave: "valor entre aspas"
    - chave: [item1, item2]
    - listas em bloco com -

    NÃO cobre nested objects, multiline strings complexas, etc.
    Suficiente pro frontmatter Oracle.
    """
    result: dict[str, Any] = {}
    for line in text.splitlines():
        line = line.rstrip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        if not value:
            result[key] = None
            continue
        if value.startswith('"') and value.endswith('"'):
            result[key] = value[1:-1]
        elif value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            result[key] = [s.strip().strip('"') for s in inner.split(",")] if inner else []
        elif value.lower() in ("true", "false"):
            result[key] = value.lower() == "true"
        elif value.lstrip("-").isdigit():
            result[key] = int(value)
        else:
            result[key] = value
    return result


def extract_first_section(body: str, max_lines: int = 15) -> str:
    """Pega o primeiro parágrafo após o título principal — vira sumário."""
    lines = body.splitlines()
    capture: list[str] = []
    started = False
    for ln in lines:
        if ln.startswith("# "):
            started = True
            continue
        if not started:
            continue
        if ln.startswith("##"):
            break
        capture.append(ln)
        if len(capture) >= max_lines:
            break
    return "\n".join(capture).strip()


def parse_report(path: Path) -> dict[str, Any]:
    """Parseia um relatório individual."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        return {"path": str(path), "error": f"não foi possível ler: {e}"}

    fm_match = FRONTMATTER_PATTERN.match(text)
    if not fm_match:
        return {
            "path": str(path),
            "error": "sem frontmatter YAML",
            "tamanho_chars": len(text),
        }

    frontmatter = parse_yaml_simple(fm_match.group(1))
    body = text[fm_match.end():]

    return {
        "path": str(path),
        "filename": path.name,
        "frontmatter": frontmatter,
        "primeira_secao": extract_first_section(body),
        "tamanho_chars": len(text),
        "tamanho_linhas": text.count("\n") + 1,
        "tem_placeholder_pendente": "_A preencher" in text,
    }


def load_all(output_dir: Path) -> dict[str, Any]:
    if not output_dir.exists():
        return {"error": f"diretório não existe: {output_dir}", "relatorios": []}

    reports = []
    for p in sorted(output_dir.glob("*.md")):
        if not REPORT_PATTERN.match(p.name):
            continue
        reports.append(parse_report(p))

    fases_completas = [r for r in reports if r.get("frontmatter", {}).get("status") == "completo"]
    fases_parciais = [r for r in reports if r.get("frontmatter", {}).get("status") == "parcial"]
    fases_com_pendencia = [r for r in reports if r.get("tem_placeholder_pendente")]

    return {
        "output_dir": str(output_dir.resolve()),
        "total_relatorios": len(reports),
        "fases_completas": len(fases_completas),
        "fases_parciais": len(fases_parciais),
        "fases_com_placeholder_pendente": len(fases_com_pendencia),
        "relatorios": reports,
        "_meta": {"gerado_por": "scripts/load-prior-reports.py"},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Lê relatórios Oracle de output/.")
    parser.add_argument("output_dir", help="Caminho da pasta output/ (ex: <projeto>/output/)")
    parser.add_argument("--output", "-o", help="Arquivo JSON de saída. Se omitido, stdout.")
    args = parser.parse_args()

    data = load_all(Path(args.output_dir))
    payload = json.dumps(data, indent=2, ensure_ascii=False)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(payload, encoding="utf-8")
        print(f"relatórios indexados em: {out_path}")
    else:
        print(payload)

    return 0


if __name__ == "__main__":
    sys.exit(main())
