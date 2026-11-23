import { h, truncate, type Attrs, type Markup, type Measure } from "@/render";
import { NAME_TOP, ROW, SUB_TOP } from "./row";

export type Glyph = {
  readonly viewBox: string;
  readonly path: string;
};

const BASELINE_SHIFT = 0.35;

export const baseline = (top: number, lineHeight: number, size: number): number => top + lineHeight / 2 + size * BASELINE_SHIFT;

export const NAME_BASELINE = baseline(NAME_TOP, ROW.nameLine, ROW.nameSize);
export const SUB_BASELINE = baseline(SUB_TOP, ROW.subLine, ROW.subSize);

export const image = (href: string, x: number, y: number, width: number, height = width, extra?: Attrs): Markup =>
  h("image", { href, x, y, width, height, preserveAspectRatio: "xMidYMid slice", ...extra });

export const glyphWidth = (glyph: Glyph, height: number): number => {
  const [, , w = 1, gh = 1] = glyph.viewBox.split(" ").map(Number);
  return (w / gh) * height;
};

export const glyph = (shape: Glyph, x: number, y: number, height: number, fill: string, title?: string): Markup =>
  h(
    "svg",
    { x, y, width: glyphWidth(shape, height), height, viewBox: shape.viewBox, fill },
    title && h("title", {}, title),
    h("path", { d: shape.path }),
  );

export const nameText = (value: string, x: number, width: number, em: Measure): Markup =>
  h("text", { x, y: NAME_BASELINE, class: "n" }, truncate(value, width, ROW.nameSize, em));

export const subText = (value: string, x: number, width: number, em: Measure, className = "s"): Markup =>
  h("text", { x, y: SUB_BASELINE, class: className }, truncate(value, width, ROW.subSize, em));
