export type SceneSymbol = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
  readonly delay: number;
};

type Ring = {
  readonly radius: number;
  readonly count: number;
  readonly size: number;
  readonly opacity: number;
};

export const SCENE_WIDTH = 240;
export const SCENE_HEIGHT = 42;
export const SCENE_FOCUS = { x: 196, y: SCENE_HEIGHT / 2 } as const;

const RINGS: readonly Ring[] = [
  { radius: 30, count: 8, size: 11, opacity: 0.75 },
  { radius: 54, count: 12, size: 9.5, opacity: 0.5 },
  { radius: 80, count: 16, size: 8.5, opacity: 0.32 },
  { radius: 108, count: 20, size: 7.5, opacity: 0.18 },
];

const OVAL = 1.7;
const TWINKLE_SPREAD = 4;
const MARGIN = 6;

const noise = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const visible = ({ x, y, size }: SceneSymbol): boolean =>
  x > -size && x < SCENE_WIDTH + size && y > -MARGIN && y < SCENE_HEIGHT + MARGIN;

export const SCENE_SYMBOLS: readonly SceneSymbol[] = RINGS.flatMap(({ radius, count, size, opacity }, ring) =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + (ring % 2 ? Math.PI / count : 0);
    const seed = ring * 31 + index;
    return {
      x: SCENE_FOCUS.x + Math.cos(angle) * radius * OVAL,
      y: SCENE_FOCUS.y + Math.sin(angle) * radius * 0.5,
      size: size * (0.85 + noise(seed) * 0.3),
      opacity,
      delay: noise(seed + 7) * TWINKLE_SPREAD,
    };
  }),
).filter(visible);
