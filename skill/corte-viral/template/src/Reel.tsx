import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions} from './components/Captions';
import {FaceCropVideo} from './components/FaceCropVideo';
import {Grain} from './components/Grain';
import {planejarLayout} from './motions/layout';
import {MotionLayer} from './motions/MotionLayer';
import {resolveStyle} from './theme';
import type {ReelData, ReelProps} from './types';

/**
 * Camadas, de baixo para cima:
 * 1. vídeo recortado no rosto (zoom/shake aplicados aqui)
 * 2. cenas em tela cheia (b-roll ilustrado)
 * 3. granulado
 * 4. legenda
 * 5. títulos, palavras-chave, contadores, cards e flashes, sempre fora da cabeça em foco
 * 6. saída suave: depois da última palavra o áudio baixa (FaceCropVideo), o último quadro congela
 *    se o respiro natural for curto, e a imagem escurece
 */

/** s em que a fala termina (linha do tempo do corte). motion.json antigo, sem `saida`: comportamento anterior */
const fimDaFala = (data: ReelData, fadeOut: number): number =>
  data.plan.saida?.fimFala ?? Math.max(0, data.clip.durationSec - fadeOut - 0.25);

export const Reel: React.FC<ReelProps> = ({clipId, data}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const style = resolveStyle(data?.plan.style);
  const motions = data?.plan.motions ?? [];
  const placements = useMemo(
    () => (data ? planejarLayout(motions, data.clip, data.face, style, fps, width, height) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, fps, width, height],
  );
  if (!data) return null; // calculateMetadata sempre preenche

  // escurece nos últimos `fadeOut` s, mas nunca antes de a última palavra terminar
  const fimF = Math.round(style.fadeOut * fps);
  const falaF = Math.round(fimDaFala(data, style.fadeOut) * fps);
  const escIni = Math.min(Math.max(falaF + Math.round(0.1 * fps), durationInFrames - fimF), durationInFrames - 2);
  const escurecer =
    fimF > 0
      ? interpolate(frame, [escIni, durationInFrames - 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <FaceCropVideo
        clipId={clipId}
        clip={data.clip}
        face={data.face}
        motions={motions}
        fadeOut={style.fadeOut}
        fimFala={fimDaFala(data, style.fadeOut)}
      />
      <MotionLayer motions={motions} placements={placements} style={style} fullScenesOnly />
      {style.grain ? <Grain /> : null}
      <Captions captions={data.captions} style={style} emphasis={data.plan.emphasis ?? []} />
      <MotionLayer motions={motions} placements={placements} style={style} fullScenesOnly={false} />
      {escurecer > 0 ? <AbsoluteFill style={{backgroundColor: '#000', opacity: escurecer}} /> : null}
    </AbsoluteFill>
  );
};
