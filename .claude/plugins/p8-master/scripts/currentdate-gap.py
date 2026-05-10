#!/usr/bin/env python3
"""
currentdate-gap.py — Plugin P8-MASTER

Calcula gap entre data corrente da sessao Claude Code e a ultima checagem
de cada dominio em references/. Retorna lista de dominios stale (gap > threshold).

Usado pelo hook session-start.ps1 em background pra disparar stay-current se necessario.

Uso:
  python currentdate-gap.py --state <path-state-json> [--current-date YYYY-MM-DD]
                             [--threshold-days 14]
                             [--default-cutoff 2026-01-01]

Output: JSON em stdout
{
  "current_date": "...",
  "default_cutoff": "...",
  "domains": {
    "nextjs": {"last_checked": "...", "gap_days": N, "stale": bool},
    ...
  },
  "stale_count": N,
  "stale_list": [...]
}

Exit code: 0 sempre (nao bloquear sessao). State invalido escreve aviso no stderr.
"""

import argparse
import io
import json
import sys
from datetime import datetime, date
from pathlib import Path


# Forca UTF-8 no Windows (cp1252 quebra em chars unicode)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass


CANONICAL_DOMAINS = [
    "nextjs", "vercel", "stripe", "prisma", "sentry",
    "react", "tailwind", "zod", "iron-session"
]


def parse_date(s: str) -> date:
    """Aceita YYYY-MM-DD ou ISO 8601."""
    if "T" in s:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    return date.fromisoformat(s)


def load_state(state_path: Path) -> dict:
    if not state_path.exists():
        return {"last_checked": None, "domains": {}}
    try:
        return json.loads(state_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"AVISO: state corrompido ({e}), tratando como vazio.", file=sys.stderr)
        return {"last_checked": None, "domains": {}}


def calc_gap(current: date, prior: date | None, default_cutoff: date) -> int:
    """Gap em dias. Se nunca checado, usa default_cutoff."""
    reference = prior if prior else default_cutoff
    return (current - reference).days


def main() -> int:
    parser = argparse.ArgumentParser(description="Calcula gap stay-current")
    parser.add_argument("--state", required=True, help="Path do state/last-update.json")
    parser.add_argument("--current-date", help="Override currentDate (default: hoje)")
    parser.add_argument("--threshold-days", type=int, default=14)
    parser.add_argument("--default-cutoff", default="2026-01-01",
                        help="Cutoff fallback quando dominio nunca foi checado")
    args = parser.parse_args()

    current = parse_date(args.current_date) if args.current_date else date.today()
    default_cutoff = parse_date(args.default_cutoff)
    state_path = Path(args.state)

    state = load_state(state_path)
    state_domains = state.get("domains", {})

    domains_result = {}
    stale_list = []

    for d in CANONICAL_DOMAINS:
        prior_str = state_domains.get(d, {}).get("last_checked")
        prior = parse_date(prior_str) if prior_str else None
        gap = calc_gap(current, prior, default_cutoff)
        is_stale = gap >= args.threshold_days
        domains_result[d] = {
            "last_checked": prior_str,
            "gap_days": gap,
            "stale": is_stale,
        }
        if is_stale:
            stale_list.append(d)

    output = {
        "current_date": current.isoformat(),
        "default_cutoff": default_cutoff.isoformat(),
        "threshold_days": args.threshold_days,
        "domains": domains_result,
        "stale_count": len(stale_list),
        "stale_list": stale_list,
    }

    print(json.dumps(output, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
