import { FONT_STACKS, fontFace, fragment, h, hex, metricsOf, PALETTES, render, type FontName, type Markup, type Measure, type Palette } from "@/render";
import type { FrameFields } from "./fields";
import { nameText, subText } from "./primitives";
import { contentX, ROW } from "./row";

export type FrameConfig = FrameFields & { readonly show: { readonly surface: boolean } };

export type Surface = {
  readonly palette: Palette;
  readonly em: Measure;
};

const XMLNS = "http://www.w3.org/2000/svg";
const SURFACE_FILL = 0.03;
const SURFACE_RING = 0.08;

export const surfaceOf = (config: Pick<FrameConfig, "theme" | "font">): Surface => ({
  palette: PALETTES[config.theme],
  em: metricsOf(config.font),
});

const stylesheet = async ({ palette }: Surface, font: FontName, extra: string): Promise<string> =>
  [
    await fontFace(font),
    `text{font-family:${FONT_STACKS[font]};font-weight:500;white-space:pre}`,
    `.n{font-size:${ROW.nameSize}px;fill:${hex(palette.fg)}}`,
    `.s{font-size:${ROW.subSize}px;fill:${hex(palette.muted)}}`,
    `.m{fill:${hex(palette.muted)}}`,
    ".tnum{font-variant-numeric:tabular-nums}",
    extra,
  ].join("");

export type FrameInput = {
  readonly config: FrameConfig;
  readonly label: string;
  readonly body: Markup;
  readonly css?: string;
};

export const frame = async ({ config, label, body, css = "" }: FrameInput): Promise<string> => {
  const surface = surfaceOf(config);
  const { width, scale, radius } = config;
  const fg = hex(surface.palette.fg);
  const shape = { width, height: ROW.height, rx: radius };

  return render(
    h(
      "svg",
      { xmlns: XMLNS, width: width * scale, height: ROW.height * scale, viewBox: `0 0 ${width} ${ROW.height}`, role: "img", "aria-label": label },
      h("title", {}, label),
      h("style", {}, await stylesheet(surface, config.font, css)),
      h("defs", {}, h("clipPath", { id: "row" }, h("rect", shape))),
      h(
        "g",
        { "clip-path": "url(#row)" },
        config.show.surface &&
          fragment(h("rect", { ...shape, fill: hex(surface.palette.bg) }), h("rect", { ...shape, fill: fg, "fill-opacity": SURFACE_FILL })),
        body,
      ),
      config.show.surface &&
        h("rect", {
          x: 0.5,
          y: 0.5,
          width: width - 1,
          height: ROW.height - 1,
          rx: Math.max(0, radius - 0.5),
          fill: "none",
          stroke: fg,
          "stroke-opacity": SURFACE_RING,
        }),
    ),
  );
};

export const notice = (config: FrameConfig, title: string, detail: string): Promise<string> => {
  const { em } = surfaceOf(config);
  const x = contentX(false);
  const width = config.width - x - ROW.inset;
  return frame({ config, label: title, body: fragment(nameText(title, x, width, em), subText(detail, x, width, em)) });
};
