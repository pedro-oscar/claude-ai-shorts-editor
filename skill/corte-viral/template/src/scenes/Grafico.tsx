import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, outline} from '../theme';
import type {SceneProps} from './types';

type Bar = {label: string; value: number; color?: string};

/** Barras crescendo em sequência. Ex.: geração de caixa 2022 → 2025. */
export const Grafico: React.FC<
  SceneProps & {title?: string; bars?: Bar[]; prefix?: string; suffix?: string}
> = ({title = '', bars = [], prefix = '', suffix = '', accent, highlight}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(1, ...bars.map((b) => b.value));
  const chartH = 430;
  const gap = 40;
  const barW = Math.min(200, (860 - gap * (bars.length - 1)) / Math.max(1, bars.length));

  return (
    <AbsoluteFill style={{fontFamily: FONT, alignItems: 'center', justifyContent: 'space-between', padding: '44px 40px 36px'}}>
      <div style={{fontWeight: 900, fontSize: 60, color: '#fff', textTransform: 'uppercase', textAlign: 'center', ...outline(8)}}>
        {title}
      </div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap, height: chartH + 140}}>
        {bars.map((b, i) => {
          const delay = 8 + i * 9;
          const p = spring({frame: frame - delay, fps, config: {damping: 16, stiffness: 110}});
          const h = (b.value / max) * chartH * p;
          const n = interpolate(frame - delay, [0, 24], [0, b.value], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const isLast = i === bars.length - 1;
          const color = b.color ?? (isLast ? accent : '#3b82f6');
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: barW}}>
              <div style={{fontWeight: 900, fontSize: 46, color: isLast ? highlight : '#fff', opacity: p, marginBottom: 10, whiteSpace: 'nowrap', ...outline(7)}}>
                {prefix}
                {Math.round(n).toLocaleString('pt-BR')}
                {suffix}
              </div>
              <div style={{width: '100%', height: h, borderRadius: '16px 16px 6px 6px', background: color, boxShadow: `0 0 44px ${color}66`}} />
              <div style={{marginTop: 12, fontWeight: 800, fontSize: 38, color: '#cbd5e1'}}>{b.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
