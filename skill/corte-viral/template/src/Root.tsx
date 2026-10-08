import React from 'react';
import {CalculateMetadataFunction, Composition, getStaticFiles, staticFile} from 'remotion';
import {Reel} from './Reel';
import {ScenePreview, type ScenePreviewProps} from './ScenePreview';
import {EXEMPLOS, SCENES} from './scenes';
import {FPS, HEIGHT, WIDTH} from './theme';
import type {ReelData, ReelProps} from './types';

const loadJson = async <T,>(path: string, fallback?: T): Promise<T> => {
  const res = await fetch(staticFile(path));
  if (!res.ok) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Não encontrei public/${path} — rode prepare_reel.py para este corte.`);
  }
  return (await res.json()) as T;
};

const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({props}) => {
  const base = `clips/${props.clipId}`;
  const data: ReelData = {
    clipId: props.clipId,
    clip: await loadJson(`${base}/clip.json`),
    captions: await loadJson(`${base}/captions.json`, []),
    face: await loadJson(`${base}/face.json`, {keys: []}),
    plan: await loadJson(`${base}/motion.json`, {motions: []}),
  };
  return {
    durationInFrames: Math.max(1, Math.ceil((data.clip.durationSec + (data.plan.saida?.congelar ?? 0)) * FPS)),
    props: {...props, data},
  };
};

/** Um corte = uma pasta public/clips/<id>/ com clip.json. Cada uma vira a composição "reel-<id>". */
const clipIds = (): string[] => {
  const ids = getStaticFiles()
    .map((f) => f.name.replace(/\\/g, '/').match(/^clips\/([^/]+)\/clip\.json$/)?.[1])
    .filter((x): x is string => Boolean(x));
  return [...new Set(ids)].sort();
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {clipIds().map((id) => (
        <Composition
          key={id}
          id={`reel-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`}
          component={Reel}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={FPS * 10}
          defaultProps={{clipId: id} as ReelProps}
          calculateMetadata={calculateMetadata}
        />
      ))}
      {Object.keys(SCENES).map((name) => (
        <Composition
          key={`cena-${name}`}
          id={`cena-${name.replace(/[^a-zA-Z0-9-]/g, '-')}`}
          component={ScenePreview}
          width={WIDTH}
          height={HEIGHT}
          fps={FPS}
          durationInFrames={Math.round((EXEMPLOS[name]?.dur ?? 4) * FPS)}
          defaultProps={{name, layout: 'card'} as ScenePreviewProps}
        />
      ))}
    </>
  );
};
