import { fragment, h, measure, truncate, type Markup } from "@/render";
import { glyph, glyphWidth, SUB_BASELINE, subText } from "../../primitives";
import { contentX, ROW, SUB_TOP } from "../../row";
import { DISCORD_ROW, type Context } from "../context";
import { KIND_GLYPHS } from "../icons";

export const summary = (ctx: Context): Markup | null => {
  const { model, config, em } = ctx;
  const entry = model.summary;
  if (!entry) return null;
  const x = contentX(config.show.avatar);
  const right = config.width - ROW.inset;

  if (entry.kind === "custom") {
    const emojiWidth = entry.emoji ? measure(entry.emoji, ROW.subSize, em) + ROW.subGap : 0;
    return fragment(
      entry.emoji && h("text", { x, y: SUB_BASELINE, class: "s" }, entry.emoji),
      entry.text && subText(entry.text, x + emojiWidth, right - x - emojiWidth, em),
    );
  }

  const shape = KIND_GLYPHS[entry.activity];
  const counter = entry.extra > 0 ? `+${entry.extra}` : "";
  const counterWidth = counter ? measure(counter, ROW.subSize, em) + ROW.subGap : 0;
  const labelX = x + glyphWidth(shape, ROW.subIcon) + ROW.subGap;
  const labelWidth = right - labelX - counterWidth;
  const shown = truncate(entry.label, labelWidth, ROW.subSize, em);

  return fragment(
    glyph(shape, x, SUB_TOP + (ROW.subLine - ROW.subIcon) / 2, ROW.subIcon, DISCORD_ROW.subIconColor),
    subText(shown, labelX, labelWidth, em),
    counter && h("text", { x: labelX + measure(shown, ROW.subSize, em) + ROW.subGap, y: SUB_BASELINE, class: "s tnum" }, counter),
  );
};
