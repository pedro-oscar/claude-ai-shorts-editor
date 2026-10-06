import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, outline} from '../theme';
import type {Placement} from './layout';

/** Entrada com mola e saída nos últimos 8 frames. `frame` é local à Sequence. */
export const useEnterExit = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 13, stiffness: 180}});
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return {frame, fps, enter, exit, durationInFrames};
};

/** Coloca o elemento centrado na área livre escolhida por planejarLayout, na escala calculada. */
export const Slot: React.FC<{p: Placement; children: React.ReactNode}> = ({p, children}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: p.area.top,
        height: p.area.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{transform: `scale(${p.scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {children}
      </div>
    </div>
  </AbsoluteFill>
);

/** Título do gancho numa tarja de cor. */
export const Title: React.FC<{text: string; color: string}> = ({text, color}) => {
  const {enter, exit} = useEnterExit();
  return (
    <div
      style={{
        transform: `translateY(${interpolate(enter, [0, 1], [-60, 0])}px) rotate(-2deg)`,
        opacity: enter * exit,
        background: color,
        padding: '18px 34px',
        borderRadius: 14,
        maxWidth: 940,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 64,
        lineHeight: 1.05,
        color: '#fff',
        textAlign: 'center',
        textTransform: 'uppercase',
        boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
      }}
    >
      {text}
    </div>
  );
};

/** Palavra-chave que "bate" na tela: começa grande e assenta com mola. */
export const Keyword: React.FC<{text: string; color: string}> = ({text, color}) => {
  const {enter, exit} = useEnterExit();
  const scale = interpolate(enter, [0, 1], [1.7, 1]);
  return (
    <div
      style={{
        transform: `scale(${scale}) rotate(${interpolate(enter, [0, 1], [-6, -3])}deg)`,
        opacity: Math.min(1, enter * 1.4) * exit,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 120,
        lineHeight: 0.95,
        letterSpacing: -2,
        color,
        textAlign: 'center',
        textTransform: 'uppercase',
        maxWidth: 980,
        ...outline(18),
        filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.5))',
      }}
    >
      {text}
    </div>
  );
};

/** Número contando de `from` até `to`, com rótulo opcional. */
export const Counter: React.FC<{
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
  color: string;
}> = ({from, to, prefix = '', suffix = '', decimals = 0, label, color}) => {
  const {frame, enter, exit, durationInFrames} = useEnterExit();
  const p = interpolate(frame, [0, Math.min(durationInFrames - 8, 36)], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const value = (from + (to - from) * p).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div
      style={{
        transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
        opacity: enter * exit,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT,
      }}
    >
      <div style={{fontWeight: 900, fontSize: 150, lineHeight: 1, color, letterSpacing: -3, ...outline(18)}}>
        {prefix}
        {value}
        {suffix}
      </div>
      {label ? (
        <div
          style={{
            marginTop: 10,
            background: '#000',
            color: '#fff',
            fontWeight: 800,
            fontSize: 44,
            padding: '8px 22px',
            borderRadius: 10,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

/** Flash curto para marcar uma virada. */
export const Flash: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 1, 5], [0, 0.85, 0], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: color, opacity: o}} />;
};
