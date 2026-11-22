import { h, type Attrs, type Markup } from "@/render";
import type { Glyph } from "../icons";

const BASELINE_SHIFT = 0.35;

export const baseline = (top: number, lineHeight: number, size: number): number => top + lineHeight / 2 + size * BASELINE_SHIFT;

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
