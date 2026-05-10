#!/usr/bin/env python3
"""
grep-evidence.py — wrapper sobre ripgrep que retorna contagem + samples.

Pensado pro extrator e pro crítico-adversarial: em vez de fazer 5 calls
Grep separadas pra confirmar evidência, esse script devolve count total +
3 samples (file:line:trecho) numa chamada.

Uso:
    python grep-evidence.py <pattern> <path> [--max-samples 3] [--glob "*.ts"]

Exige `rg` no PATH. Falha graciosamente se não tiver.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys


def run_rg(pattern: str, path: str, glob: str | None = None) -> list[str]:
    """Roda ripgrep e devolve linhas brutas no formato file:line:content."""
    if not shutil.which("rg"):
        raise RuntimeError("ripgrep (rg) não está instalado ou não está no PATH")

    cmd = ["rg", "--no-heading", "-n", "-i", pattern, path]
    if glob:
        cmd += ["--glob", glob]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30, check=False)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"ripgrep timeout (>30s) em path: {path}")

    # rg retorna 1 quando não há match — não é erro real
    if proc.returncode > 1:
        raise RuntimeError(f"ripgrep falhou: {proc.stderr.strip()}")

    return [ln for ln in proc.stdout.splitlines() if ln.strip()]


def evidence(pattern: str, path: str, max_samples: int, glob: str | None = None) -> dict:
    matches = run_rg(pattern, path, glob)
    samples = matches[:max_samples]

    files_seen = set()
    for m in matches:
        if ":" in m:
            files_seen.add(m.split(":", 1)[0])

    return {
        "pattern": pattern,
        "path": path,
        "glob": glob,
        "total_ocorrencias": len(matches),
        "arquivos_distintos": len(files_seen),
        "samples": samples,
        "samples_truncated": len(matches) > max_samples,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Grep com contagem + samples.")
    parser.add_argument("pattern", help="Regex ou string literal a buscar")
    parser.add_argument("path", help="Path onde buscar")
    parser.add_argument("--max-samples", type=int, default=3, help="Quantos samples retornar (default 3)")
    parser.add_argument("--glob", help="Filtro de arquivos (ex: *.ts, *.{js,jsx})")
    args = parser.parse_args()

    try:
        result = evidence(args.pattern, args.path, args.max_samples, args.glob)
    except RuntimeError as e:
        print(json.dumps({"error": str(e)}, indent=2, ensure_ascii=False))
        return 2

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["total_ocorrencias"] > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
