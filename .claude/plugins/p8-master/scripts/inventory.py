#!/usr/bin/env python3
"""
inventory.py — Plugin P8-MASTER

Inventario rapido do projeto P8-FigurinhasPro:
- linguagens detectadas (extensoes + frameworks via package.json)
- contagem de arquivos por categoria (src/app, src/lib, src/components, prisma, tests, docs)
- top 10 arquivos por LOC
- ferramentas detectadas (vitest, biome, sentry, prisma)

Uso:
  python inventory.py             # output JSON em stdout
  python inventory.py --root <path>
  python inventory.py --pretty    # formato legivel

Padronizado pra alimentar /p8-master:pesquisa e /p8-master:lessons-audit.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any


EXTENSIONS = {
    "TypeScript": [".ts", ".tsx"],
    "JavaScript": [".js", ".jsx", ".mjs", ".cjs"],
    "Markdown": [".md"],
    "JSON": [".json"],
    "YAML": [".yml", ".yaml"],
    "Prisma": [".prisma"],
    "CSS": [".css", ".scss"],
    "PowerShell": [".ps1"],
    "Shell": [".sh"],
    "Python": [".py"],
}

CATEGORY_DIRS = {
    "src/app": "src/app",
    "src/lib": "src/lib",
    "src/components": "src/components",
    "src/__tests__": "src/__tests__",
    "src/generated": "src/generated",
    "prisma": "prisma",
    "scripts": "scripts",
    "docs": "docs",
    "thoughts": "thoughts",
    "output": "output",
    "tests": "tests",
}

IGNORE_DIRS = {"node_modules", ".next", ".git", "dist", "build", ".turbo", "src/generated"}
IGNORE_FILES = {".DS_Store"}


def walk_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        rel = Path(dirpath).relative_to(root)
        # Filtra dirs ignorados
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for fname in filenames:
            if fname in IGNORE_FILES:
                continue
            yield rel / fname


def categorize_file(rel_path: Path) -> str:
    s = str(rel_path).replace("\\", "/")
    for category, prefix in CATEGORY_DIRS.items():
        if s.startswith(prefix):
            return category
    return "other"


def detect_language(rel_path: Path) -> str:
    suffix = rel_path.suffix.lower()
    for lang, exts in EXTENSIONS.items():
        if suffix in exts:
            return lang
    return "Other"


def count_loc(file_path: Path) -> int:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def detect_tools(root: Path) -> Dict[str, bool]:
    tools = {
        "vitest": False,
        "biome": False,
        "sentry": False,
        "prisma": False,
        "stripe": False,
        "next": False,
        "react": False,
        "tailwind": False,
        "iron-session": False,
        "zod": False,
    }
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            tools["vitest"] = "vitest" in deps
            tools["biome"] = "@biomejs/biome" in deps
            tools["sentry"] = "@sentry/nextjs" in deps
            tools["prisma"] = "prisma" in deps or "@prisma/client" in deps
            tools["stripe"] = "stripe" in deps
            tools["next"] = "next" in deps
            tools["react"] = "react" in deps
            tools["tailwind"] = "tailwindcss" in deps or "@tailwindcss/postcss" in deps
            tools["iron-session"] = "iron-session" in deps
            tools["zod"] = "zod" in deps
        except Exception:
            pass
    return tools


def detect_versions(root: Path) -> Dict[str, str]:
    versions = {}
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            for key in ["next", "react", "prisma", "@prisma/client", "vitest",
                        "@sentry/nextjs", "stripe", "iron-session", "zod", "tailwindcss"]:
                if key in deps:
                    versions[key] = deps[key]
        except Exception:
            pass
    return versions


def build_inventory(root: Path) -> Dict[str, Any]:
    languages: Dict[str, int] = {}
    categories: Dict[str, int] = {}
    file_locs: List[tuple] = []  # (loc, rel_path)

    for rel in walk_files(root):
        full = root / rel
        if not full.is_file():
            continue
        lang = detect_language(rel)
        languages[lang] = languages.get(lang, 0) + 1
        cat = categorize_file(rel)
        categories[cat] = categories.get(cat, 0) + 1
        # Conta LOC apenas para arquivos de codigo (TS/JS/Python/PS1/SH)
        if lang in ["TypeScript", "JavaScript", "Python", "PowerShell", "Shell"]:
            loc = count_loc(full)
            if loc > 0:
                file_locs.append((loc, str(rel).replace("\\", "/")))

    file_locs.sort(reverse=True)
    top_loc = [{"loc": loc, "path": p} for loc, p in file_locs[:10]]

    return {
        "root": str(root),
        "languages": dict(sorted(languages.items(), key=lambda x: -x[1])),
        "categories": dict(sorted(categories.items(), key=lambda x: -x[1])),
        "tools_detected": detect_tools(root),
        "versions": detect_versions(root),
        "top_loc_files": top_loc,
        "total_files": sum(languages.values()),
    }


def main():
    parser = argparse.ArgumentParser(description="Inventario do codebase")
    parser.add_argument("--root", default=".", help="Raiz do projeto (default: cwd)")
    parser.add_argument("--pretty", action="store_true", help="Output legivel")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"ERRO: root nao existe: {root}", file=sys.stderr)
        sys.exit(2)

    inv = build_inventory(root)

    if args.pretty:
        print(f"=== Inventario: {root} ===")
        print(f"\nLinguagens detectadas:")
        for lang, count in inv["languages"].items():
            print(f"  {lang}: {count}")
        print(f"\nCategorias:")
        for cat, count in inv["categories"].items():
            print(f"  {cat}: {count}")
        print(f"\nFerramentas:")
        for tool, present in inv["tools_detected"].items():
            mark = "OK" if present else "  "
            print(f"  [{mark}] {tool}")
        print(f"\nVersoes:")
        for k, v in inv["versions"].items():
            print(f"  {k}: {v}")
        print(f"\nTop 10 arquivos por LOC:")
        for f in inv["top_loc_files"]:
            print(f"  {f['loc']:>6} linhas — {f['path']}")
        print(f"\nTotal arquivos: {inv['total_files']}")
    else:
        print(json.dumps(inv, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
