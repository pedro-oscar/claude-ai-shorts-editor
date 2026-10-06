/** Toda cena é desenhada para esta caixa; o SceneFrame posiciona e escala (layout full ou card). */
export const SCENE_BOX = {width: 940, height: 760} as const;

/** Toda cena recebe as cores do estilo + as props livres de motion.json. */
export type SceneProps = {
  accent: string;
  highlight: string;
};
