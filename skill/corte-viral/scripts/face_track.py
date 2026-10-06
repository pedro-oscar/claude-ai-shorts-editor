"""Rastreia o rosto de quem fala num corte e gera keyframes de enquadramento 9:16.

Saída (face.json):
    {"keys": [{"t": 0.0, "cx": 0.52, "cy": 0.41, "cut": false}, ...],
     "stats": {...}}
cx/cy = centro do rosto normalizado (0–1) no quadro original. `cut: true` marca a
primeira amostra depois de uma troca de câmera: o Remotion corta seco ali em vez de
fazer uma panorâmica.

Detector: YuNet (OpenCV DNN, baixado uma vez para scripts/models/). Sem ele, cai
para Haar cascade (vem com o OpenCV, menos preciso).

Uso:
    python face_track.py cut.mp4 -o face.json
    python face_track.py cut.mp4 -o face.json --debug-dir verify/face   # PNGs com o recorte 9:16 desenhado
    python face_track.py cut.mp4 -o face.json --pin 12.5-18:0.30 --pin 40-44:0.72
        --pin START-END:CX força o centro horizontal num trecho (ex.: plano aberto
        com duas pessoas, quando o rastreio escolheu quem não está falando).
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import cv2
import numpy as np

YUNET_URL = (
    "https://github.com/opencv/opencv_zoo/raw/main/models/"
    "face_detection_yunet/face_detection_yunet_2023mar.onnx"
)
MODEL_PATH = Path(__file__).parent / "models" / "face_detection_yunet_2023mar.onnx"
DETECT_W = 640          # largura usada na detecção
SHOT_CHANGE = 0.45      # distância de Bhattacharyya entre histogramas = troca de câmera
STICKY_DIST = 0.18      # rosto a menos disso do anterior = mesma pessoa
DEADZONE = 0.035        # movimento menor que isso não mexe a câmera
OUT_ASPECT = 9 / 16


class Detector:
    def __init__(self, kind: str):
        self.kind = kind
        if kind == "yunet":
            if not MODEL_PATH.exists():
                MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
                print(f"baixando modelo YuNet → {MODEL_PATH}")
                urllib.request.urlretrieve(YUNET_URL, MODEL_PATH)
            self.net = cv2.FaceDetectorYN.create(str(MODEL_PATH), "", (320, 320), 0.7, 0.3, 50)
        else:
            self.cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    def detect(self, img: np.ndarray) -> list[tuple[float, float, float, float, float]]:
        """Retorna [(x, y, w, h, score)] em pixels de `img`."""
        h, w = img.shape[:2]
        if self.kind == "yunet":
            self.net.setInputSize((w, h))
            _, faces = self.net.detect(img)
            if faces is None:
                return []
            return [(float(f[0]), float(f[1]), float(f[2]), float(f[3]), float(f[-1])) for f in faces]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        found = self.cascade.detectMultiScale(gray, 1.1, 6, minSize=(40, 40))
        return [(float(x), float(y), float(fw), float(fh), 1.0) for (x, y, fw, fh) in found]


def histogram(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
    return cv2.normalize(hist, hist).flatten()


def parse_pins(pins: list[str]) -> list[tuple[float, float, float]]:
    out = []
    for p in pins:
        rng, cx = p.split(":")
        a, b = rng.split("-")
        out.append((float(a), float(b), float(cx)))
    return out


def smooth_segment(vals: list[float], alpha: float) -> list[float]:
    """EMA ida e volta (sem atraso) + zona morta: a câmera só anda quando o rosto anda de verdade."""
    if not vals:
        return vals
    fwd = [vals[0]]
    for v in vals[1:]:
        fwd.append(alpha * v + (1 - alpha) * fwd[-1])
    bwd = [fwd[-1]]
    for v in reversed(fwd[:-1]):
        bwd.append(alpha * v + (1 - alpha) * bwd[-1])
    sm = list(reversed(bwd))
    held = [sm[0]]
    for v in sm[1:]:
        held.append(v if abs(v - held[-1]) > DEADZONE else held[-1])
    return held


def track(video: Path, step: float, detector: Detector, debug_dir: Path | None, pins, alpha: float) -> dict:
    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        sys.exit(f"não consegui abrir {video}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    every = max(1, round(step * fps))

    samples = []  # (t, cx|None, cy|None, cut, frame_small)
    prev_hist = None
    prev = None
    detected = 0
    idx = 0
    while True:
        ok = cap.grab()
        if not ok:
            break
        if idx % every == 0:
            ok, frame = cap.retrieve()
            if not ok:
                break
            t = idx / fps
            scale = DETECT_W / W
            small = cv2.resize(frame, (DETECT_W, int(H * scale)))
            hist = histogram(small)
            cut = prev_hist is not None and cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA) > SHOT_CHANGE
            prev_hist = hist
            if cut:
                prev = None

            faces = detector.detect(small)
            choice = None
            if faces:
                detected += 1
                sw, sh = small.shape[1], small.shape[0]
                cands = [((x + w / 2) / sw, (y + h / 2) / sh, w * h * s, w / sw, h / sh) for x, y, w, h, s in faces]
                largest = max(cands, key=lambda c: c[2])
                if prev is not None:
                    nearest = min(cands, key=lambda c: abs(c[0] - prev[0]) + abs(c[1] - prev[1]))
                    near_d = abs(nearest[0] - prev[0])
                    # fica com a mesma pessoa, a não ser que outro rosto fique muito maior (câmera fechou nele)
                    choice = nearest if near_d < STICKY_DIST and nearest[2] * 2.2 > largest[2] else largest
                else:
                    choice = largest
                prev = choice
            samples.append(
                [t, choice[0] if choice else None, choice[1] if choice else None, cut,
                 small if debug_dir else None,
                 choice[3] if choice else None, choice[4] if choice else None]
            )
        idx += 1
    cap.release()

    # sem rosto → segura o último (ou o próximo) valor conhecido dentro do mesmo plano
    # tamanho padrão de rosto (fração do quadro original) quando nada foi detectado
    padrao = (0.5, 0.4, 0.17, 0.30)
    last = padrao
    for s in samples:
        if s[3]:
            last = padrao
        if s[1] is None:
            s[1], s[2], s[5], s[6] = last
        else:
            last = (s[1], s[2], s[5], s[6])

    # pins manuais
    for a, b, cx in pins:
        for s in samples:
            if a <= s[0] <= b:
                s[1] = cx

    # suavização por plano (nunca atravessa uma troca de câmera)
    segs, cur = [], []
    for s in samples:
        if s[3] and cur:
            segs.append(cur)
            cur = []
        cur.append(s)
    if cur:
        segs.append(cur)
    keys = []
    for seg in segs:
        cxs = smooth_segment([s[1] for s in seg], alpha)
        cys = smooth_segment([s[2] for s in seg], alpha)
        fws = smooth_segment([s[5] for s in seg], alpha)
        fhs = smooth_segment([s[6] for s in seg], alpha)
        for s, cx, cy, fw, fh in zip(seg, cxs, cys, fws, fhs):
            keys.append({"t": round(float(s[0]), 3), "cx": round(float(cx), 4), "cy": round(float(cy), 4),
                         "fw": round(float(fw), 4), "fh": round(float(fh), 4), "cut": bool(s[3])})

    # remove keys redundantes (mesma posição em sequência), mantendo cortes
    compact = []
    for k in keys:
        if compact and not k["cut"] and all(k[c] == compact[-1][c] for c in ("cx", "cy", "fw", "fh")):
            continue
        compact.append(k)
    if keys and compact[-1] is not keys[-1]:
        compact.append(keys[-1])

    if debug_dir:
        write_debug(debug_dir, samples, keys, W, H)

    return {
        "version": 2,
        "keys": compact,
        "stats": {
            "source": str(video.name),
            "width": W,
            "height": H,
            "fps": fps,
            "durationSec": round(n / fps, 3) if n else None,
            "samples": len(samples),
            "faceRatio": round(detected / max(1, len(samples)), 3),
            "shots": len(segs),
            "detector": detector.kind,
        },
    }


def write_debug(out: Path, samples, keys, W, H, max_imgs: int = 12) -> None:
    """Desenha a janela 9:16 que o Remotion vai usar. Olhe estes PNGs antes de animar."""
    out.mkdir(parents=True, exist_ok=True)
    picks = np.linspace(0, len(samples) - 1, min(max_imgs, len(samples))).astype(int)
    # sempre inclui a amostra logo depois de cada troca de câmera
    picks = sorted(set(picks.tolist()) | {i for i, s in enumerate(samples) if s[3]})
    for i in picks:
        s, k = samples[i], keys[i]
        img = s[4].copy()
        h, w = img.shape[:2]
        cw = h * OUT_ASPECT * (1.0 if W / H >= OUT_ASPECT else W / H)
        x0 = int(min(max(k["cx"] * w - cw / 2, 0), w - cw))
        cv2.rectangle(img, (x0, 0), (int(x0 + cw), h - 1), (0, 255, 255), 3)
        cv2.circle(img, (int(k["cx"] * w), int(k["cy"] * h)), 6, (0, 0, 255), -1)
        label = f"t={s[0]:.1f}s{' CUT' if s[3] else ''}"
        cv2.putText(img, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        cv2.imwrite(str(out / f"face_{s[0]:07.2f}.png"), img)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("--step", type=float, default=0.2, help="segundos entre amostras (padrão 0.2)")
    ap.add_argument("--alpha", type=float, default=0.25, help="suavização 0–1; menor = câmera mais calma")
    ap.add_argument("--detector", choices=["yunet", "haar"], default="yunet")
    ap.add_argument("--pin", action="append", default=[], help="START-END:CX (ver docstring)")
    ap.add_argument("--debug-dir", type=Path, default=None)
    args = ap.parse_args()

    try:
        det = Detector(args.detector)
    except Exception as e:  # sem internet / modelo corrompido
        print(f"YuNet indisponível ({e}); usando Haar")
        det = Detector("haar")

    result = track(args.video, args.step, det, args.debug_dir, parse_pins(args.pin), args.alpha)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=1), encoding="utf-8")
    st = result["stats"]
    print(
        f"face.json: {len(result['keys'])} keys, {st['shots']} plano(s), "
        f"rosto em {st['faceRatio']:.0%} das amostras ({st['detector']})"
    )
    if st["faceRatio"] < 0.6:
        print("ATENÇÃO: poucos rostos detectados — confira os PNGs de debug e use --pin se precisar.")


if __name__ == "__main__":
    main()
