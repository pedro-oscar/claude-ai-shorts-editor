"""Alternativa sem ElevenLabs: converte as legendas automáticas do YouTube (json3, com
tempo por palavra) para o formato de transcrição do video-use (Scribe).

O video-use pula a transcrição quando edit/transcripts/<nome_do_video>.json já existe,
então pack_transcripts.py, render.py e edl_captions.py funcionam normalmente depois.

Limitações em relação ao Scribe: sem pontuação, sem identificação de quem fala,
tempos de fim estimados (fim = início da próxima palavra), erros de ASR mais frequentes.

Baixe as legendas junto com o vídeo:
    yt-dlp --write-auto-subs --sub-langs pt --sub-format json3 -o "bruto/%(id)s.%(ext)s" URL
Depois:
    python yt_captions_to_scribe.py bruto/<id>.pt.json3 -o edit/transcripts/<id>.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MAX_WORD_S = 1.2  # palavra nunca "dura" mais que isso (pausas viram silêncio)


def convert(data: dict) -> dict:
    raw: list[tuple[float, float, str]] = []  # (start, event_end, text)
    for ev in data.get("events", []):
        segs = ev.get("segs")
        if not segs or ev.get("aAppend"):
            continue
        t0 = ev.get("tStartMs", 0) / 1000
        ev_end = t0 + ev.get("dDurationMs", 0) / 1000
        for s in segs:
            text = (s.get("utf8") or "").strip()
            if not text or text == "\n":
                continue
            start = t0 + s.get("tOffsetMs", 0) / 1000
            for i, piece in enumerate(text.split()):
                raw.append((start + i * 0.05, ev_end, piece))
    raw.sort(key=lambda x: x[0])

    words = []
    for i, (start, ev_end, text) in enumerate(raw):
        nxt = raw[i + 1][0] if i + 1 < len(raw) else ev_end
        end = min(nxt, start + MAX_WORD_S, max(ev_end, start + 0.2))
        if end <= start:
            end = start + 0.15
        if text.startswith("[") and text.endswith("]"):
            words.append({"text": text, "start": round(start, 3), "end": round(end, 3), "type": "audio_event"})
            continue
        words.append({"text": text, "start": round(start, 3), "end": round(end, 3), "type": "word", "speaker_id": "speaker_0"})
        words.append({"text": " ", "start": round(end, 3), "end": round(end, 3), "type": "spacing", "speaker_id": "speaker_0"})
    return {
        "language_code": "por",
        "text": " ".join(w["text"] for w in words if w["type"] == "word"),
        "words": words,
        "source": "youtube-auto-captions",
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("json3", type=Path)
    ap.add_argument("-o", "--output", type=Path, required=True)
    args = ap.parse_args()
    out = convert(json.loads(args.json3.read_text(encoding="utf-8")))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    n = sum(1 for w in out["words"] if w["type"] == "word")
    dur = out["words"][-1]["end"] if out["words"] else 0
    print(f"{args.output.name}: {n} palavras, {dur / 60:.1f} min")


if __name__ == "__main__":
    main()
