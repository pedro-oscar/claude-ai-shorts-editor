import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {SceneFrame} from './motions/SceneFrame';
import {EXEMPLOS, SCENES} from './scenes';
import {FONT, resolveStyle} from './theme';

export type ScenePreviewProps = {name: string; layout: 'card' | 'full'};

/** Pré-visualização de uma cena com as props de EXEMPLOS, no layout pedido, sobre um fundo neutro. */
export const ScenePreview: React.FC<ScenePreviewProps> = ({name, layout}) => {
  const {durationInFrames} = useVideoConfig();
  const Scene = SCENES[name];
  const style = resolveStyle(undefined);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #5b6170 0%, #2b2f38 100%)'}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 260}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 36, color: 'rgba(255,255,255,0.35)'}}>
          prévia: {name} ({layout})
        </div>
      </AbsoluteFill>
      <Sequence durationInFrames={durationInFrames} layout="none">
        <SceneFrame layout={layout}>
          {Scene ? <Scene {...(EXEMPLOS[name]?.props ?? {})} accent={style.accent} highlight={style.highlight} /> : null}
        </SceneFrame>
      </Sequence>
    </AbsoluteFill>
  );
};
