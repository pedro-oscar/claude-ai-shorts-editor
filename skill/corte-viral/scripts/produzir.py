"""Produz todos os reels de um roteiro escrito pelo Claude (edit/roteiros/<video>.json).

Para cada corte com status "produzir":
  1. ajusta os trechos ao limite das palavras (nunca corta no meio de uma palavra)
  2. monta o EDL e renderiza o corte horizontal com o video-use
  3. leva o corte ao Remotion: legenda (com correções), rosto (face_track), motion.json
  4. renderiza o reel 9:16 → publicar/<chave>.mp4
  5. gera uma folha de revisão (edit/cortes/<chave>/revisao.png)

Cada etapa só roda de novo se a entrada mudou (cache por hash). Formato do roteiro:
references/roteiro.md da skill.

Uso (normalmente via ./ae):
    python produzir.py edit/roteiros/<video>.json                  # produz
    python produzir.py edit/roteiros/<video>.json --validar        # só confere, sem renderizar
    python produzir.py ... --so c01,c03   --rapido   --forcar
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from edl_captions import build as build_captions  # noqa: E402

SKILL = HERE.parent


def _achar_video_use() -> Path:
    if os.environ.get("VIDEO_USE"):
        return Path(os.environ["VIDEO_USE"])
    # SKILL vem de resolve(): se corte-viral for symlink para o repo, SKILL.parent é o repo, não ~/.claude/skills
    candidatos = [SKILL.parent / "video-use", Path.home() / ".claude" / "skills" / "video-use"]
    return next((c for c in candidatos if (c / "SKILL.md").exists()), candidatos[-1])


VIDEO_USE = _achar_video_use()
VU_PY = VIDEO_USE / ".venv" / "bin" / "python"
FPS = 30

RESPIRO_FINAL = 1.2  # s de som natural (reação, riso, respiro) aproveitados depois da última palavra
CAUDA_MIN = 1.0  # s mínimos entre a última palavra e o fim do reel; o que faltar vira quadro congelado
FIM_LIVRE = 0.8  # s finais sem motion (saída suave: escurece e o áudio baixa)
DUR_MAX = 90.0
DUR_CURTO = 45.0  # abaixo disso a validação avisa: o alvo é 60–90 s

DUR_PADRAO = {"title": 2.6, "keyword": 1.6, "counter": 2.4, "zoom": 1.4, "shake": 1.0, "scene": 3.5}
REGIAO = {"title": "topo", "keyword": "meio", "counter": "meio", "scene": "cena"}


class Problema(Exception):
    pass


# ---------------------------------------------------------------- utilidades

def cor(txt: str, c: str) -> str:
    codes = {"verde": "32", "vermelho": "31", "amarelo": "33", "negrito": "1", "cinza": "90"}
    return f"\033[{codes[c]}m{txt}\033[0m" if sys.stdout.isatty() else txt


def sha(*partes) -> str:
    h = hashlib.sha256()
    for p in partes:
        if isinstance(p, Path):
            h.update(p.read_bytes() if p.is_file() else b"<sem arquivo>")
        else:
            h.update(json.dumps(p, sort_keys=True, ensure_ascii=False).encode())
    return h.hexdigest()[:16]


def em_cache(marca: Path, h: str) -> bool:
    return marca.exists() and marca.read_text() == h


def sha_arvore(pasta: Path) -> str:
    h = hashlib.sha256()
    for f in sorted(pasta.rglob("*")):
        if f.is_file():
            h.update(str(f.relative_to(pasta)).encode())
            h.update(f.read_bytes())
    return h.hexdigest()[:16]


def norm(w: str) -> str:
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^\w$%]", "", w).lower()


def slug(txt: str, n: int = 12) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", norm_ascii(txt)).strip("-")
    return (s[:n].strip("-") or "video")


def norm_ascii(txt: str) -> str:
    t = unicodedata.normalize("NFD", txt)
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower()


def tempo(v) -> float:
    """1234.5 | "20:34.5" | "1:20:34" → segundos."""
    if isinstance(v, (int, float)):
        return float(v)
    s = 0.0
    for parte in str(v).split(":"):
        s = s * 60 + float(parte)
    return s


def run(cmd: list, cwd: Path | None = None, quieto: bool = False) -> None:
    if quieto:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stdout[-3000:], r.stderr[-3000:])
            raise Problema(f"falhou: {' '.join(map(str, cmd[:4]))} …")
    else:
        subprocess.run(cmd, cwd=cwd, check=True)


# ---------------------------------------------------------------- roteiro

class Roteiro:
    def __init__(self, caminho: Path, projeto: Path):
        self.caminho = caminho
        self.projeto = projeto
        self.dados = json.loads(caminho.read_text(encoding="utf-8"))
        fonte = self.dados.get("fonte")
        if not fonte:
            raise Problema('roteiro sem "fonte" (caminho do vídeo)')
        self.fonte = (projeto / fonte).resolve()
        if not self.fonte.exists():
            raise Problema(f"vídeo de origem não existe: {self.fonte}")
        self.stem = self.fonte.stem
        self.prefixo = self.dados.get("prefixo") or slug(self.stem)
        tr = projeto / "edit" / "transcripts" / f"{self.stem}.json"
        if not tr.exists():
            raise Problema(f"falta a transcrição {tr} — rode ./ae transcrever {fonte}")
        self.palavras = [w for w in json.loads(tr.read_text(encoding="utf-8"))["words"] if w.get("type") == "word"]
        self.duracao = self.palavras[-1]["end"] if self.palavras else 0
        self.correcoes = {norm(k): v for k, v in (self.dados.get("correcoes") or {}).items()}
        self.estilo = self.dados.get("estilo") or {}

    def cortes(self, so: set[str] | None):
        for c in self.dados.get("cortes", []):
            if c.get("status", "produzir") != "produzir":
                continue
            if so and c["id"] not in so:
                continue
            yield c

    def chave(self, corte: dict) -> str:
        return f"{self.prefixo}-{slug(corte['id'], 20)}"


def ajustar_trecho(palavras: list[dict], a: float, b: float, final: bool = False) -> tuple[float, float, float, list[str]]:
    """Expande/encolhe [a, b] para limites de palavra, com folga de respiro.

    No trecho final do corte a folga depois da última palavra é maior (até RESPIRO_FINAL s, sem
    invadir a próxima palavra): o reel termina num respiro natural, não seco na última sílaba.
    Devolve (ini, fim, fim da última palavra, avisos).
    """
    avisos = []
    dentro = []
    for i, w in enumerate(palavras):
        ov = min(b, w["end"]) - max(a, w["start"])
        if ov > 0 and ov >= 0.4 * (w["end"] - w["start"]):
            dentro.append(i)
    if not dentro:
        raise Problema(f"trecho {a:.2f}–{b:.2f} não contém nenhuma palavra")
    i0, i1 = dentro[0], dentro[-1]
    w0, w1 = palavras[i0], palavras[i1]
    ant = palavras[i0 - 1]["end"] if i0 > 0 else 0.0
    prox = palavras[i1 + 1]["start"] if i1 + 1 < len(palavras) else w1["end"] + 1.0
    ini = min(w0["start"], max(ant, w0["start"] - 0.12))
    folga = RESPIRO_FINAL if final else 0.18
    fim = max(w1["end"], min(prox - (0.06 if final else 0.0), w1["end"] + folga))
    if final and not re.search(r"[.!?…]\W*$", w1["text"]):
        avisos.append(f"o corte termina em \"{w1['text']}\", sem fim de frase — pode soar abrupto; prefira terminar numa frase completa")
    # no trecho final, estender até RESPIRO_FINAL além da última palavra é esperado, não vale aviso
    if abs(ini - a) > 0.6 or (fim - b > (RESPIRO_FINAL + 0.6 if final else 0.6)) or b - fim > 0.6:
        avisos.append(f"trecho {a:.2f}–{b:.2f} ajustado para {ini:.2f}–{fim:.2f} (\"{w0['text']} … {w1['text']}\")")
    return round(ini, 3), round(fim, 3), w1["end"], avisos


class Plano:
    """Tudo o que um corte precisa, calculado sem renderizar nada."""

    def __init__(self, rot: Roteiro, corte: dict):
        self.rot, self.corte = rot, corte
        self.id = corte["id"]
        self.chave = rot.chave(corte)
        self.avisos: list[str] = []
        trechos = corte.get("trechos") or []
        if not trechos:
            raise Problema(f"{self.id}: sem trechos")
        self.ranges = []
        fala_fim = 0.0
        for n, t in enumerate(trechos):
            a, b = tempo(t[0]), tempo(t[1])
            if not (0 <= a < b <= rot.duracao + 1):
                raise Problema(f"{self.id}: trecho {t} fora do vídeo (0–{rot.duracao:.0f}s)")
            ini, fim, fala_fim, av = ajustar_trecho(rot.palavras, a, b, final=(n == len(trechos) - 1))
            self.avisos += av
            self.ranges.append((ini, fim))
        self.duracao = sum(b - a for a, b in self.ranges)  # duração do corte horizontal (cut.mp4)
        # saída: a fala acaba em fim_fala; se o som natural depois dela for curto (o falante emenda
        # a próxima frase), o Remotion congela o último quadro em silêncio até completar CAUDA_MIN
        respiro = max(0.0, self.ranges[-1][1] - fala_fim)
        self.fim_fala = round(self.duracao - respiro, 3)
        self.congelar = round(max(0.0, CAUDA_MIN - respiro), 3)
        self.total = self.duracao + self.congelar  # duração do reel
        if self.total > DUR_MAX + 0.5:
            raise Problema(f"{self.id}: {self.total:.1f}s — o máximo é {DUR_MAX:.0f}s; enxugue os trechos")
        if self.total < DUR_CURTO:
            self.avisos.append(f"duração {self.total:.1f}s (curto; o alvo é 60–90s — inclua o contexto e deixe o payoff respirar)")
        self.edl = {
            "sources": {rot.stem: str(rot.fonte)},
            "ranges": [{"source": rot.stem, "start": a, "end": b} for a, b in self.ranges],
            "grade": corte.get("grade", "auto"),
        }
        self.captions = self._legenda()
        self.motion = self._motion()

    # src → linha do tempo do corte
    def mapear(self, t_src: float) -> float:
        off = 0.0
        for a, b in self.ranges:
            if a - 0.05 <= t_src <= b + 0.05:
                return max(0.0, min(t_src, b) - a) + off
            off += b - a
        raise Problema(f"{self.id}: tempo {t_src:.2f}s não está em nenhum trecho {self.ranges}")

    def _legenda(self) -> list[dict]:
        transcripts = self.rot.projeto / "edit" / "transcripts"
        caps = build_captions(self.edl, transcripts)
        corr = {**self.rot.correcoes, **{norm(k): v for k, v in (self.corte.get("correcoes") or {}).items()}}
        if corr:
            for c in caps:
                txt = c["text"]
                lead = " " if txt.startswith(" ") else ""
                core = txt.strip()
                m = re.match(r"^(\W*)(.*?)(\W*)$", core)
                pre, palavra, pos = m.groups() if m else ("", core, "")
                if norm(palavra) in corr:
                    c["text"] = f"{lead}{pre}{corr[norm(palavra)]}{pos}"
        return caps

    def _achar_palavra(self, palavra: str, perto: float | None) -> float:
        alvo = norm(palavra)
        cands = [c["startMs"] / 1000 for c in self.captions if norm(c["text"]) == alvo]
        if not cands:
            raise Problema(f'{self.id}: palavra "{palavra}" não aparece na legenda do corte')
        if perto is None:
            return cands[0]
        melhor = min(cands, key=lambda s: abs(s - perto))
        if abs(melhor - perto) > 4:
            self.avisos.append(f'palavra "{palavra}" mais próxima está a {abs(melhor - perto):.1f}s do "at" indicado')
        return melhor

    def _motion(self) -> dict:
        saida = []
        motions = list(self.corte.get("motions") or [])
        if self.corte.get("titulo") and not any(m.get("type") == "title" for m in motions):
            saida.append({"type": "title", "start": 0.1, "end": min(2.8, self.duracao - 0.2), "text": self.corte["titulo"]})
        for i, m in enumerate(motions):
            m = dict(m)
            tipo = m.get("type")
            if tipo not in {"title", "keyword", "counter", "zoom", "shake", "scene", "flash"}:
                raise Problema(f"{self.id}: motion #{i + 1} com type inválido: {tipo!r}")
            perto = self.mapear(tempo(m.pop("at"))) if "at" in m else None
            if "word" in m:
                ini = max(0.0, self._achar_palavra(m.pop("word"), perto) - 0.1)
            elif perto is not None:
                ini = perto
            elif tipo == "title":
                ini = 0.1
            else:
                raise Problema(f'{self.id}: motion #{i + 1} ({tipo}) precisa de "at" ou "word"')
            if tipo == "flash":
                saida.append({"type": "flash", "at": round(ini, 3), **{k: v for k, v in m.items() if k not in {"type", "dur", "ate"}}})
                continue
            if "ate" in m:
                fim = self.mapear(tempo(m.pop("ate")))
            else:
                fim = ini + float(m.pop("dur", DUR_PADRAO[tipo]))
            fim = min(fim, self.fim_fala + 0.3, self.total - FIM_LIVRE)  # depois da fala é a saída suave
            if fim - ini < 0.3:
                raise Problema(f"{self.id}: motion #{i + 1} ({tipo}) curto demais ou fora do corte")
            m.pop("dur", None)
            saida.append({**m, "type": tipo, "start": round(ini, 3), "end": round(fim, 3)})
        self._checar_sobreposicao(saida)
        estilo = {**self.rot.estilo, **(self.corte.get("estilo") or {})}
        return {"style": estilo, "emphasis": self.corte.get("enfase") or [], "motions": saida,
                "saida": {"fimFala": self.fim_fala, "congelar": self.congelar}}

    def _checar_sobreposicao(self, ms: list[dict]) -> None:
        for i, a in enumerate(ms):
            for b in ms[i + 1:]:
                if "start" not in a or "start" not in b:
                    continue
                ra, rb = REGIAO.get(a["type"]), REGIAO.get(b["type"])
                if ra and ra == rb and a["start"] < b["end"] and b["start"] < a["end"]:
                    self.avisos.append(f"{a['type']} {a['start']:.1f}s e {b['type']} {b['start']:.1f}s se sobrepõem na mesma região")
        cobertos = sum(m["end"] - m["start"] for m in ms if m["type"] == "scene" and m.get("layout", "full") == "full")
        if cobertos > 0.6 * self.duracao:
            self.avisos.append("cenas 'full' cobrem mais de 60% do corte; o rosto quase não aparece")


def cenas_registradas(remotion: Path) -> set[str]:
    idx = remotion / "src" / "scenes" / "index.ts"
    txt = idx.read_text(encoding="utf-8") if idx.exists() else ""
    bloco = re.search(r"SCENES[^=]*=\s*\{(.*?)\}", txt, re.S)
    return set(re.findall(r"([A-Za-z_][\w]*)\s*[,:}\n]", bloco.group(1))) if bloco else set()


# ---------------------------------------------------------------- produção

def produzir_corte(p: Plano, projeto: Path, rapido: bool, forcar: bool) -> Path:
    remotion = projeto / "remotion"
    pasta = projeto / "edit" / "cortes" / p.chave
    pasta.mkdir(parents=True, exist_ok=True)
    clip = remotion / "public" / "clips" / p.chave
    clip.mkdir(parents=True, exist_ok=True)
    cut = pasta / "cut.mp4"

    # 1. corte horizontal
    h_edl = sha(p.edl)
    if forcar or not cut.exists() or not em_cache(pasta / ".edl.sha", h_edl):
        print(cor("  · cortando (video-use)…", "cinza"), flush=True)
        (pasta / "edl.json").write_text(json.dumps(p.edl, indent=1), encoding="utf-8")
        run([str(VU_PY), str(VIDEO_USE / "helpers" / "render.py"), str(pasta / "edl.json"), "-o", str(cut), "--no-subtitles"], quieto=True)
        (pasta / ".edl.sha").write_text(h_edl)
    else:
        print(cor("  · corte em cache", "cinza"))

    # 2. Remotion: vídeo, clip.json, legenda, motion
    shutil.copy2(cut, clip / "cut.mp4")
    import cv2

    cap = cv2.VideoCapture(str(cut))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    info = {"video": "cut.mp4", "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)), "fps": round(fps, 3),
            "durationSec": round(n / fps, 3) if n else round(p.duracao, 3)}
    cap.release()
    (clip / "clip.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
    (clip / "captions.json").write_text(json.dumps(p.captions, ensure_ascii=False, indent=1), encoding="utf-8")
    (clip / "motion.json").write_text(json.dumps(p.motion, ensure_ascii=False, indent=1), encoding="utf-8")

    # 3. rosto
    pins = p.corte.get("pin") or []
    h_face = sha(h_edl, pins, "face-v2")  # v2: face.json com tamanho do rosto (fw/fh)
    face = clip / "face.json"
    if forcar or not face.exists() or not em_cache(pasta / ".face.sha", h_face):
        print(cor("  · enquadrando rosto…", "cinza"), flush=True)
        cmd = [sys.executable, str(HERE / "face_track.py"), str(cut), "-o", str(face), "--debug-dir", str(pasta / "verify_face")]
        for pin in pins:
            cmd += ["--pin", pin]
        run(cmd, quieto=True)
        (pasta / ".face.sha").write_text(h_face)
    st = json.loads(face.read_text())["stats"]
    if st["faceRatio"] < 0.6:
        p.avisos.append(f"rosto detectado só em {st['faceRatio']:.0%} das amostras — confira edit/cortes/{p.chave}/verify_face/")

    # 4. render 9:16
    destino = projeto / "publicar" / ("rapido" if rapido else "") / f"{p.chave}.mp4"
    destino.parent.mkdir(parents=True, exist_ok=True)
    h_render = sha(clip / "clip.json", clip / "captions.json", face, clip / "motion.json", h_edl, sha_arvore(remotion / "src"), rapido)
    marca = pasta / (".render-rapido.sha" if rapido else ".render.sha")
    if not forcar and destino.exists() and em_cache(marca, h_render):
        print(cor("  · reel em cache", "cinza"))
    else:
        print(cor("  · renderizando reel 9:16…", "cinza"), flush=True)
        cmd = ["npx", "remotion", "render", f"reel-{p.chave}", str(destino), "--log=error"]
        if rapido:
            cmd += ["--scale=0.5", "--crf=26"]
        run(cmd, cwd=remotion, quieto=True)
        marca.write_text(h_render)

    # 5. folha de revisão
    folha_revisao(destino, p, json.loads(face.read_text())["keys"], pasta / "revisao.png")
    return destino


def folha_revisao(video: Path, p: Plano, face_keys: list[dict], saida: Path) -> None:
    import cv2
    import numpy as np

    tempos = {0.6, max(0.1, p.duracao - 1.0)}
    tempos |= {m["start"] + 0.5 for m in p.motion["motions"] if "start" in m}
    tempos |= {m["at"] + 0.08 for m in p.motion["motions"] if m["type"] == "flash"}
    tempos |= {k["t"] + 0.3 for k in face_keys if k.get("cut")}
    tempos = sorted(t for t in tempos if t < p.duracao)
    if len(tempos) > 12:
        idx = np.linspace(0, len(tempos) - 1, 12).astype(int)
        tempos = [tempos[i] for i in idx]
    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or FPS
    quadros = []
    for t in tempos:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps))
        ok, fr = cap.read()
        if not ok:
            continue
        fr = cv2.resize(fr, (270, 480))
        cv2.rectangle(fr, (0, 0), (110, 30), (0, 0, 0), -1)
        cv2.putText(fr, f"{t:5.1f}s", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
        quadros.append(fr)
    cap.release()
    if not quadros:
        return
    while len(quadros) % 6:
        quadros.append(np.zeros_like(quadros[0]))
    linhas = [np.hstack(quadros[i:i + 6]) for i in range(0, len(quadros), 6)]
    cv2.imwrite(str(saida), np.vstack(linhas))


def resumo_md(rot: Roteiro, planos: list[Plano], erros: dict[str, str]) -> str:
    d = rot.dados
    linhas = [f"# Roteiro — {d.get('titulo_video') or rot.stem}", "",
              f"Fonte: `{d['fonte']}` · {len(planos)} corte(s) para produzir", "",
              "| id | chave | duração | trechos (fonte) | título | nota | motions |",
              "|---|---|---|---|---|---|---|"]
    for p in planos:
        tr = ", ".join(f"{int(a // 60)}:{a % 60:04.1f}–{int(b // 60)}:{b % 60:04.1f}" for a, b in p.ranges)
        linhas.append(f"| {p.id} | `{p.chave}` | {p.total:.0f}s | {tr} | {p.corte.get('titulo', '')} | "
                      f"{p.corte.get('nota', '')} | {len(p.motion['motions'])} |")
    for c in d.get("cortes", []):
        if c["id"] in erros:
            linhas.append(f"| {c['id']} | — | — | — | **erro:** {erros[c['id']]} | | |")
    for p in planos:
        c = p.corte
        linhas += ["", f"## {p.id} — {c.get('titulo', '')}", ""]
        for campo, rotulo in (("gancho", "Gancho"), ("payoff", "Payoff"), ("porque", "Por quê"), ("categoria", "Categoria")):
            if c.get(campo):
                linhas.append(f"- **{rotulo}:** {c[campo]}")
        texto = "".join(x["text"] for x in p.captions).strip()
        linhas += [f"- **Legenda:** {texto[:600]}{'…' if len(texto) > 600 else ''}"]
        for m in p.motion["motions"]:
            t = m.get("start", m.get("at"))
            desc = m.get("text") or m.get("name") or ""
            linhas.append(f"  - {t:5.1f}s `{m['type']}` {desc}")
        for a in p.avisos:
            linhas.append(f"  - ⚠ {a}")
    reservas = [c for c in d.get("cortes", []) if c.get("status") == "reserva"]
    if reservas:
        linhas += ["", "## Reservas (não produzidas)", ""]
        for c in reservas:
            linhas.append(f"- {c['id']} — {c.get('titulo', '')} (nota {c.get('nota', '?')}): {c.get('porque', '')}")
    return "\n".join(linhas) + "\n"


# ---------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("roteiro", type=Path)
    ap.add_argument("--projeto", type=Path, default=Path.cwd())
    ap.add_argument("--validar", action="store_true", help="só confere o roteiro (não renderiza)")
    ap.add_argument("--so", default="", help="ids separados por vírgula")
    ap.add_argument("--rapido", action="store_true", help="render em meia resolução → publicar/rapido/")
    ap.add_argument("--forcar", action="store_true", help="ignora o cache e refaz tudo")
    args = ap.parse_args()

    projeto = args.projeto.resolve()
    try:
        rot = Roteiro(args.roteiro.resolve(), projeto)
    except Problema as e:
        sys.exit(cor(f"erro: {e}", "vermelho"))

    so = {s.strip() for s in args.so.split(",") if s.strip()} or None
    cenas = cenas_registradas(projeto / "remotion")
    planos, erros = [], {}
    print(cor(f"Roteiro: {args.roteiro}  ·  fonte {rot.fonte.name} ({rot.duracao / 60:.1f} min)", "negrito"))
    for c in rot.cortes(so):
        try:
            p = Plano(rot, c)
            faltando = {m["name"] for m in p.motion["motions"] if m["type"] == "scene"} - cenas
            if faltando:
                raise Problema(f"cena(s) não registrada(s) em remotion/src/scenes/index.ts: {', '.join(sorted(faltando))}")
            planos.append(p)
            print(f"  {cor('✓', 'verde')} {p.id} → {p.chave}  {p.total:.1f}s  {len(p.ranges)} trecho(s)  {len(p.motion['motions'])} motion(s)")
            for a in p.avisos:
                print(f"      {cor('⚠', 'amarelo')} {a}")
        except Problema as e:
            erros[c["id"]] = str(e)
            print(f"  {cor('✗', 'vermelho')} {c['id']}: {e}")

    md = args.roteiro.with_suffix(".md")
    try:
        md.write_text(resumo_md(rot, planos, erros), encoding="utf-8")
    except PermissionError:
        pass
    if erros:
        sys.exit(cor(f"\n{len(erros)} corte(s) com erro — corrija o roteiro.", "vermelho"))
    if args.validar:
        print(cor(f"\nRoteiro válido. Resumo em {md}", "verde"))
        return
    if not VU_PY.exists():
        sys.exit(cor(f"erro: video-use não encontrado em {VIDEO_USE}", "vermelho"))

    t0 = time.time()
    feitos = []
    for i, p in enumerate(planos, 1):
        print(cor(f"\n[{i}/{len(planos)}] {p.id} — {p.corte.get('titulo', '')}", "negrito"), flush=True)
        try:
            destino = produzir_corte(p, projeto, args.rapido, args.forcar)
            feitos.append((p, destino))
            print(f"  {cor('✓', 'verde')} {destino.relative_to(projeto)}")
            for a in p.avisos:
                if "rosto" in a:
                    print(f"      {cor('⚠', 'amarelo')} {a}")
        except (Problema, subprocess.CalledProcessError) as e:
            erros[p.id] = str(e)
            print(f"  {cor('✗', 'vermelho')} {e}")

    print(cor(f"\nPronto em {(time.time() - t0) / 60:.1f} min: {len(feitos)} reel(s), {len(erros)} erro(s).", "negrito"))
    for p, d in feitos:
        print(f"  {d.relative_to(projeto)}   revisão: edit/cortes/{p.chave}/revisao.png")
    log = projeto / "edit" / "producao.json"
    log.write_text(json.dumps({
        "roteiro": str(args.roteiro), "quando": time.strftime("%Y-%m-%d %H:%M"), "rapido": args.rapido,
        "reels": [{"id": p.id, "chave": p.chave, "arquivo": str(d.relative_to(projeto)),
                   "revisao": f"edit/cortes/{p.chave}/revisao.png", "avisos": p.avisos} for p, d in feitos],
        "erros": erros,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    if erros:
        sys.exit(1)


if __name__ == "__main__":
    main()
