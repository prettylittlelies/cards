import { FONT_WIDTH, fragment, h, hex, PALETTES, render, type Markup } from "@/render";
import { ROW, type Context } from "./context";
import type { CardModel } from "./model";
import type { DiscordCardConfig } from "./schema";
import { avatar } from "./sections/avatar";
import { nameLine, SUB_TOP } from "./sections/line";
import { nameplate } from "./sections/nameplate";
import { baseline } from "./sections/primitives";
import { summary } from "./sections/summary";
import { stylesheet } from "./style";

const XMLNS = "http://www.w3.org/2000/svg";
const SURFACE_FILL = 0.03;
const SURFACE_RING = 0.08;

type Frame = {
  readonly config: DiscordCardConfig;
  readonly label: string;
  readonly body: Markup;
};

const frame = async ({ config, label, body }: Frame): Promise<string> => {
  const palette = PALETTES[config.theme];
  const { width, scale, radius } = config;
  const fg = hex(palette.fg);
  const shape = { width, height: ROW.height, rx: radius };

  return render(
    h(
      "svg",
      { xmlns: XMLNS, width: width * scale, height: ROW.height * scale, viewBox: `0 0 ${width} ${ROW.height}`, role: "img", "aria-label": label },
      h("title", {}, label),
      h("style", {}, await stylesheet(palette, config)),
      h("defs", {}, h("clipPath", { id: "row" }, h("rect", shape))),
      h(
        "g",
        { "clip-path": "url(#row)" },
        config.show.surface &&
          fragment(h("rect", { ...shape, fill: hex(palette.bg) }), h("rect", { ...shape, fill: fg, "fill-opacity": SURFACE_FILL })),
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

export const renderCard = (config: DiscordCardConfig, model: CardModel): Promise<string> => {
  const ctx: Context = { config, model, palette: PALETTES[config.theme], fontWidth: FONT_WIDTH[config.font] };
  return frame({
    config,
    label: `${model.name} on Discord`,
    body: fragment(nameplate(ctx), avatar(ctx), nameLine(ctx), summary(ctx)),
  });
};

export const renderNotice = (config: DiscordCardConfig, title: string, detail: string): Promise<string> => {
  const x = ROW.inset;
  return frame({
    config,
    label: title,
    body: fragment(
      h("text", { x, y: baseline(SUB_TOP - ROW.nameLine, ROW.nameLine, ROW.nameSize), class: "n" }, title),
      h("text", { x, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s" }, detail),
    ),
  });
};
