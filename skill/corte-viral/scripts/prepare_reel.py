"""Leva um corte renderizado pelo video-use para dentro do projeto Remotion.

Cria remotion/public/clips/<id>/ com:
    cut.mp4        cópia do corte (horizontal, sem legenda)
    clip.json      duração, resolução, fps
    captions.json  palavras na linha do tempo do corte (edl_captions.py)
    face.json      enquadramento 9:16 (face_track.py)
    motion.json    plano de motion — criado vazio só se ainda não existir

Uso:
    python prepare_reel.py --clip c01 --edit edit --remotion remotion
        (espera edit/cortes/c01/edl.json e edit/cortes/c01/cut.mp4)
    opções extras são repassadas ao face_track: --pin 12-18:0.3 --step 0.2 --alpha 0.25
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import cv2

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from edl_captions import build as build_captions, edl_duration  # noqa: E402


def probe(video: Path) -> dict:
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    info = {
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "fps": round(fps, 3),
        "durationSec": round(n / fps, 3) if n else None,
    }
    cap.release()
    return info


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip", required=True, help="id do corte, ex. c01")
    ap.add_argument("--edit", type=Path, required=True, help="pasta edit/ do video-use")
    ap.add_argument("--remotion", type=Path, required=True, help="pasta do projeto Remotion")
    ap.add_argument("--video", type=Path, default=None, help="padrão: edit/cortes/<id>/cut.mp4")
    ap.add_argument("--edl", type=Path, default=None, help="padrão: edit/cortes/<id>/edl.json")
    ap.add_argument("--pin", action="append", default=[])
    ap.add_argument("--step", type=float, default=0.2)
    ap.add_argument("--alpha", type=float, default=0.25)
    args = ap.parse_args()

    clip_dir_edit = args.edit / "cortes" / args.clip
    video = args.video or clip_dir_edit / "cut.mp4"
    edl_path = args.edl or clip_dir_edit / "edl.json"
    if not video.exists():
        sys.exit(f"corte não encontrado: {video} (renderize com o render.py do video-use antes)")
    edl = json.loads(edl_path.read_text(encoding="utf-8"))

    out = args.remotion / "public" / "clips" / args.clip
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(video, out / "cut.mp4")

    info = probe(video)
    if not info["durationSec"]:
        info["durationSec"] = round(edl_duration(edl), 3)
    expected = edl_duration(edl)
    if abs(info["durationSec"] - expected) > 0.5:
        print(f"aviso: vídeo tem {info['durationSec']}s mas o EDL soma {expected:.2f}s")
    (out / "clip.json").write_text(json.dumps({"video": "cut.mp4", **info}, indent=1), encoding="utf-8")

    caps = build_captions(edl, args.edit / "transcripts")
    (out / "captions.json").write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"captions.json: {len(caps)} palavras")

    cmd = [
        sys.executable, str(HERE / "face_track.py"), str(video), "-o", str(out / "face.json"),
        "--step", str(args.step), "--alpha", str(args.alpha),
        "--debug-dir", str(clip_dir_edit / "verify_face"),
    ]
    for p in args.pin:
        cmd += ["--pin", p]
    subprocess.run(cmd, check=True)

    motion = out / "motion.json"
    if not motion.exists():
        motion.write_text(json.dumps({"style": {}, "emphasis": [], "motions": []}, indent=1), encoding="utf-8")
        print("motion.json vazio criado — preencha seguindo references/motion-guide.md")

    print(f"\npronto: {out}")
    print(f"PNGs de enquadramento para revisar: {clip_dir_edit / 'verify_face'}")
    print(f"composição no Remotion: reel-{args.clip}")


if __name__ == "__main__":
    main()
