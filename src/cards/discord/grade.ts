import { toHsl } from "@/render";

export type ColorGrade = {
  readonly hueRotate: number;
  readonly saturate: number;
  readonly brightness: number;
  readonly contrast: number;
};

const SATURATE_RANGE = [0.35, 1.8] as const;
const BRIGHTNESS_RANGE = [0.75, 1.35] as const;
const CONTRAST_RANGE = [0.9, 1.15] as const;
const BRIGHTNESS_DAMPING = 0.5;
const CONTRAST_FOLLOW = 0.15;
const MIN_CHANNEL = 1;
const NEUTRAL_EPSILON = 0.01;

const clamp = (value: number, [min, max]: readonly [number, number]): number => Math.min(max, Math.max(min, value));

export const colorGrade = (from: number, to: number): ColorGrade => {
  const [fromHue, fromSaturation, fromLightness] = toHsl(from);
  const [toHue, toSaturation, toLightness] = toHsl(to);
  const saturate = clamp(toSaturation / Math.max(fromSaturation, MIN_CHANNEL), SATURATE_RANGE);
  return {
    hueRotate: ((toHue - fromHue + 540) % 360) - 180,
    saturate,
    brightness: clamp((toLightness / Math.max(fromLightness, MIN_CHANNEL)) ** BRIGHTNESS_DAMPING, BRIGHTNESS_RANGE),
    contrast: clamp(1 + (saturate - 1) * CONTRAST_FOLLOW, CONTRAST_RANGE),
  };
};

const isNeutral = ({ hueRotate, saturate, brightness, contrast }: ColorGrade): boolean =>
  Math.abs(hueRotate) < NEUTRAL_EPSILON &&
  Math.abs(saturate - 1) < NEUTRAL_EPSILON &&
  Math.abs(brightness - 1) < NEUTRAL_EPSILON &&
  Math.abs(contrast - 1) < NEUTRAL_EPSILON;

export const gradeFilter = (grade: ColorGrade): string | null =>
  isNeutral(grade)
    ? null
    : `hue-rotate(${grade.hueRotate.toFixed(1)}deg) saturate(${grade.saturate.toFixed(3)}) brightness(${grade.brightness.toFixed(3)}) contrast(${grade.contrast.toFixed(3)})`;
