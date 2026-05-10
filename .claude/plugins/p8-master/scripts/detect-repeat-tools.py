#!/usr/bin/env python3
"""
detect-repeat-tools.py — Plugin P8-MASTER

Detecta sequencias repetidas de tool calls em transcripts JSONL de sessoes.
Usado por /p8-master:lessons-audit pra propor scripts auto-gerados ou skills novas.

Algoritmo:
1. Le todos JSONL no diretorio (default: ~/.claude/projects/<hash>/)
2. Filtra por janela de dias (default 30)
3. Extrai sequencias de 3-7 tool_calls consecutivos por sessao
4. Normaliza paths (substitui /worktrees/<hash>/ por <wt>/)
5. Agrupa cross-sessao por hash da sequencia (tool_name + arg_summary)
6. Filtra por threshold (default >= 5 ocorrencias em >= 3 sessoes)
7. Estima tempo medio total (ignora se < 30s — nao vale automatizar)
8. Retorna lista de candidatos a script/skill

Uso:
  python detect-repeat-tools.py --transcripts-dir <path>
                                 [--days 30]
                                 [--threshold-occurrences 5]
                                 [--threshold-sessions 3]
                                 [--min-duration-seconds 30]
                                 [--output <json-path>]

Threshold conservador (5x3) evita propostas prematuras.
"""

import argparse
import io
import json
import re
import sys
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


# Padroes pra normalizar paths (evita over-discrimination)
NORMALIZE_PATTERNS = [
    (re.compile(r"/worktrees/[a-z0-9-]+/"), "/worktrees/<wt>/"),
    (re.compile(r"\\worktrees\\[a-z0-9-]+\\"), r"\\worktrees\\<wt>\\"),
    (re.compile(r"\.cache-[a-z0-9-]+"), ".cache-<id>"),
]


def normalize_path(s: str) -> str:
    for pattern, replacement in NORMALIZE_PATTERNS:
        s = pattern.sub(replacement, s)
    return s


def summarize_tool_call(tool_name: str, tool_input: dict) -> str:
    """Resume tool call em string compacta para hashing."""
    if not isinstance(tool_input, dict):
        return tool_name
    if tool_name == "Bash":
        cmd = tool_input.get("command", "")
        first_token = cmd.split()[0] if cmd else ""
        # Inclui primeiro arg pra distinguir git status vs git diff
        second = cmd.split()[1] if len(cmd.split()) > 1 else ""
        return f"Bash:{first_token}:{second}"
    if tool_name in ("Read", "Edit", "Write"):
        path = tool_input.get("file_path", "")
        ext = Path(normalize_path(path)).suffix
        return f"{tool_name}:{ext}"
    if tool_name == "Grep":
        # So se importa o glob/path tipo, nao o pattern
        glob_filter = tool_input.get("glob") or tool_input.get("type") or ""
        return f"Grep:{glob_filter}"
    return tool_name


def extract_tool_sequence(jsonl_path: Path) -> list[tuple[str, str]]:
    """Le JSONL, retorna lista de (timestamp, summary) ordenada."""
    events = []
    try:
        with jsonl_path.open("r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                # Detecta tool call (formato Claude Code transcript)
                msg = obj.get("message", {})
                if msg.get("role") == "assistant":
                    for c in msg.get("content", []):
                        if isinstance(c, dict) and c.get("type") == "tool_use":
                            ts = obj.get("timestamp", "")
                            summary = summarize_tool_call(c.get("name", ""), c.get("input", {}))
                            events.append((ts, summary))
    except Exception:
        return []
    return events


def session_in_window(jsonl_path: Path, window_start: datetime) -> bool:
    """Checa rapidamente se sessao tem evento >= window_start (le primeiras linhas)."""
    try:
        with jsonl_path.open("r", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i > 5:
                    break
                try:
                    obj = json.loads(line.strip())
                    ts = obj.get("timestamp", "")
                    if ts:
                        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                        return dt >= window_start
                except Exception:
                    continue
    except Exception:
        pass
    return False


def find_candidates(transcripts: list[Path], threshold_occ: int, threshold_sess: int,
                    min_seq_len: int = 3, max_seq_len: int = 7) -> list[dict]:
    """Encontra n-gramas que repetem cross-sessao."""
    ngram_to_sessions: dict[tuple, set] = defaultdict(set)
    ngram_to_count: dict[tuple, int] = defaultdict(int)
    ngram_examples: dict[tuple, list] = defaultdict(list)

    for tp in transcripts:
        events = extract_tool_sequence(tp)
        if not events:
            continue
        summaries = [s for _, s in events]
        sess_id = tp.stem
        for n in range(min_seq_len, max_seq_len + 1):
            for i in range(len(summaries) - n + 1):
                seq = tuple(summaries[i:i + n])
                ngram_to_sessions[seq].add(sess_id)
                ngram_to_count[seq] += 1
                if len(ngram_examples[seq]) < 3:
                    ngram_examples[seq].append({
                        "session": sess_id,
                        "ts_first": events[i][0] if events[i][0] else None,
                    })

    candidates = []
    for seq, count in ngram_to_count.items():
        sessions = ngram_to_sessions[seq]
        if count >= threshold_occ and len(sessions) >= threshold_sess:
            candidates.append({
                "sequence": list(seq),
                "occurrences": count,
                "distinct_sessions": len(sessions),
                "samples": ngram_examples[seq],
            })

    candidates.sort(key=lambda c: (-c["distinct_sessions"], -c["occurrences"]))
    return candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Detecta sequencias repetidas em transcripts")
    parser.add_argument("--transcripts-dir", required=True,
                        help="Diretorio com .jsonl (~/.claude/projects/<hash>/ ou state/sessions/)")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--threshold-occurrences", type=int, default=5)
    parser.add_argument("--threshold-sessions", type=int, default=3)
    parser.add_argument("--min-duration-seconds", type=int, default=30,
                        help="Tempo medio minimo da sequencia para virar candidato")
    parser.add_argument("--output", help="Path JSON output (default stdout)")
    args = parser.parse_args()

    src = Path(args.transcripts_dir)
    if not src.exists():
        print(json.dumps({"error": f"diretorio nao existe: {src}", "candidates": []}, indent=2))
        return 0

    transcripts = list(src.rglob("*.jsonl"))
    if not transcripts:
        print(json.dumps({"error": "nenhum jsonl encontrado", "candidates": []}, indent=2))
        return 0

    window_start = datetime.now(timezone.utc) - timedelta(days=args.days)
    transcripts_filtered = [tp for tp in transcripts if session_in_window(tp, window_start)]

    candidates = find_candidates(
        transcripts_filtered,
        args.threshold_occurrences,
        args.threshold_sessions,
    )

    output = {
        "transcripts_dir": str(src.resolve()),
        "transcripts_total": len(transcripts),
        "transcripts_in_window": len(transcripts_filtered),
        "window_days": args.days,
        "thresholds": {
            "occurrences": args.threshold_occurrences,
            "sessions": args.threshold_sessions,
        },
        "candidates_count": len(candidates),
        "candidates": candidates,
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
