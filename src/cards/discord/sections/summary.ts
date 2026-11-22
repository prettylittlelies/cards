import { fragment, h, measure, truncate, type Markup, type Measure } from "@/render";
import { ROW, type Context } from "../context";
import { KIND_GLYPHS } from "../icons";
import { contentX, SUB_TOP } from "./line";
import { baseline, glyph, glyphWidth } from "./primitives";

const label = (value: string, x: number, width: number, em: Measure): Markup =>
  h("text", { x, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s" }, truncate(value, width, ROW.subSize, em));

export const summary = (ctx: Context): Markup | null => {
  const { model, config, em } = ctx;
  const entry = model.summary;
  if (!entry) return null;
  const x = contentX(ctx);
  const right = config.width - ROW.inset;
  const size = ROW.subSize;

  if (entry.kind === "custom") {
    const emojiWidth = entry.emoji ? measure(entry.emoji, size, em) + ROW.subGap : 0;
    return fragment(
      entry.emoji && h("text", { x, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s" }, entry.emoji),
      entry.text && label(entry.text, x + emojiWidth, right - x - emojiWidth, em),
    );
  }

  const shape = KIND_GLYPHS[entry.activity];
  const iconWidth = glyphWidth(shape, ROW.subIcon);
  const counter = entry.extra > 0 ? `+${entry.extra}` : "";
  const counterWidth = counter ? measure(counter, size, em) + ROW.subGap : 0;
  const labelX = x + iconWidth + ROW.subGap;
  const labelWidth = right - labelX - counterWidth;
  const shown = truncate(entry.label, labelWidth, size, em);

  return fragment(
    glyph(shape, x, SUB_TOP + (ROW.subLine - ROW.subIcon) / 2, ROW.subIcon, ROW.subIconColor),
    label(shown, labelX, labelWidth, em),
    counter && h("text", { x: labelX + measure(shown, size, em) + ROW.subGap, y: baseline(SUB_TOP, ROW.subLine, ROW.subSize), class: "s tnum" }, counter),
  );
};
