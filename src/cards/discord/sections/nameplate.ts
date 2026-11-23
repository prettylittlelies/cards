import { fragment, h, hex, mix, type Markup } from "@/render";
import { colorGrade, gradeFilter } from "../../grade";
import { image } from "../../primitives";
import { ROW } from "../../row";
import { DISCORD_ROW, type Context } from "../context";

const TINT_ACCENT_SHARE = 0.8;
const MASK_FLOOR = 0.3;
const MASK_RAMP = 50;

export const nameplate = ({ config, model }: Context): Markup | null => {
  const plate = model.nameplate;
  if (!plate) return null;
  const width = config.width;
  const tint = hex(mix(plate.color, model.accent, TINT_ACCENT_SHARE));
  const mediaWidth = Math.min(width, ROW.height * DISCORD_ROW.nameplateAspect);
  const mediaX = width - mediaWidth;
  const rampStart = mediaX + mediaWidth / 2;
  const filter = gradeFilter(colorGrade(plate.color, model.accent));

  return fragment(
    h(
      "defs",
      {},
      h(
        "linearGradient",
        { id: "np" },
        h("stop", { offset: 0, "stop-color": tint, "stop-opacity": 0 }),
        h("stop", { offset: 0.2, "stop-color": tint, "stop-opacity": 0.1 }),
        h("stop", { offset: 0.5, "stop-color": tint, "stop-opacity": 0.1 }),
        h("stop", { offset: 1, "stop-color": tint, "stop-opacity": 0.24 }),
      ),
      h(
        "linearGradient",
        { id: "nmg", gradientUnits: "userSpaceOnUse", x1: mediaX, x2: width, y1: 0, y2: 0 },
        h("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": MASK_FLOOR }),
        h("stop", { offset: (rampStart - mediaX) / mediaWidth, "stop-color": "#fff", "stop-opacity": MASK_FLOOR }),
        h("stop", { offset: Math.min(1, (rampStart + MASK_RAMP - mediaX) / mediaWidth), "stop-color": "#fff", "stop-opacity": 1 }),
      ),
      h("mask", { id: "nm" }, h("rect", { x: mediaX, y: 0, width: mediaWidth, height: ROW.height, fill: "url(#nmg)" })),
    ),
    h("rect", { width, height: ROW.height, fill: "url(#np)" }),
    h(
      "g",
      { mask: "url(#nm)" },
      image(plate.image, mediaX, 0, mediaWidth, ROW.height, {
        preserveAspectRatio: "xMaxYMid slice",
        style: filter ? `filter:${filter}` : undefined,
      }),
    ),
  );
};
