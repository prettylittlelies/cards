import { fragment, h, measure, type Block, type Markup } from "@/render";
import { STATUS_COLORS, type Context } from "../context";
import { circleClip, image, text } from "./primitives";

const BADGE_SIZE = 18;
const BADGE_GAP = 4;
const DECORATION_SCALE = 1.2;
const COLUMN_GAP = 14;

const avatarMarkup = ({ model, config, theme, metrics }: Context, x: number, y: number): Markup => {
  const size = metrics.avatar;
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  const dot = Math.round(size * 0.15);
  const dx = cx + r * Math.SQRT1_2;
  const dy = cy + r * Math.SQRT1_2;
  const ring = dot + 3;
  const decoration = model.decoration ? size * DECORATION_SCALE : 0;

  return fragment(
    circleClip("av", cx, cy, r),
    model.avatar
      ? image(model.avatar, x, y, size, "av")
      : h("circle", { cx, cy, r, fill: theme.css.surface }),
    model.decoration && image(model.decoration, cx - decoration / 2, cy - decoration / 2, decoration),
    config.show.status &&
      fragment(
        h("circle", { cx: dx, cy: dy, r: ring / 1.6 + 1.5, fill: theme.css.background }),
        config.motion.pulse &&
          model.status !== "offline" &&
          h("circle", { cx: dx, cy: dy, r: dot / 1.6, fill: STATUS_COLORS[model.status], class: "pulse" }),
        h("circle", { cx: dx, cy: dy, r: dot / 1.6, fill: STATUS_COLORS[model.status] }),
      ),
  );
};

const badgesMarkup = ({ model }: Context, x: number, top: number): Markup =>
  fragment(
    model.badges.map((badge, index) =>
      h(
        "g",
        {},
        h("title", {}, badge.label),
        image(badge.image, x + index * (BADGE_SIZE + BADGE_GAP), top, BADGE_SIZE),
      ),
    ),
  );

const subline = ({ model, config }: Context): string =>
  [
    config.show.username ? `@${model.username}` : null,
    config.show.pronouns && model.pronouns ? model.pronouns : null,
    config.show.platform && model.platforms.length > 0 ? model.platforms.join(" · ") : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

const customMarkup = (ctx: Context, x: number, top: number, width: number): Markup | null => {
  const custom = ctx.model.custom;
  if (!custom) return null;
  const size = ctx.metrics.body;
  const icon = size + 3;
  const offset = custom.image || custom.emoji ? icon + 6 : 0;
  return fragment(
    custom.image && image(custom.image, x, top - 1, icon),
    !custom.image && custom.emoji && text(custom.emoji, { x, top, size, tone: "text" }),
    custom.text && text(custom.text, { x: x + offset, top, size, tone: "muted", width: width - offset }),
  );
};

export const header = (ctx: Context): Block => {
  const { metrics, model, config } = ctx;
  const showAvatar = config.show.avatar;
  const avatar = showAvatar ? metrics.avatar : 0;
  const column = ctx.x + (showAvatar ? avatar + COLUMN_GAP : 0);
  const columnWidth = ctx.width - (column - ctx.x);
  const badgeWidth = model.badges.length > 0 ? model.badges.length * (BADGE_SIZE + BADGE_GAP) + 6 : 0;
  const second = subline(ctx);
  const rows = [true, second.length > 0, model.custom !== null].filter(Boolean).length;
  const textHeight = metrics.name + 4 + (rows - 1) * metrics.line;
  const height = Math.max(avatar, textHeight);

  return {
    height,
    draw: (y) => {
      const top = y + (height - textHeight) / 2;
      const nameWidth = Math.min(measure(model.name, metrics.name, 600), columnWidth - badgeWidth);
      let row = top + metrics.name + 4;
      const lines: (Markup | null)[] = [];
      if (second) {
        lines.push(text(second, { x: column, top: row, size: metrics.body, tone: "faint", width: columnWidth }));
        row += metrics.line;
      }
      lines.push(customMarkup(ctx, column, row, columnWidth));

      return fragment(
        showAvatar && avatarMarkup(ctx, ctx.x, y + (height - avatar) / 2),
        text(model.name, { x: column, top, size: metrics.name, tone: "text", weight: 600, width: columnWidth - badgeWidth }),
        badgesMarkup(ctx, column + nameWidth + 8, top + (metrics.name - BADGE_SIZE) / 2 + 1),
        lines,
      );
    },
  };
};
