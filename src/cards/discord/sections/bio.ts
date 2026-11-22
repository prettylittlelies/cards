import { fragment, wrap, type Block } from "@/render";
import type { Context } from "../context";
import { text } from "./primitives";

export const bio = ({ model, config, metrics, x, width }: Context): Block | null => {
  if (!config.show.bio || !model.bio) return null;
  const lines = wrap(model.bio, width, metrics.body, config.bioLines);
  return {
    height: lines.length * metrics.line - (metrics.line - metrics.body),
    draw: (y) => fragment(lines.map((line, index) => text(line, { x, top: y + index * metrics.line, size: metrics.body, tone: "muted" }))),
  };
};
