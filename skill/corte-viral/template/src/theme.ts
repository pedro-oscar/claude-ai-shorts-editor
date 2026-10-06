import montserrat700 from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2';
import montserrat800 from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2';
import montserrat900 from '@fontsource/montserrat/files/montserrat-latin-900-normal.woff2';
import {loadFont} from '@remotion/fonts';
import type {MotionStyle} from './types';

// Fonte empacotada no bundle: o render não depende de internet (Google Fonts pode estar bloqueado).
export const FONT = 'Montserrat';
for (const [weight, url] of [
  ['700', montserrat700],
  ['800', montserrat800],
  ['900', montserrat900],
] as const) {
  loadFont({family: FONT, url, weight});
}

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const resolveStyle = (s: MotionStyle | undefined): Required<MotionStyle> => ({
  accent: s?.accent ?? '#FF2D2D',
  highlight: s?.highlight ?? '#FFE600',
  captionY: s?.captionY ?? 0.66,
  grain: s?.grain ?? true,
  captionGroupMs: s?.captionGroupMs ?? 900,
  uppercase: s?.uppercase ?? true,
  fadeOut: s?.fadeOut ?? 0.5,
});

/** Contorno preto grosso legível sobre qualquer fundo. */
export const outline = (px: number) => ({
  WebkitTextStroke: `${px}px #000`,
  paintOrder: 'stroke fill' as const,
});

export const normalizeWord = (w: string) =>
  w
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}$%]/gu, '')
    .toLowerCase();
