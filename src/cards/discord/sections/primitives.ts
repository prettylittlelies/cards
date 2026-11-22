import { h, truncate, type Attrs, type Markup, type Weight } from "@/render";

export type TextOptions = {
  readonly x: number;
  readonly top: number;
  readonly size: number;
  readonly tone: "text" | "muted" | "faint" | "accent";
  readonly weight?: Weight;
  readonly width?: number;
  readonly anchor?: "start" | "end";
  readonly extra?: Attrs;
};

const BASELINE = 0.8;

export const text = (value: string, { x, top, size, tone, weight = 400, width, anchor = "start", extra }: TextOptions): Markup =>
  h(
    "text",
    {
      x,
      y: top + size * BASELINE,
      class: tone[0],
      "font-size": size,
      "font-weight": weight === 400 ? undefined : weight,
      "text-anchor": anchor === "end" ? "end" : undefined,
      ...extra,
    },
    width === undefined ? value : truncate(value, width, size, weight),
  );

export const image = (href: string, x: number, y: number, size: number, clip?: string, extra?: Attrs): Markup =>
  h("image", {
    href,
    x,
    y,
    width: size,
    height: size,
    "clip-path": clip ? `url(#${clip})` : undefined,
    preserveAspectRatio: "xMidYMid slice",
    ...extra,
  });

export const roundedClip = (id: string, x: number, y: number, size: number, radius: number): Markup =>
  h("clipPath", { id }, h("rect", { x, y, width: size, height: size, rx: radius }));

export const circleClip = (id: string, cx: number, cy: number, r: number): Markup =>
  h("clipPath", { id }, h("circle", { cx, cy, r }));
