export type Rgb = readonly [number, number, number];
export type Hsl = readonly [number, number, number];

export const rgbOf = (value: number): Rgb => [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];

const valueOf = ([r, g, b]: Rgb): number => ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);

export const hex = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

export const mix = (a: number, b: number, amount: number): number => {
  const [ar, ag, ab] = rgbOf(a);
  const [br, bg, bb] = rgbOf(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return valueOf([lerp(ar, br), lerp(ag, bg), lerp(ab, bb)]);
};

export const toHsl = (value: number): Hsl => {
  const [r, g, b] = rgbOf(value).map((c) => c / 255) as unknown as Rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, lightness * 100];
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [(hue * 60 + 360) % 360, saturation * 100, lightness * 100];
};
