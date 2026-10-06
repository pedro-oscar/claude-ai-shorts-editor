import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../theme';
import type {ClipInfo, FaceTrack, Motion} from '../types';
import {cropAt, shakeAt} from './camera';

/**
 * Vídeo horizontal (ou qualquer proporção) preenchendo 1080×1920, com o rosto rastreado
 * mantido no centro. Nunca divide a tela: é sempre um único recorte em altura cheia.
 * `fadeOut` (s): o áudio baixa no fim para o reel não terminar seco.
 */
export const FaceCropVideo: React.FC<{
  clipId: string;
  clip: ClipInfo;
  face: FaceTrack;
  motions: Motion[];
  fadeOut: number;
}> = ({clipId, clip, face, motions, fadeOut}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H, durationInFrames} = useVideoConfig();
  const {left, top, vw, vh} = cropAt(clip, face, motions, frame, fps, W, H);
  const shake = shakeAt(motions, frame, fps);
  const fimAudio = Math.round((fadeOut + 0.25) * fps);

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
          <OffthreadVideo
            src={staticFile(`clips/${clipId}/${clip.video}`)}
            style={{width: '100%', height: '100%'}}
            volume={(f) =>
              fadeOut > 0
                ? interpolate(f, [durationInFrames - fimAudio, durationInFrames - 1], [1, 0], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                : 1
            }
          />
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
