import type {Caption} from '@remotion/captions';

/** clip.json — escrito por prepare_reel.py */
export type ClipInfo = {
  /** arquivo dentro de public/clips/<id>/ ou null (mostra um placeholder) */
  video: string | null;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
};

/**
 * face.json — escrito por face_track.py. cx/cy = centro do rosto, fw/fh = tamanho do rosto,
 * tudo normalizado (0–1) no quadro original. fw/fh faltam em face.json antigos (versão 1).
 */
export type FaceKey = {t: number; cx: number; cy: number; fw?: number; fh?: number; cut?: boolean};
export type FaceTrack = {keys: FaceKey[]};

type Span = {start: number; end: number};

/** motion.json — escrito pelo Claude seguindo references/motion-guide.md da skill */
export type Motion =
  | (Span & {type: 'title'; text: string; color?: string})
  | (Span & {type: 'keyword'; text: string; color?: string; position?: 'top' | 'center'})
  | (Span & {
      type: 'counter';
      from: number;
      to: number;
      prefix?: string;
      suffix?: string;
      decimals?: number;
      label?: string;
    })
  | (Span & {type: 'shake'; intensity?: number})
  | (Span & {type: 'zoom'; scale?: number})
  | (Span & {
      type: 'scene';
      name: string;
      layout?: 'full' | 'card';
      props?: Record<string, unknown>;
    })
  | {type: 'flash'; at: number; color?: string};

export type MotionStyle = {
  /** cor de destaque (palavras-chave, títulos). Padrão vermelho */
  accent?: string;
  /** cor da palavra sendo falada na legenda. Padrão amarelo */
  highlight?: string;
  /** centro vertical da legenda (0–1 da altura). Padrão 0.66, fora da UI do Reels/TikTok */
  captionY?: number;
  /** granulado de filme por cima de tudo. Padrão true */
  grain?: boolean;
  /** ms para agrupar palavras numa "página" de legenda. Padrão 900 */
  captionGroupMs?: number;
  /** legenda em CAIXA ALTA. Padrão true */
  uppercase?: boolean;
  /** segundos de saída suave no fim do reel (áudio baixa e imagem escurece). Padrão 0.5; 0 desliga */
  fadeOut?: number;
};

export type MotionPlan = {
  style?: MotionStyle;
  /** palavras que aparecem na cor accent na legenda (comparação sem acento/caixa) */
  emphasis?: string[];
  motions: Motion[];
  /** fim do reel, calculado pelo produzir.py */
  saida?: Saida;
};

export type Saida = {
  /** s (linha do tempo do corte) em que termina a última palavra; o fade só começa depois dela */
  fimFala: number;
  /** s de último quadro congelado, em silêncio, depois do fim do cut.mp4 */
  congelar: number;
};

export type ReelData = {
  clipId: string;
  clip: ClipInfo;
  captions: Caption[];
  face: FaceTrack;
  plan: MotionPlan;
};

export type ReelProps = {
  clipId: string;
  data?: ReelData;
};
