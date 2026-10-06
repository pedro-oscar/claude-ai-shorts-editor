import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, outline} from '../theme';
import type {SceneProps} from './types';

/**
 * Exemplo de ILUSTRAÇÃO desenhada em SVG (o papel que as imagens do Higgsfield faziam no vídeo):
 * notas de dinheiro caindo e empilhando, com um rótulo. Use como modelo para novas cenas.
 */
export const Dinheiro: React.FC<SceneProps & {label?: string; notas?: number}> = ({label = '', notas = 9, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const labelIn = spring({frame: frame - 10, fps, config: {damping: 10}});

  return (
    <AbsoluteFill style={{fontFamily: FONT, alignItems: 'center'}}>
      <svg width="100%" height="100%" viewBox="0 0 940 760">
        <ellipse cx={470} cy={700} rx={330} ry={34} fill="#000" opacity={0.35} />
        {Array.from({length: notas}).map((_, i) => {
          const p = spring({frame: frame - i * 4, fps, config: {damping: 12, stiffness: 120}});
          const y = interpolate(p, [0, 1], [-200, 650 - i * 30]);
          const rot = interpolate(p, [0, 1], [i % 2 ? 40 : -35, (i % 3) - 1]);
          const x = 470 + ((i * 37) % 30) - 15;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <rect x={-250} y={-62} width={500} height={124} rx={14} fill="#2f8f4e" stroke="#14532d" strokeWidth={7} />
              <rect x={-222} y={-42} width={444} height={84} rx={10} fill="none" stroke="#86efac" strokeWidth={4} opacity={0.7} />
              <circle cx={0} cy={0} r={34} fill="#86efac" opacity={0.85} />
              <text x={0} y={15} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#14532d">$</text>
              <text x={-200} y={-10} fontFamily={FONT} fontWeight={900} fontSize={28} fill="#dcfce7">100</text>
              <text x={150} y={38} fontFamily={FONT} fontWeight={900} fontSize={28} fill="#dcfce7">100</text>
            </g>
          );
        })}
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: 40,
            fontWeight: 900,
            fontSize: 80,
            color: accent,
            textTransform: 'uppercase',
            textAlign: 'center',
            transform: `scale(${labelIn})`,
            ...outline(12),
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
