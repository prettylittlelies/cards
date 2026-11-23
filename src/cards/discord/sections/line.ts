import { fragment, h, measure, type Markup } from "@/render";
import { glyph, glyphWidth, image, nameText } from "../../primitives";
import { contentX, NAME_CENTER, ROW } from "../../row";
import { DISCORD_ROW, STATUS_FILL, type Context } from "../context";
import { PLATFORM_GLYPHS } from "../icons";

const { decoratorSize, platformGap, badgeSize, badgeGap } = DISCORD_ROW;

const decoratorsWidth = ({ model }: Context): number => {
  const platforms = model.platforms.map((platform) => glyphWidth(PLATFORM_GLYPHS[platform], decoratorSize));
  const platformWidth = platforms.reduce((sum, w) => sum + w, 0) + platformGap * Math.max(0, platforms.length - 1);
  const badgeWidth = model.badges.length * badgeSize + badgeGap * Math.max(0, model.badges.length - 1);
  const groups = [platformWidth, badgeWidth].filter((w) => w > 0);
  return groups.length === 0 ? 0 : ROW.decoratorGap + groups.reduce((sum, w) => sum + w, 0) + ROW.decoratorGap * (groups.length - 1);
};

export const nameLine = (ctx: Context): Markup => {
  const { model, config, em } = ctx;
  const x = contentX(config.show.avatar);
  const available = config.width - x - ROW.inset - decoratorsWidth(ctx);
  const color = STATUS_FILL[model.status];

  let cursor = x + Math.min(measure(model.name, ROW.nameSize, em), available) + ROW.decoratorGap;
  const platforms = model.platforms.map((platform) => {
    const shape = PLATFORM_GLYPHS[platform];
    const markup = glyph(shape, cursor, NAME_CENTER - decoratorSize / 2, decoratorSize, color, platform);
    cursor += glyphWidth(shape, decoratorSize) + platformGap;
    return markup;
  });
  if (platforms.length > 0) cursor += ROW.decoratorGap - platformGap;
  const badges = model.badges.map((badge, index) =>
    h(
      "g",
      {},
      h("title", {}, badge.label),
      image(badge.image, cursor + index * (badgeSize + badgeGap), NAME_CENTER - badgeSize / 2, badgeSize, badgeSize, {
        preserveAspectRatio: "xMidYMid meet",
      }),
    ),
  );

  return fragment(nameText(model.name, x, available, em), platforms, badges);
};
