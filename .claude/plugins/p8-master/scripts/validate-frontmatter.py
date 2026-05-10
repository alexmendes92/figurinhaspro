#!/usr/bin/env python3
"""
validate-frontmatter.py — Plugin P8-MASTER

Valida frontmatter YAML de arquivos .md em thoughts/, output/, references/, templates/, skills/, agents/.

Checa:
- frontmatter YAML existe (entre --- ---)
- campos obrigatorios por tipo (pesquisa, plano, valida, revisao, decisao, handoff, auto-melhoria, atualizacao)
- valores validos (status: rascunho|ativo|arquivado, etc.)

Uso:
  python validate-frontmatter.py <path>
  python validate-frontmatter.py --type skill <path>
  python validate-frontmatter.py --recursive <path>

Exit codes:
  0 — todos validos
  1 — algum invalido
  2 — erro de uso
"""

import argparse
import sys
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# Schema por tipo. `tools` em agent e opcional — Claude Code aceita agents
# sem campo `tools` (defaulta pra all-tools) e os agents Oracle usam
# `disallowedTools` em vez de `tools`.
REQUIRED_FIELDS = {
    "skill": ["name", "description"],
    "agent": ["name", "description", "model"],
    "pesquisa": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "plano": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "valida": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "revisao": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "decisao": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "handoff": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "auto-melhoria": ["data", "tipo", "topico", "autor", "projeto", "status"],
    "atualizacao": ["data", "tipo", "topico", "autor", "projeto", "status"],
}

VALID_STATUS = ["rascunho", "ativo", "arquivado"]
VALID_TIPOS = list(REQUIRED_FIELDS.keys())


def parse_frontmatter(content: str) -> Tuple[Optional[Dict[str, str]], Optional[str]]:
    """Extrai frontmatter YAML simples (sem dependencia de pyyaml). Retorna (dict, erro)."""
    if not content.startswith("---\n") and not content.startswith("---\r\n"):
        return None, "frontmatter ausente (arquivo nao comeca com ---)"

    # Encontra o fim do frontmatter
    lines = content.split("\n")
    end_idx = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        return None, "frontmatter aberto mas nao fechado (--- final ausente)"

    fm_text = "\n".join(lines[1:end_idx])
    fm = {}
    for line in fm_text.split("\n"):
        line = line.rstrip()
        if not line or line.startswith("#"):
            continue
        # Match key: value (suporta tags YAML simples)
        m = re.match(r"^([a-zA-Z_][\w-]*)\s*:\s*(.*)$", line)
        if m:
            key, value = m.group(1), m.group(2).strip()
            # Limpar quotes
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            fm[key] = value
    return fm, None


def detect_type(file_path: Path, fm: Dict[str, str]) -> str:
    """Detecta tipo a partir de path ou frontmatter."""
    if "tipo" in fm and fm["tipo"] in REQUIRED_FIELDS:
        return fm["tipo"]
    name = file_path.name.upper()
    parent = file_path.parent.name.lower()
    if name == "SKILL.MD":
        return "skill"
    if name.endswith(".MD") and parent == "agents":
        return "agent"
    return "unknown"


def validate_file(file_path: Path) -> List[str]:
    """Valida 1 arquivo. Retorna lista de problemas (vazia = ok)."""
    problems = []
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"falha ao ler arquivo: {e}"]

    fm, err = parse_frontmatter(content)
    if err:
        return [err]

    if fm is None:
        return ["frontmatter vazio"]

    file_type = detect_type(file_path, fm)
    if file_type == "unknown":
        return []  # nao valida arquivo de tipo desconhecido

    required = REQUIRED_FIELDS.get(file_type, [])
    for field in required:
        if field not in fm or not fm[field]:
            problems.append(f"campo obrigatorio ausente: '{field}' (tipo: {file_type})")

    # Validacoes especificas
    if "status" in fm and fm["status"] not in VALID_STATUS:
        problems.append(f"status invalido: '{fm['status']}' (esperado: {VALID_STATUS})")

    if file_type in REQUIRED_FIELDS and file_type != "skill" and file_type != "agent":
        # tipos thoughts/* tem que ter projeto
        if fm.get("projeto") and fm["projeto"] != "P8-FigurinhasPro":
            problems.append(f"projeto deve ser 'P8-FigurinhasPro' (encontrado: '{fm['projeto']}')")

    return problems


def main():
    parser = argparse.ArgumentParser(description="Valida frontmatter YAML de arquivos .md")
    parser.add_argument("path", help="Caminho de arquivo ou diretorio")
    parser.add_argument("--recursive", "-r", action="store_true", help="Recursivo em diretorio")
    parser.add_argument("--quiet", "-q", action="store_true", help="So mostra falhas")
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"ERRO: path nao existe: {target}", file=sys.stderr)
        sys.exit(2)

    files = []
    if target.is_file():
        files = [target]
    elif args.recursive:
        files = list(target.rglob("*.md"))
    else:
        files = list(target.glob("*.md"))

    if not files:
        print(f"AVISO: nenhum .md encontrado em {target}", file=sys.stderr)
        sys.exit(0)

    total = 0
    invalid = 0
    for f in files:
        total += 1
        problems = validate_file(f)
        if problems:
            invalid += 1
            print(f"FALHA: {f}")
            for p in problems:
                print(f"  - {p}")
        elif not args.quiet:
            print(f"OK:    {f}")

    if invalid > 0:
        print(f"\n{invalid}/{total} arquivos com problemas.", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"\n{total}/{total} arquivos validos.")
        sys.exit(0)


if __name__ == "__main__":
    main()
