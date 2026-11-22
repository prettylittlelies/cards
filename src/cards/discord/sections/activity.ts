import { fragment, graphemes, h, measure, round, type Block, type Markup } from "@/render";
import type { Context } from "../context";
import type { ActivityModel } from "../model";
import { clock, duration } from "../time";
import { image, roundedClip, text } from "./primitives";

const ART_GAP = 14;
const BAR_HEIGHT = 3;
const BADGE_RATIO = 0.36;
const EQ_BARS = 4;

const equalizer = (x: number, top: number, height: number): Markup =>
  h(
    "g",
    { class: "eq", fill: "currentColor" },
    Array.from({ length: EQ_BARS }, (_, index) =>
      h("rect", { x: x + index * 3.5, y: top, width: 2, height, rx: 1, style: `animation-delay:-${round(index * 0.27)}s` }),
    ),
  );

const progress = (ctx: Context, activity: ActivityModel, x: number, top: number, width: number): Markup | null => {
  if (activity.start === null || activity.end === null || activity.end <= activity.start) return null;
  const total = activity.end - activity.start;
  const elapsed = Math.min(total, Math.max(0, ctx.model.now - activity.start));
  const filled = (elapsed / total) * width;
  const remaining = total - elapsed;
  const { small } = ctx.metrics;
  const labels = top + BAR_HEIGHT + 6;

  return fragment(
    h("rect", { x, y: top, width, height: BAR_HEIGHT, rx: BAR_HEIGHT / 2, class: "track" }),
    h(
      "rect",
      { x, y: top, width: filled, height: BAR_HEIGHT, rx: BAR_HEIGHT / 2, class: "fill" },
      ctx.config.motion.progress &&
        remaining > 0 &&
        h("animate", { attributeName: "width", from: filled, to: width, dur: `${round(remaining / 1000)}s`, fill: "freeze" }),
    ),
    text(clock(elapsed), { x, top: labels, size: small, tone: "faint", extra: { class: "f tnum" } }),
    text(clock(total), { x: x + width, top: labels, size: small, tone: "faint", anchor: "end", extra: { class: "f tnum" } }),
  );
};

const artMarkup = (activity: ActivityModel, id: string, x: number, y: number, size: number, ctx: Context): Markup => {
  const radius = Math.round(size * 0.18);
  if (!activity.art) {
    const initial = graphemes(activity.title)[0]?.toUpperCase() ?? "";
    return fragment(
      h("rect", { x: x + 0.5, y: y + 0.5, width: size - 1, height: size - 1, rx: radius, fill: ctx.theme.css.surface, stroke: ctx.theme.css.border }),
      h("text", { x: x + size / 2, y: y + size / 2 + size * 0.14, class: "f", "font-size": size * 0.4, "font-weight": 600, "text-anchor": "middle" }, initial),
    );
  }
  const badge = Math.round(size * BADGE_RATIO);
  const bx = x + size - badge + 4;
  const by = y + size - badge + 4;
  return fragment(
    roundedClip(id, x, y, size, radius),
    image(activity.art, x, y, size, id),
    activity.badge &&
      fragment(
        h("circle", { cx: bx + badge / 2, cy: by + badge / 2, r: badge / 2 + 2.5, fill: ctx.theme.css.background }),
        h("clipPath", { id: `${id}b` }, h("circle", { cx: bx + badge / 2, cy: by + badge / 2, r: badge / 2 })),
        image(activity.badge, bx, by, badge, `${id}b`),
      ),
  );
};

export const activity = (ctx: Context, model: ActivityModel, index: number): Block => {
  const { metrics, x, width, config } = ctx;
  const art = metrics.art;
  const column = x + art + ART_GAP;
  const columnWidth = width - art - ART_GAP;
  const spotify = model.kind === "spotify" && model.start !== null && model.end !== null;
  const lines = model.lines.slice(0, spotify ? 1 : 2);
  const textHeight =
    metrics.small + 6 + metrics.body + 2 + lines.length * (metrics.line - 2) + (spotify ? BAR_HEIGHT + 10 + metrics.small : 0);
  const height = Math.max(art, textHeight);

  return {
    height,
    draw: (y) => {
      const top = y + (height - textHeight) / 2;
      const since =
        config.show.elapsed && !spotify && model.start !== null ? `  ·  ${duration(ctx.model.now - model.start)}` : "";
      const heading = `${model.heading}${since}`;
      const eq = spotify && config.motion.equalizer;
      const headingWidth = Math.min(measure(heading, metrics.small, 600), columnWidth - (eq ? 20 : 0));
      let row = top + metrics.small + 6;

      const body: Markup[] = [
        text(model.title, { x: column, top: row, size: metrics.body + 1, tone: "text", weight: 600, width: columnWidth }),
      ];
      row += metrics.body + 2 + 2;
      for (const line of lines) {
        body.push(text(line, { x: column, top: row, size: metrics.body, tone: "muted", width: columnWidth }));
        row += metrics.line - 2;
      }

      return fragment(
        artMarkup(model, `art${index}`, x, y + (height - art) / 2, art, ctx),
        text(heading, { x: column, top, size: metrics.small, tone: "accent", weight: 600, width: columnWidth - (eq ? 20 : 0), extra: { class: "a caps" } }),
        eq && h("g", { class: "a", color: ctx.theme.css.accent }, equalizer(column + headingWidth + 8, top, metrics.small)),
        body,
        spotify && progress(ctx, model, column, row + 4, columnWidth),
      );
    },
  };
};

export const idle = ({ config, metrics, x }: Context): Block => ({
  height: metrics.body,
  draw: (y) => text(config.offline, { x, top: y, size: metrics.body, tone: "faint" }),
});
