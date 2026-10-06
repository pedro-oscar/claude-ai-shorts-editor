"""Transcrição 100% local (sem ElevenLabs) com faster-whisper, na GPU se houver.

Gera edit/transcripts/<nome>.json no mesmo formato do ElevenLabs Scribe que o
video-use usa (palavras com start/end + "spacing"), então pack_transcripts.py,
render.py e edl_captions.py funcionam sem mudança. Se o arquivo já existir, pula
(mesmo cache do video-use); use --force para refazer.

Uso:
    python whisper_local.py bruto/                      # todos os vídeos da pasta
    python whisper_local.py bruto/podcast.mp4 --edit-dir edit
    python whisper_local.py bruto/ --hotwords "Thales, G4, Musk, CLT"   # nomes próprios

Modelo: auto (padrão) = large-v3 até 30 min de áudio, large-v3-turbo acima (≈5× mais rápido).
Modo padrão é sequencial e literal (mantém "é…", "tipo", "né" para o corte remover).
--fast usa lote: bem mais rápido, porém menos literal.
Sem identificação de quem fala: todas as palavras saem como speaker_0.
"""

from __future__ import annotations

import argparse
import ctypes
import glob
import json
import os
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

AUTO_LIMITE_MIN = 30  # medido na RTX 4090: 10 min de áudio → large-v3 149 s, turbo 28 s (94% de similaridade)

MEDIA_EXT = {".mp4", ".mov", ".mkv", ".webm", ".m4a", ".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4v"}

# Whisper "limpa" vícios de fala por padrão; o video-use precisa deles para cortar.
# Um prompt cheio de hesitações empurra o modelo para a transcrição literal.
VERBATIM_PROMPT = {
    "pt": "Ahn, então, tipo... é, hum, né? Aí, tipo assim, eu acho que, hã, a gente... É isso.",
    "en": "Um, so, like... uh, you know, I mean, hmm, we were, uh... Yeah.",
}


def preload_cuda_libs() -> None:
    """Carrega cuBLAS/cuDNN instalados via pip (nvidia-*-cu12) antes do CTranslate2 procurá-los."""
    site = Path(sys.prefix) / "lib"
    libs = sorted(glob.glob(str(site / "python3*/site-packages/nvidia/*/lib/lib*.so*")))
    pending = libs[:]
    for _ in range(4):  # algumas dependem de outras: tenta até estabilizar
        failed = []
        for lib in pending:
            try:
                ctypes.CDLL(lib, mode=ctypes.RTLD_GLOBAL)
            except OSError:
                failed.append(lib)
        if len(failed) == len(pending):
            break
        pending = failed


def load_audio(path: Path):
    """Decodifica para 16 kHz mono float32 com o ffmpeg do sistema (evita incompatibilidades do PyAV)."""
    import subprocess

    import numpy as np

    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def pick_device(requested: str) -> tuple[str, str]:
    import ctranslate2

    if requested == "cpu" or (requested == "auto" and ctranslate2.get_cuda_device_count() == 0):
        return "cpu", "int8"
    # A GPU aparece, mas o cuBLAS só é carregado na primeira transcrição; sem ele, falharia no meio.
    try:
        ctypes.CDLL("libcublas.so.12")
    except OSError:
        if requested == "cuda":
            raise
        print("GPU encontrada, mas sem as bibliotecas CUDA (rode ./instalar.sh de novo). Usando o processador.")
        return "cpu", "int8"
    return "cuda", "float16"


def to_scribe(segments, language: str, source: str) -> dict:
    words = []
    for seg in segments:
        for w in seg.words or []:
            text = w.word.strip()
            if not text:
                continue
            start, end = round(w.start, 3), round(max(w.end, w.start + 0.05), 3)
            if words and start < words[-1]["end"]:
                start = words[-1]["end"]
                end = max(end, start + 0.05)
            words.append({"text": text, "start": start, "end": end, "type": "word",
                          "speaker_id": "speaker_0", "logprob": round(w.probability, 3)})
            words.append({"text": " ", "start": end, "end": end, "type": "spacing", "speaker_id": "speaker_0"})
    return {
        "language_code": language,
        "text": " ".join(w["text"] for w in words if w["type"] == "word"),
        "words": words,
        "source": source,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", type=Path, help="arquivo de vídeo/áudio ou pasta")
    ap.add_argument("--edit-dir", type=Path, default=None, help="padrão: <pasta do vídeo>/../edit se existir, senão <pasta>/edit")
    ap.add_argument("--model", default="auto",
                    help=f"auto (padrão): large-v3 até {AUTO_LIMITE_MIN} min, large-v3-turbo acima")
    ap.add_argument("--language", default="pt")
    ap.add_argument("--device", choices=["auto", "cuda", "cpu"], default="auto")
    ap.add_argument("--fast", action="store_true",
                    help="modo em lote (~3× mais rápido), sem forçar vícios de fala")
    ap.add_argument("--batch-size", type=int, default=16)
    ap.add_argument("--hotwords", default=None, help="nomes próprios/jargões separados por vírgula")
    ap.add_argument("--no-verbatim", action="store_true", help="não forçar vícios de fala")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    files = (
        sorted(p for p in args.input.iterdir() if p.suffix.lower() in MEDIA_EXT)
        if args.input.is_dir()
        else [args.input]
    )
    if not files:
        sys.exit(f"nenhum vídeo/áudio em {args.input}")

    base = args.input if args.input.is_dir() else args.input.parent
    edit_dir = args.edit_dir or ((base.parent / "edit") if (base.parent / "edit").is_dir() else base / "edit")
    out_dir = edit_dir / "transcripts"
    out_dir.mkdir(parents=True, exist_ok=True)

    todo = [f for f in files if args.force or not (out_dir / f"{f.stem}.json").exists()]
    for f in files:
        if f not in todo:
            print(f"cached: {f.stem}.json")
    if not todo:
        return

    preload_cuda_libs()
    from faster_whisper import BatchedInferencePipeline, WhisperModel

    device, compute = pick_device(args.device)
    modelos: dict[str, object] = {}
    prompt = None if args.no_verbatim else VERBATIM_PROMPT.get(args.language)

    for f in todo:
        t0 = time.time()
        audio = load_audio(f)
        minutos = len(audio) / 16000 / 60
        nome = args.model
        if nome == "auto":
            # large-v3 é ~5× mais lento que o turbo; o ganho (mais vícios de fala) só compensa em vídeos
            # curtos e na GPU. No processador, sempre turbo.
            nome = "large-v3" if device == "cuda" and minutos <= AUTO_LIMITE_MIN else "large-v3-turbo"
        if nome not in modelos:
            print(f"carregando {nome} em {device} ({compute})…", flush=True)
            modelos[nome] = WhisperModel(nome, device=device, compute_type=compute)
        model = modelos[nome]
        pipe = BatchedInferencePipeline(model=model) if args.fast else None
        print(f"transcrevendo {f.name} ({minutos:.0f} min, {nome})…", flush=True)
        if args.fast:
            # Lote: bem mais rápido, mas com initial_prompt ele descarta trechos inteiros → sem prompt.
            segments, info = pipe.transcribe(
                audio, language=args.language, batch_size=args.batch_size, word_timestamps=True,
                vad_filter=True, hotwords=args.hotwords, beam_size=5,
            )
        else:
            segments, info = model.transcribe(
                audio, language=args.language, word_timestamps=True, vad_filter=True,
                initial_prompt=prompt, hotwords=args.hotwords, beam_size=5,
            )
        segs = []
        for s in segments:
            segs.append(s)
            print(f"\r  {s.end / 60:6.1f} / {info.duration / 60:.1f} min", end="", flush=True)
        print()
        data = to_scribe(segs, args.language, f"faster-whisper:{nome}")
        out = out_dir / f"{f.stem}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        n = sum(1 for w in data["words"] if w["type"] == "word")
        dt = time.time() - t0
        print(f"  → {out} ({n} palavras, {info.duration / 60:.1f} min de áudio em {dt:.0f}s)")


if __name__ == "__main__":
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    main()
