"""Converte transcrições do video-use (Scribe, por palavra) + EDL de um corte em
captions.json no formato do @remotion/captions, já na linha do tempo do corte.

Mesma conta do render.py do video-use: out = palavra.start - range.start + offset.

Uso:
    python edl_captions.py --edl edit/cortes/c01/edl.json --transcripts edit/transcripts -o captions.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def words_in_range(transcript: dict, a: float, b: float) -> list[dict]:
    out = []
    for w in transcript.get("words", []):
        if w.get("type") != "word":
            continue
        ws, we = w.get("start"), w.get("end")
        if ws is None or we is None or we <= a or ws >= b:
            continue
        if (w.get("text") or "").strip():
            out.append(w)
    return out


def build(edl: dict, transcripts: Path) -> list[dict]:
    caps: list[dict] = []
    offset = 0.0
    for r in edl["ranges"]:
        a, b = float(r["start"]), float(r["end"])
        tr_path = transcripts / f"{r['source']}.json"
        if tr_path.exists():
            tr = json.loads(tr_path.read_text(encoding="utf-8"))
            for w in words_in_range(tr, a, b):
                s = max(a, w["start"]) - a + offset
                e = min(b, w["end"]) - a + offset
                if e <= s:
                    e = s + 0.12
                caps.append(
                    {
                        # @remotion/captions usa o espaço inicial para separar palavras
                        "text": (" " if caps else "") + w["text"].strip(),
                        "startMs": round(s * 1000),
                        "endMs": round(e * 1000),
                        "timestampMs": round((s + e) / 2 * 1000),
                        "confidence": None,
                    }
                )
        else:
            print(f"sem transcrição para '{r['source']}' ({tr_path}) — trecho fica sem legenda")
        offset += b - a
    # uma palavra nunca invade a próxima
    for cur, nxt in zip(caps, caps[1:]):
        cur["endMs"] = min(cur["endMs"], nxt["startMs"])
    return caps


def edl_duration(edl: dict) -> float:
    return sum(float(r["end"]) - float(r["start"]) for r in edl["ranges"])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--edl", type=Path, required=True)
    ap.add_argument("--transcripts", type=Path, required=True)
    ap.add_argument("-o", "--output", type=Path, required=True)
    args = ap.parse_args()
    edl = json.loads(args.edl.read_text(encoding="utf-8"))
    caps = build(edl, args.transcripts)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"captions.json: {len(caps)} palavras, {edl_duration(edl):.1f}s")


if __name__ == "__main__":
    main()
