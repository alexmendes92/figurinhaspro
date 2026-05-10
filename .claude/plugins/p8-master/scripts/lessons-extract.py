#!/usr/bin/env python3
"""
lessons-extract.py — Plugin P8-MASTER

Extrai padroes empiricos de sessoes Claude Code do projeto P8-FigurinhasPro.
Saida estruturada por categoria: erros recorrentes, skills lentas,
skills mal-acionadas. Usado por /p8-master:lessons-audit.

Uso:
  python lessons-extract.py --transcripts-dir <path>
                             [--days 15]
                             [--exclude-self-audit]
                             [--output <json-path>]

Padroes detectados:
- Erros recorrentes: mesmo error_message em >= 3 ocorrencias em >= 2 sessoes
- Skills lentas: tempo medio > 2x mediana global
- Skills mal-acionadas: invocadas mas resultado descartado / refeitas (heuristica)

Output: JSON com 4 categorias, cada uma com lista de achados ordenada por impacto.
"""

import argparse
import io
import json
import re
import sys
import statistics
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass


def parse_jsonl(path: Path) -> list[dict]:
    events = []
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                try:
                    events.append(json.loads(line.strip()))
                except json.JSONDecodeError:
                    continue
    except Exception:
        pass
    return events


def has_self_audit_flag(events: list[dict]) -> bool:
    """Detecta se sessao foi marcada como selfAudit (rodou /p8-master:audit)."""
    for ev in events[:10]:
        msg = str(ev.get("message", {})).lower()
        if "selfaudit" in msg or "lessons-audit" in msg or "auto-melhoria" in msg:
            return True
    return False


def session_in_window(events: list[dict], window_start: datetime) -> bool:
    for ev in events[:5]:
        ts = ev.get("timestamp", "")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                return dt >= window_start
            except Exception:
                continue
    return False


def extract_errors(events: list[dict]) -> list[dict]:
    """Identifica tool errors no transcript."""
    errors = []
    for ev in events:
        msg = ev.get("message", {})
        # tool_result com is_error: True
        for c in msg.get("content", []) if isinstance(msg.get("content"), list) else []:
            if isinstance(c, dict) and c.get("type") == "tool_result" and c.get("is_error"):
                content = c.get("content", "")
                if isinstance(content, list):
                    text = " ".join(b.get("text", "") for b in content if isinstance(b, dict))
                else:
                    text = str(content)
                # Resume primeiras 80 chars como signature
                signature = re.sub(r"\s+", " ", text[:160]).strip()
                errors.append({"signature": signature, "timestamp": ev.get("timestamp")})
    return errors


def extract_skill_invocations(events: list[dict]) -> list[dict]:
    """Identifica invocacoes de skills (Skill tool)."""
    invocations = []
    for ev in events:
        msg = ev.get("message", {})
        if msg.get("role") != "assistant":
            continue
        for c in msg.get("content", []) if isinstance(msg.get("content"), list) else []:
            if isinstance(c, dict) and c.get("type") == "tool_use" and c.get("name") == "Skill":
                inp = c.get("input", {})
                invocations.append({
                    "skill": inp.get("skill", "?"),
                    "args": inp.get("args", "")[:80],
                    "timestamp": ev.get("timestamp"),
                })
    return invocations


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai padroes empiricos de sessoes")
    parser.add_argument("--transcripts-dir", required=True)
    parser.add_argument("--days", type=int, default=15)
    parser.add_argument("--exclude-self-audit", action="store_true", default=True)
    parser.add_argument("--threshold-error-occurrences", type=int, default=3)
    parser.add_argument("--threshold-error-sessions", type=int, default=2)
    parser.add_argument("--output", help="Path JSON")
    args = parser.parse_args()

    src = Path(args.transcripts_dir)
    if not src.exists():
        print(json.dumps({"error": f"diretorio nao existe: {src}"}))
        return 0

    transcripts = list(src.rglob("*.jsonl"))
    window_start = datetime.now(timezone.utc) - timedelta(days=args.days)

    error_to_sessions: dict[str, set] = defaultdict(set)
    error_to_count: dict[str, int] = defaultdict(int)
    error_examples: dict[str, list] = defaultdict(list)
    skill_invocations: list[dict] = []
    sessions_processed = 0
    sessions_skipped_self_audit = 0

    for tp in transcripts:
        events = parse_jsonl(tp)
        if not events:
            continue
        if not session_in_window(events, window_start):
            continue
        if args.exclude_self_audit and has_self_audit_flag(events):
            sessions_skipped_self_audit += 1
            continue

        sess_id = tp.stem
        sessions_processed += 1

        for err in extract_errors(events):
            sig = err["signature"]
            error_to_sessions[sig].add(sess_id)
            error_to_count[sig] += 1
            if len(error_examples[sig]) < 3:
                error_examples[sig].append({"session": sess_id, "timestamp": err["timestamp"]})

        skill_invocations.extend(extract_skill_invocations(events))

    # Filtra erros recorrentes
    recurring_errors = []
    for sig, count in error_to_count.items():
        sessions = error_to_sessions[sig]
        if count >= args.threshold_error_occurrences and len(sessions) >= args.threshold_error_sessions:
            recurring_errors.append({
                "signature": sig,
                "occurrences": count,
                "distinct_sessions": len(sessions),
                "samples": error_examples[sig],
            })
    recurring_errors.sort(key=lambda e: (-e["distinct_sessions"], -e["occurrences"]))

    # Skills usadas
    skill_counts: dict[str, int] = defaultdict(int)
    for inv in skill_invocations:
        skill_counts[inv["skill"]] += 1
    skills_summary = [{"skill": s, "invocations": c} for s, c in
                      sorted(skill_counts.items(), key=lambda x: -x[1])]

    output = {
        "transcripts_dir": str(src.resolve()),
        "window_days": args.days,
        "sessions_processed": sessions_processed,
        "sessions_skipped_self_audit": sessions_skipped_self_audit,
        "categorias": {
            "a_erros_recorrentes": recurring_errors,
            "b_skills_invocacoes": skills_summary,
            "c_skills_lentas_TODO": "implementar quando state/sessions tiver duracao por skill",
            "d_skills_mal_acionadas_TODO": "implementar quando state/sessions tracker resultado descartado",
        },
        "thresholds": {
            "error_occurrences": args.threshold_error_occurrences,
            "error_sessions": args.threshold_error_sessions,
        },
    }

    payload = json.dumps(output, indent=2, ensure_ascii=False)
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(payload, encoding="utf-8")
        print(f"Output gravado em: {out}")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
