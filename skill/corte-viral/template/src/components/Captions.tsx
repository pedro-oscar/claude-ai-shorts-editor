import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, normalizeWord, outline} from '../theme';
import type {MotionStyle} from '../types';

/**
 * Legenda palavra a palavra estilo TikTok/Reels: poucas palavras por página,
 * palavra falada em `highlight`, palavras de `emphasis` em `accent`.
 */
export const Captions: React.FC<{
  captions: Caption[];
  style: Required<MotionStyle>;
  emphasis: string[];
}> = ({captions, style, emphasis}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: style.captionGroupMs,
        breakOnSilenceAfterMilliseconds: 350,
      }).pages,
    [captions, style.captionGroupMs],
  );
  const emph = useMemo(() => new Set(emphasis.map(normalizeWord)), [emphasis]);

  const idx = pages.findIndex((p, i) => {
    const end = Math.min(p.startMs + p.durationMs, pages[i + 1]?.startMs ?? Infinity);
    return ms >= p.startMs && ms < end;
  });
  if (idx === -1) return null;
  const page = pages[idx];

  const local = frame - Math.round((page.startMs / 1000) * fps);
  const pop = spring({frame: local, fps, config: {damping: 12, stiffness: 220, mass: 0.6}});
  const scale = interpolate(pop, [0, 1], [0.82, 1]);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: height * style.captionY,
          transform: `translateY(-50%) scale(${scale})`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 30,
          rowGap: 4,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 78,
          lineHeight: 1.08,
          textAlign: 'center',
          textTransform: style.uppercase ? 'uppercase' : 'none',
          ...outline(14),
          filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))',
        }}
      >
        {page.tokens.map((tok, i) => {
          const active = ms >= tok.fromMs && ms < tok.toMs;
          const isEmph = emph.has(normalizeWord(tok.text));
          const color = isEmph ? style.accent : active ? style.highlight : '#FFFFFF';
          return (
            <span
              key={i}
              style={{
                color,
                display: 'inline-block',
                transform: active ? 'scale(1.04)' : undefined,
                whiteSpace: 'pre',
              }}
            >
              {tok.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
