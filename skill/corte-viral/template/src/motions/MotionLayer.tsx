import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {SCENES} from '../scenes';
import type {Motion, MotionStyle} from '../types';
import type {Placement} from './layout';
import {Counter, Flash, Keyword, Slot, Title} from './Overlays';
import {SceneFrame} from './SceneFrame';

/**
 * Renderiza os motions de motion.json nas posições calculadas por planejarLayout.
 * zoom/shake não aparecem aqui: agem na câmera (FaceCropVideo).
 */
export const MotionLayer: React.FC<{
  motions: Motion[];
  placements: (Placement | null)[];
  style: Required<MotionStyle>;
  /** true = só cenas em tela cheia (ficam por baixo da legenda); false = o resto */
  fullScenesOnly: boolean;
}> = ({motions, placements, style, fullScenesOnly}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {motions.map((m, i) => {
        const p = placements[i];
        const isFull = m.type === 'scene' && p?.layout === 'full';
        if (isFull !== fullScenesOnly) return null;

        if (m.type === 'flash') {
          return (
            <Sequence key={i} from={Math.round(m.at * fps)} durationInFrames={6} layout="none">
              <Flash color={m.color ?? '#ffffff'} />
            </Sequence>
          );
        }
        if (m.type === 'zoom' || m.type === 'shake' || !p) return null;

        const from = Math.round(m.start * fps);
        const dur = Math.max(1, Math.round((m.end - m.start) * fps));
        let el: React.ReactNode = null;
        switch (m.type) {
          case 'title':
            el = (
              <Slot p={p}>
                <Title text={m.text} color={m.color ?? style.accent} />
              </Slot>
            );
            break;
          case 'keyword':
            el = (
              <Slot p={p}>
                <Keyword text={m.text} color={m.color ?? style.highlight} />
              </Slot>
            );
            break;
          case 'counter':
            el = (
              <Slot p={p}>
                <Counter {...m} color={style.highlight} />
              </Slot>
            );
            break;
          case 'scene': {
            const Scene = SCENES[m.name];
            el = (
              <SceneFrame layout={p.layout ?? 'card'} p={p}>
                {Scene ? (
                  <Scene {...(m.props ?? {})} accent={style.accent} highlight={style.highlight} />
                ) : (
                  <div style={{color: 'red', fontSize: 40, padding: 40}}>Cena "{m.name}" não registrada em src/scenes/index.ts</div>
                )}
              </SceneFrame>
            );
            break;
          }
        }
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            {el}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
