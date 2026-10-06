import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, outline} from '../theme';
import type {SceneProps} from './types';

type Side = {label: string; value: string; emoji?: string};

/** Dois lados em contraste (custo × recebe, antes × depois). O lado direito entra depois e "vence". */
export const Comparacao: React.FC<SceneProps & {title?: string; left?: Side; right?: Side}> = ({
  title = '',
  left = {label: 'Antes', value: '?'},
  right = {label: 'Depois', value: '?'},
  accent,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: frame - 4, fps, config: {damping: 14}});
  const b = spring({frame: frame - 22, fps, config: {damping: 11, stiffness: 160}});
  const vs = spring({frame: frame - 14, fps, config: {damping: 9, stiffness: 200}});

  const card = (s: Side, p: number, color: string, fromX: number) => (
    <div
      style={{
        width: 370,
        minHeight: 420,
        padding: '36px 20px',
        borderRadius: 30,
        background: 'rgba(255,255,255,0.06)',
        border: `5px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [fromX, 0])}px)`,
      }}
    >
      {s.emoji ? <div style={{fontSize: 104}}>{s.emoji}</div> : null}
      <div style={{fontWeight: 800, fontSize: 38, color: '#cbd5e1', textTransform: 'uppercase'}}>{s.label}</div>
      <div style={{fontWeight: 900, fontSize: 62, lineHeight: 1, color, ...outline(7)}}>{s.value}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{fontFamily: FONT, alignItems: 'center', justifyContent: 'space-evenly', padding: 30}}>
      <div style={{fontWeight: 900, fontSize: 60, color: '#fff', textTransform: 'uppercase', textAlign: 'center', ...outline(8)}}>
        {title}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        {card(left, a, highlight, -260)}
        <div style={{fontWeight: 900, fontSize: 64, color: accent, transform: `scale(${vs})`, ...outline(8)}}>VS</div>
        {card(right, b, accent, 260)}
      </div>
    </AbsoluteFill>
  );
};
