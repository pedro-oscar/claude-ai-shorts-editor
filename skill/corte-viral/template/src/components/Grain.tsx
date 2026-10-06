import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Granulado + vinheta leves: tira o aspecto "limpo demais" de motion feito por código. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)'}}
      />
      <svg width="100%" height="100%" style={{position: 'absolute', opacity, mixBlendMode: 'overlay'}}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
