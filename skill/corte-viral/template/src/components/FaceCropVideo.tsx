import React from 'react';
import {AbsoluteFill, Freeze, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../theme';
import type {ClipInfo, FaceTrack, Motion} from '../types';
import {cropAt, shakeAt} from './camera';

/**
 * Vídeo horizontal (ou qualquer proporção) preenchendo 1080×1920, com o rosto rastreado
 * mantido no centro. Nunca divide a tela: é sempre um único recorte em altura cheia.
 * Saída sem corte seco: o áudio só começa a baixar depois da última palavra (`fimFala`, s) e chega
 * a zero no fim do cut.mp4; se a composição for mais longa que o vídeo, o último quadro fica congelado.
 * `fadeOut` 0 desliga o fade de áudio.
 */
export const FaceCropVideo: React.FC<{
  clipId: string;
  clip: ClipInfo;
  face: FaceTrack;
  motions: Motion[];
  fadeOut: number;
  fimFala: number;
}> = ({clipId, clip, face, motions, fadeOut, fimFala}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const {left, top, vw, vh} = cropAt(clip, face, motions, frame, fps, W, H);
  const shake = shakeAt(motions, frame, fps);
  const clipF = Math.max(2, Math.round(clip.durationSec * fps));
  const ultimoF = clipF - 1;
  const audioIni = Math.min(Math.round(fimFala * fps) + Math.round(0.15 * fps), ultimoF - 1);
  const congelado = frame >= ultimoF;

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: vw,
          height: vh,
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg)`,
        }}
      >
        {clip.video ? (
          <Freeze frame={ultimoF} active={congelado}>
            <OffthreadVideo
              src={staticFile(`clips/${clipId}/${clip.video}`)}
              style={{width: '100%', height: '100%'}}
              muted={congelado}
              volume={(f) =>
                fadeOut > 0
                  ? interpolate(f, [audioIni, ultimoF], [1, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 1
              }
            />
          </Freeze>
        ) : (
          <Placeholder />
        )}
      </div>
    </AbsoluteFill>
  );
};

const Placeholder: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(circle at 50% 40%, #3a3f4b 0%, #14161b 60%)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#6b7280', letterSpacing: 4}}>
      SEM VÍDEO — rode prepare_reel.py
    </div>
  </AbsoluteFill>
);
