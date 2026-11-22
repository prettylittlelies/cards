import { fragment, h, measure, truncate, type Markup } from "@/render";
import { ROW, STATUS_FILL, type Context } from "../context";
import { PLATFORM_GLYPHS } from "../icons";
import { baseline, glyph, glyphWidth, image } from "./primitives";

export const CONTENT_X = ROW.inset + ROW.avatar + ROW.gap;
const CONTENT_TOP = (ROW.height - ROW.nameLine - ROW.subLine) / 2;
export const SUB_TOP = CONTENT_TOP + ROW.nameLine;

const decoratorsWidth = ({ model }: Context): number => {
  const platforms = model.platforms.map((platform) => glyphWidth(PLATFORM_GLYPHS[platform], ROW.decoratorSize));
  const platformWidth = platforms.reduce((sum, w) => sum + w, 0) + ROW.platformGap * Math.max(0, platforms.length - 1);
  const badgeWidth = model.badges.length * ROW.badgeSize + ROW.badgeGap * Math.max(0, model.badges.length - 1);
  const groups = [platformWidth, badgeWidth].filter((w) => w > 0);
  return groups.length === 0 ? 0 : ROW.decoratorGap + groups.reduce((sum, w) => sum + w, 0) + ROW.decoratorGap * (groups.length - 1);
};

export const contentX = (ctx: Context): number => (ctx.config.show.avatar ? CONTENT_X : ROW.inset);

export const nameLine = (ctx: Context): Markup => {
  const { model, config, em } = ctx;
  const x = contentX(ctx);
  const available = config.width - x - ROW.inset - decoratorsWidth(ctx);
  const size = ROW.nameSize;
  const name = truncate(model.name, available, size, em);
  const center = CONTENT_TOP + ROW.nameLine / 2;
  const color = STATUS_FILL[model.status];

  let cursor = x + Math.min(measure(name, size, em), available) + ROW.decoratorGap;
  const platforms = model.platforms.map((platform) => {
    const shape = PLATFORM_GLYPHS[platform];
    const markup = glyph(shape, cursor, center - ROW.decoratorSize / 2, ROW.decoratorSize, color, platform);
    cursor += glyphWidth(shape, ROW.decoratorSize) + ROW.platformGap;
    return markup;
  });
  if (platforms.length > 0) cursor += ROW.decoratorGap - ROW.platformGap;
  const badges = model.badges.map((badge, index) =>
    h(
      "g",
      {},
      h("title", {}, badge.label),
      image(badge.image, cursor + index * (ROW.badgeSize + ROW.badgeGap), center - ROW.badgeSize / 2, ROW.badgeSize, ROW.badgeSize, {
        preserveAspectRatio: "xMidYMid meet",
      }),
    ),
  );

  return fragment(
    h("text", { x, y: baseline(CONTENT_TOP, ROW.nameLine, ROW.nameSize), class: "n" }, name),
    platforms,
    badges,
  );
};
