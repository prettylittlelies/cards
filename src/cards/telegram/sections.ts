import { fragment, h, hex, measure, mix, round, type Markup } from "@/render";
import type { Surface } from "../frame";
import { glyph, glyphWidth, image, nameText, subText } from "../primitives";
import { AVATAR_X, AVATAR_Y, contentX, NAME_CENTER, ROW, SUB_TOP } from "../row";
import { PREMIUM_GRADIENT, PREMIUM_STAR, TELEGRAM_GLYPH } from "./icons";
import type { TelegramModel } from "./model";
import { SCENE_FOCUS, SCENE_HEIGHT, SCENE_SYMBOLS, SCENE_WIDTH } from "./scene";
import type { TelegramCardConfig } from "./schema";

export type Context = Surface & {
  readonly config: TelegramCardConfig;
  readonly model: TelegramModel;
};

const TELEGRAM_BLUE = "#2aabee";
const PREMIUM_SIZE = 15;
const GIFT_SIZE = 20;
const ONLINE_ACCENT_SHARE = 0.7;
const OUTLINE_SIZE = 512;

export const avatar = ({ config, model, palette }: Context): Markup | null => {
  if (!config.show.avatar) return null;
  const r = ROW.avatar / 2;
  const sx = AVATAR_X + ROW.statusCenter;
  const sy = AVATAR_Y + ROW.statusCenter;
  const cut = config.show.status;

  return fragment(
    h(
      "defs",
      {},
      h(
        "mask",
        { id: "av" },
        h("circle", { cx: AVATAR_X + r, cy: AVATAR_Y + r, r, fill: "#fff" }),
        cut && h("circle", { cx: sx, cy: sy, r: ROW.statusCutout, fill: "#000" }),
      ),
      cut &&
        h(
          "mask",
          { id: "st" },
          h("circle", { cx: sx, cy: sy, r: ROW.statusRadius, fill: "#fff" }),
          !model.online && h("circle", { cx: sx, cy: sy, r: 2.5, fill: "#000" }),
        ),
    ),
    model.avatar
      ? image(model.avatar, AVATAR_X, AVATAR_Y, ROW.avatar, ROW.avatar, { mask: "url(#av)" })
      : h("circle", { cx: AVATAR_X + r, cy: AVATAR_Y + r, r, class: "m", mask: "url(#av)" }),
    cut &&
      h("rect", {
        x: sx - 5,
        y: sy - 5,
        width: 10,
        height: 10,
        fill: model.online ? hex(model.accent) : hex(palette.muted),
        mask: "url(#st)",
      }),
  );
};

const symbolMarkup = (path: string, offset: number, fill: string, twinkle: boolean): Markup =>
  h(
    "g",
    { fill },
    SCENE_SYMBOLS.map(({ x, y, size, opacity, delay }) =>
      h(
        "path",
        {
          d: path,
          transform: `translate(${round(offset + x)} ${round(y)}) scale(${(size / OUTLINE_SIZE).toFixed(4)}) translate(-${OUTLINE_SIZE / 2} -${OUTLINE_SIZE / 2})`,
          opacity,
          class: twinkle ? "tw" : undefined,
          style: twinkle ? `--a:${opacity};animation-delay:-${round(delay)}s` : undefined,
        },
      ),
    ),
  );

export const scene = ({ config, model }: Context): Markup | null => {
  const colors = model.scene;
  if (!colors) return null;
  const width = config.width;
  const sceneWidth = Math.min(width, SCENE_WIDTH);
  const offset = width - SCENE_WIDTH;
  const center = hex(colors.center);
  const edge = hex(colors.edge);
  const fx = offset + SCENE_FOCUS.x;
  const fy = SCENE_FOCUS.y;

  return fragment(
    h(
      "defs",
      {},
      h(
        "linearGradient",
        { id: "sg" },
        h("stop", { offset: 0, "stop-color": edge, "stop-opacity": 0 }),
        h("stop", { offset: 0.25, "stop-color": edge, "stop-opacity": 0.08 }),
        h("stop", { offset: 0.6, "stop-color": edge, "stop-opacity": 0.14 }),
        h("stop", { offset: 1, "stop-color": center, "stop-opacity": 0.22 }),
      ),
      h(
        "radialGradient",
        { id: "gc", gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: 1, gradientTransform: `translate(${fx} ${fy}) scale(44 30)` },
        h("stop", { offset: 0, "stop-color": center, "stop-opacity": 0.7 }),
        h("stop", { offset: 1, "stop-color": center, "stop-opacity": 0 }),
      ),
      h(
        "radialGradient",
        { id: "ge", gradientUnits: "userSpaceOnUse", cx: 0, cy: 0, r: 1, gradientTransform: `translate(${fx} ${fy}) scale(150 60)` },
        h("stop", { offset: 0, "stop-color": edge, "stop-opacity": 0.42 }),
        h("stop", { offset: 0.7, "stop-color": edge, "stop-opacity": 0.1 }),
        h("stop", { offset: 1, "stop-color": edge, "stop-opacity": 0 }),
      ),
      h(
        "linearGradient",
        { id: "smg", gradientUnits: "userSpaceOnUse", x1: width - sceneWidth, x2: width, y1: 0, y2: 0 },
        h("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": 0 }),
        h("stop", { offset: 0.4, "stop-color": "#fff", "stop-opacity": 0.65 }),
        h("stop", { offset: 0.8, "stop-color": "#fff", "stop-opacity": 1 }),
      ),
      h("mask", { id: "sm" }, h("rect", { x: width - sceneWidth, y: 0, width: sceneWidth, height: SCENE_HEIGHT, fill: "url(#smg)" })),
    ),
    h("rect", { width, height: ROW.height, fill: "url(#sg)" }),
    h(
      "g",
      { mask: "url(#sm)" },
      h(
        "g",
        { style: "mix-blend-mode:screen", opacity: 0.85 },
        h("rect", { x: width - sceneWidth, width: sceneWidth, height: SCENE_HEIGHT, fill: "url(#ge)" }),
        h("rect", { x: width - sceneWidth, width: sceneWidth, height: SCENE_HEIGHT, fill: "url(#gc)" }),
      ),
      colors.symbol && symbolMarkup(colors.symbol, offset, center, config.motion.twinkle),
    ),
  );
};

export const nameLine = ({ config, model, em }: Context): Markup => {
  const x = contentX(config.show.avatar);
  const decorators = [model.premium ? PREMIUM_SIZE : 0, model.gift ? GIFT_SIZE : 0].filter((size) => size > 0);
  const decoratorsWidth = decorators.reduce((sum, size) => sum + size + ROW.decoratorGap, 0);
  const available = config.width - x - ROW.inset - decoratorsWidth;
  let cursor = x + Math.min(measure(model.name, ROW.nameSize, em), available) + ROW.decoratorGap;

  const premium =
    model.premium &&
    fragment(
      h(
        "defs",
        {},
        h(
          "linearGradient",
          { id: "pg", gradientUnits: "userSpaceOnUse", x1: PREMIUM_GRADIENT.x1, y1: PREMIUM_GRADIENT.y1, x2: PREMIUM_GRADIENT.x2, y2: PREMIUM_GRADIENT.y2 },
          PREMIUM_GRADIENT.stops.map(([offset, color]) => h("stop", { offset, "stop-color": color })),
        ),
      ),
      glyph(PREMIUM_STAR, cursor, NAME_CENTER - PREMIUM_SIZE * (82 / 86) / 2, PREMIUM_SIZE * (82 / 86), "url(#pg)", "Telegram Premium"),
    );
  if (model.premium) cursor += PREMIUM_SIZE + ROW.decoratorGap;

  const gift =
    model.gift &&
    h(
      "g",
      {},
      h("title", {}, model.gift.label),
      image(model.gift.image, cursor, NAME_CENTER - GIFT_SIZE / 2, GIFT_SIZE, GIFT_SIZE, { preserveAspectRatio: "xMidYMid meet" }),
    );

  return fragment(nameText(model.name, x, available, em), premium, gift);
};

export const summary = ({ config, model, em, palette }: Context): Markup => {
  const x = contentX(config.show.avatar);
  const labelX = x + glyphWidth(TELEGRAM_GLYPH, ROW.subIcon) + ROW.subGap;
  const online = model.online && config.show.seen;
  return fragment(
    glyph(TELEGRAM_GLYPH, x, SUB_TOP + (ROW.subLine - ROW.subIcon) / 2, ROW.subIcon, TELEGRAM_BLUE),
    h(
      "g",
      { style: online ? `--on:${hex(mix(palette.fg, model.accent, ONLINE_ACCENT_SHARE))}` : undefined },
      subText(model.seen, labelX, config.width - labelX - ROW.inset, em, online ? "s on tnum" : "s tnum"),
    ),
  );
};
