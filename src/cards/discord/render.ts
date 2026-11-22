import { createTheme, h, render, separated, stack, type Block, type Theme } from "@/render";
import { METRICS, type Context } from "./context";
import type { CardModel } from "./model";
import { FALLBACK_ACCENT, type DiscordCardConfig } from "./schema";
import { activity, idle } from "./sections/activity";
import { bio } from "./sections/bio";
import { header } from "./sections/header";
import { stylesheet } from "./style";

const XMLNS = "http://www.w3.org/2000/svg";

type Frame = {
  readonly config: DiscordCardConfig;
  readonly theme: Theme;
  readonly label: string;
  readonly content: Block;
};

const frame = ({ config, theme, label, content }: Frame): string => {
  const { width, padding, radius } = config;
  const height = Math.ceil(content.height + padding * 2);
  const inset = config.show.border ? 0.5 : 0;

  return render(
    h(
      "svg",
      { xmlns: XMLNS, width, height, viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label },
      h("title", {}, label),
      h("style", {}, stylesheet(theme, config)),
      h(
        "defs",
        {},
        h(
          "radialGradient",
          { id: "glow", cx: "0", cy: "0", r: "1", gradientUnits: "objectBoundingBox" },
          h("stop", { offset: "0", "stop-color": theme.css.accent, "stop-opacity": 0.22 }),
          h("stop", { offset: "1", "stop-color": theme.css.accent, "stop-opacity": 0 }),
        ),
      ),
      h(
        "g",
        { class: "card" },
        h("rect", {
          x: inset,
          y: inset,
          width: width - inset * 2,
          height: height - inset * 2,
          rx: radius,
          fill: theme.css.background,
          stroke: config.show.border ? theme.css.border : undefined,
        }),
        config.show.glow && h("rect", { x: inset, y: inset, width: width - inset * 2, height: height - inset * 2, rx: radius, fill: "url(#glow)" }),
        content.draw(padding),
      ),
    ),
  );
};

const divider = (ctx: Context) => (y: number) =>
  h("rect", { x: ctx.x, y, width: ctx.width, height: 1, fill: ctx.theme.css.border, opacity: ctx.config.show.dividers ? 1 : 0 });

export const renderCard = (config: DiscordCardConfig, model: CardModel): string => {
  const theme = createTheme(config.theme, model.accent);
  const ctx: Context = { config, model, theme, metrics: METRICS[config.layout], x: config.padding, width: config.width - config.padding * 2 };
  const wantsActivity = config.show.activities || config.show.spotify;
  const activities = model.activities.map((entry, index) => activity(ctx, entry, index));
  const feed = wantsActivity ? stack(activities.length > 0 ? activities : [idle(ctx)], ctx.metrics.gap) : null;
  const intro = stack([header(ctx), bio(ctx)], ctx.metrics.gap - 2);
  const content = separated([intro, feed], ctx.metrics.gap, divider(ctx));
  return frame({ config, theme, label: `${model.name} on Discord`, content });
};

export const renderNotice = (config: DiscordCardConfig, title: string, detail: string): string => {
  const theme = createTheme(config.theme, config.accent ?? FALLBACK_ACCENT);
  const metrics = METRICS[config.layout];
  const x = config.padding;
  const content: Block = {
    height: metrics.body + 6 + metrics.line,
    draw: (y) =>
      h(
        "g",
        {},
        h("text", { x, y: y + metrics.body, class: "t", "font-size": metrics.body + 1, "font-weight": 600 }, title),
        h("text", { x, y: y + metrics.body + 6 + metrics.line - 4, class: "m", "font-size": metrics.body }, detail),
      ),
  };
  return frame({ config, theme, label: title, content });
};
