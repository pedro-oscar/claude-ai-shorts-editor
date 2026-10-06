import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {SCENE_BOX} from '../scenes/types';
import type {Placement} from './layout';
import {useEnterExit} from './Overlays';

/**
 * Moldura de uma cena ilustrada. Toda cena é desenhada numa caixa fixa SCENE_BOX (940×760).
 * - full: fundo escuro cobrindo o vídeo (b-roll animado; o áudio do corte continua) e a caixa
 *   ampliada acima da legenda.
 * - card: painel flutuante no espaço livre escolhido por planejarLayout (acima ou abaixo da
 *   cabeça), na escala que couber. Nunca em cima do rosto; não é tela dividida.
 */
export const SceneFrame: React.FC<{layout: 'full' | 'card'; p?: Placement; children: React.ReactNode}> = ({
  layout,
  p,
  children,
}) => {
  const {enter, exit} = useEnterExit();
  const {height} = useVideoConfig();

  if (layout === 'full') {
    const s = 1.12 * interpolate(enter, [0, 1], [1.08, 1]);
    return (
      <AbsoluteFill
        style={{
          opacity: Math.min(enter * 1.5, exit),
          background: 'radial-gradient(circle at 50% 35%, #1b2130 0%, #0b0d12 70%)',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: SCENE_BOX.width,
            height: SCENE_BOX.height,
            top: height * 0.36 - SCENE_BOX.height / 2,
            transform: `scale(${s})`,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    );
  }

  const area = p?.area ?? {top: 170, height: SCENE_BOX.height};
  const escala = p?.scale ?? 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: area.top,
          height: area.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: SCENE_BOX.width,
            height: SCENE_BOX.height,
            position: 'relative',
            borderRadius: 36,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #161a24 0%, #0b0d12 100%)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
            border: '4px solid rgba(255,255,255,0.12)',
            opacity: exit,
            transform: `translateY(${interpolate(enter, [0, 1], [-80, 0])}px) scale(${escala * interpolate(enter, [0, 1], [0.9, 1])})`,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
