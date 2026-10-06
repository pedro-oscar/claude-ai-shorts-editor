import {Easing, interpolate, spring} from 'remotion';
import type {ClipInfo, FaceKey, FaceTrack, Motion} from '../types';

const ease = Easing.bezier(0.45, 0, 0.55, 1);

/** Tamanho de rosto assumido quando face.json não traz fw/fh (fração do quadro original). */
const FW_PADRAO = 0.17;
const FH_PADRAO = 0.3;

type Face = {cx: number; cy: number; fw: number; fh: number};

const completo = (k: FaceKey): Face => ({cx: k.cx, cy: k.cy, fw: k.fw ?? FW_PADRAO, fh: k.fh ?? FH_PADRAO});

/** Rosto no tempo t. Entre keys normais interpola; antes de uma key com cut=true, segura (troca de câmera seca). */
export const faceAt = (keys: FaceKey[], t: number): Face => {
  if (keys.length === 0) return {cx: 0.5, cy: 0.4, fw: FW_PADRAO, fh: FH_PADRAO};
  if (t <= keys[0].t) return completo(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = completo(keys[i]);
    const b = completo(keys[i + 1]);
    if (t >= keys[i].t && t < keys[i + 1].t) {
      if (keys[i + 1].cut) return a;
      const p = ease((t - keys[i].t) / Math.max(1e-6, keys[i + 1].t - keys[i].t));
      return {
        cx: a.cx + (b.cx - a.cx) * p,
        cy: a.cy + (b.cy - a.cy) * p,
        fw: a.fw + (b.fw - a.fw) * p,
        fh: a.fh + (b.fh - a.fh) * p,
      };
    }
  }
  return completo(keys[keys.length - 1]);
};

/** Zoom "punch" acumulado dos motions de zoom ativos. */
export const zoomAt = (motions: Motion[], frame: number, fps: number): number => {
  let z = 1;
  for (const m of motions) {
    if (m.type !== 'zoom') continue;
    const s = Math.round(m.start * fps);
    const e = Math.round(m.end * fps);
    if (frame < s || frame > e + 12) continue;
    const target = m.scale ?? 1.15;
    const inP = spring({frame: frame - s, fps, config: {damping: 14, stiffness: 160}});
    const outP = interpolate(frame, [e, e + 12], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });
    z *= 1 + (target - 1) * inP * outP;
  }
  return z;
};

/** Tremida de câmera: soma de senoides (determinística por frame) com envelope de entrada/saída. */
export const shakeAt = (motions: Motion[], frame: number, fps: number) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const m of motions) {
    if (m.type !== 'shake') continue;
    const s = Math.round(m.start * fps);
    const e = Math.round(m.end * fps);
    if (frame < s || frame > e) continue;
    const env = interpolate(frame, [s, s + 3, e - 4, e], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const k = (m.intensity ?? 1) * env;
    x += k * (14 * Math.sin(frame * 1.9) + 7 * Math.sin(frame * 4.3 + 1));
    y += k * (11 * Math.cos(frame * 2.3) + 6 * Math.sin(frame * 5.1 + 2));
    r += k * 0.6 * Math.sin(frame * 3.7);
  }
  return {x, y, r};
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Onde o vídeo original fica dentro do quadro 9:16 neste frame (mesma conta do FaceCropVideo). */
export const cropAt = (clip: ClipInfo, face: FaceTrack, motions: Motion[], frame: number, fps: number, W: number, H: number) => {
  const f = faceAt(face.keys, frame / fps);
  const zoom = zoomAt(motions, frame, fps);
  const scale = Math.max(W / clip.width, H / clip.height) * zoom;
  const vw = clip.width * scale;
  const vh = clip.height * scale;
  // Rosto no centro horizontal e a ~40% da altura (regra dos terços), sem mostrar borda.
  const left = clamp(W / 2 - f.cx * vw, W - vw, 0);
  const top = clamp(H * 0.4 - f.cy * vh, H - vh, 0);
  return {left, top, vw, vh, face: f};
};

export type Caixa = {top: number; bottom: number; left: number; right: number};

/**
 * Caixa da CABEÇA de quem está em foco, em pixels do reel. O detector pega da sobrancelha ao
 * queixo; a caixa estende para cabelo (acima) e pescoço (abaixo), que também não devem ser cobertos.
 */
export const cabecaAt = (clip: ClipInfo, face: FaceTrack, motions: Motion[], frame: number, fps: number, W: number, H: number): Caixa => {
  const c = cropAt(clip, face, motions, frame, fps, W, H);
  const x = c.left + c.face.cx * c.vw;
  const y = c.top + c.face.cy * c.vh;
  const fw = c.face.fw * c.vw;
  const fh = c.face.fh * c.vh;
  return {top: y - 0.95 * fh, bottom: y + 0.8 * fh, left: x - 0.8 * fw, right: x + 0.8 * fw};
};
