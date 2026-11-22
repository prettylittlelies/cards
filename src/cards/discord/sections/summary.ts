import { fragment, h, measure, truncate, type Markup } from "@/render";
import { ROW, type Context } from "../context";
import { KIND_GLYPHS } from "../icons";
import { contentX, SUB_TOP } from "./line";
import { baseline, glyph, glyphWidth } from "./primitives";

const label = (value: string, x: number, width: number, fontWidth: number): Markup =>
  h("text", { x, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s" }, truncate(value, width, ROW.subSize * fontWidth, 500));

export const summary = (ctx: Context): Markup | null => {
  const { model, config, fontWidth } = ctx;
  const entry = model.summary;
  if (!entry) return null;
  const x = contentX(ctx);
  const right = config.width - ROW.inset;
  const size = ROW.subSize * fontWidth;

  if (entry.kind === "custom") {
    const emojiWidth = entry.emoji ? measure(entry.emoji, size, 500) + ROW.subGap : 0;
    return fragment(
      entry.emoji && h("text", { x, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s" }, entry.emoji),
      entry.text && label(entry.text, x + emojiWidth, right - x - emojiWidth, fontWidth),
    );
  }

  const shape = KIND_GLYPHS[entry.activity];
  const iconWidth = glyphWidth(shape, ROW.subIcon);
  const counter = entry.extra > 0 ? `+${entry.extra}` : "";
  const counterWidth = counter ? measure(counter, size, 500) + ROW.subGap : 0;
  const labelX = x + iconWidth + ROW.subGap;
  const labelWidth = right - labelX - counterWidth;
  const shown = truncate(entry.label, labelWidth, size, 500);

  return fragment(
    glyph(shape, x, SUB_TOP + (ROW.subLine - ROW.subIcon) / 2, ROW.subIcon, ROW.subIconColor),
    label(shown, labelX, labelWidth, fontWidth),
    counter && h("text", { x: labelX + measure(shown, size, 500) + ROW.subGap, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s tnum" }, counter),
  );
};
