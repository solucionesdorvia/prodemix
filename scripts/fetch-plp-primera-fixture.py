#!/usr/bin/env python3
"""Descarga fixture Primera (A/B/C) 2026 desde Firestore público de Paren La Pelota.

Colecciones: fixtures-2026-primera-{a|b|c}, documentos fecha-{1..34}-primera.

Uso:
  python3 scripts/fetch-plp-primera-fixture.py [a|b|c] [ruta-salida.json]

Por defecto: división `a` y salida `src/data/plp-primera-<letra>-fixture-2026.json`.

Usa `curl` para HTTPS (evita problemas de CA en algunos entornos locales).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys

PROJECT = "parenlapelotafutsal-4a110"
FECHAS = range(1, 35)

DIVISION = {
    "a": {
        "collection": "fixtures-2026-primera-a",
        "division": "primera-a",
        "sourceUrl": "https://parenlapelotafutsal.com.ar/primeraA/primera",
    },
    "b": {
        "collection": "fixtures-2026-primera-b",
        "division": "primera-b",
        "sourceUrl": "https://parenlapelotafutsal.com.ar/primeraB/primera",
    },
    "c": {
        "collection": "fixtures-2026-primera-c",
        "division": "primera-c",
        "sourceUrl": "https://parenlapelotafutsal.com.ar/primeraC/primera",
    },
}


def unwrap(v):  # Firestore REST value -> Python
    if not isinstance(v, dict):
        return v
    if "nullValue" in v:
        return None
    if "stringValue" in v:
        return v["stringValue"]
    if "integerValue" in v:
        return int(v["integerValue"])
    if "doubleValue" in v:
        return float(v["doubleValue"])
    if "booleanValue" in v:
        return v["booleanValue"]
    if "mapValue" in v:
        return {k: unwrap(x) for k, x in v["mapValue"].get("fields", {}).items()}
    if "arrayValue" in v:
        return [unwrap(x) for x in v["arrayValue"].get("values", [])]
    return v


def norm_score(x):
    if x is None or x == "":
        return None
    if isinstance(x, int):
        return x
    if isinstance(x, float):
        return int(x)
    if isinstance(x, str):
        s = x.strip()
        if s.isdigit() or (s.startswith("-") and s[1:].isdigit()):
            return int(s)
    try:
        return int(x)
    except (TypeError, ValueError):
        return None


def fetch_doc(collection: str, name: str) -> dict:
    url = (
        f"https://firestore.googleapis.com/v1/projects/{PROJECT}"
        f"/databases/(default)/documents/{collection}/{name}"
    )
    out = subprocess.check_output(
        ["curl", "-fsSL", "-A", "prodemix-fixture-fetch/1", url],
        timeout=120,
    )
    return json.loads(out.decode())


def run(letter: str, out_path: str) -> None:
    letter = letter.lower()
    if letter not in DIVISION:
        raise SystemExit(f"División inválida: {letter!r} (usar a, b o c)")
    cfg = DIVISION[letter]
    coll = cfg["collection"]
    rounds = []
    for n in FECHAS:
        doc_id = f"fecha-{n}-primera"
        try:
            raw = fetch_doc(coll, doc_id)
        except subprocess.CalledProcessError as e:
            print(f"WARN {doc_id}: curl falló ({e.returncode})", file=sys.stderr)
            continue
        fields = {k: unwrap(v) for k, v in raw.get("fields", {}).items()}
        matches = fields.get("matches") or []
        clean_matches = []
        for m in matches:
            if not isinstance(m, dict):
                continue
            clean_matches.append(
                {
                    "id": m.get("id"),
                    "homeTeam": m.get("homeTeam"),
                    "awayTeam": m.get("awayTeam"),
                    "homeScore": norm_score(m.get("homeScore")),
                    "awayScore": norm_score(m.get("awayScore")),
                    "status": m.get("status"),
                    "date": m.get("date") or None,
                    "venue": m.get("venue") or None,
                }
            )
        rounds.append(
            {
                "fecha": fields.get("fecha", n),
                "documentId": doc_id,
                "category": fields.get("category"),
                "matches": clean_matches,
            }
        )

    payload = {
        "sourceUrl": cfg["sourceUrl"],
        "firestoreProject": PROJECT,
        "collection": coll,
        "division": cfg["division"],
        "season": "2026",
        "rounds": rounds,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
    n_partidos = sum(len(r["matches"]) for r in rounds)
    print(f"OK: {out_path} ({len(rounds)} fechas, {n_partidos} partidos)")


def main() -> None:
    p = argparse.ArgumentParser(description="Fixture PLP Primera A/B/C desde Firestore")
    p.add_argument(
        "division",
        nargs="?",
        default="a",
        choices=("a", "b", "c"),
        help="División (default: a)",
    )
    p.add_argument(
        "out",
        nargs="?",
        default=None,
        help="Ruta del JSON de salida",
    )
    args = p.parse_args()
    out = args.out or f"src/data/plp-primera-{args.division}-fixture-2026.json"
    run(args.division, out)


if __name__ == "__main__":
    main()
