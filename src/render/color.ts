export type Rgb = readonly [number, number, number];

export const rgbOf = (value: number): Rgb => [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];

export const valueOf = ([r, g, b]: Rgb): number => ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);

export const hex = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

export const mix = (a: number, b: number, amount: number): number => {
  const [ar, ag, ab] = rgbOf(a);
  const [br, bg, bb] = rgbOf(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return valueOf([lerp(ar, br), lerp(ag, bg), lerp(ab, bb)]);
};

export const saturation = (value: number): number => {
  const channels = rgbOf(value);
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  return max === 0 ? 0 : (max - min) / max;
};

const channel =(c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (value: number): number => {
  const [r, g, b] = rgbOf(value).map(channel) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: number, b: number): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const legible = (accent: number, background: number, minimum = 3): number => {
  const target = luminance(background) > 0.4 ? 0x000000 : 0xffffff;
  let candidate = accent;
  for (let step = 0; step < 10 && contrast(candidate, background) < minimum; step += 1) candidate = mix(candidate, target, 0.15);
  return candidate;
};
