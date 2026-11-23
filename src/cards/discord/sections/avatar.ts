import { fragment, h, type Markup } from "@/render";
import type { DiscordStatus } from "@/discord/types";
import { image } from "../../primitives";
import { AVATAR_X, AVATAR_Y, ROW } from "../../row";
import { DISCORD_ROW, STATUS_FILL, type Context } from "../context";

const statusShape = (status: DiscordStatus, cx: number, cy: number): Markup =>
  fragment(
    h("circle", { cx, cy, r: ROW.statusRadius, fill: "#fff" }),
    status === "idle" && h("circle", { cx: cx - 2.5, cy: cy - 2.5, r: 3.75, fill: "#000" }),
    status === "dnd" && h("rect", { x: cx - 2.5, y: cy - 0.75, width: 5, height: 1.5, rx: 0.75, fill: "#000" }),
    status === "offline" && h("circle", { cx, cy, r: 2.5, fill: "#000" }),
  );

export const avatar = ({ config, model }: Context): Markup | null => {
  if (!config.show.avatar) return null;
  const x = AVATAR_X;
  const y = AVATAR_Y;
  const r = ROW.avatar / 2;
  const sx = x + ROW.statusCenter;
  const sy = y + ROW.statusCenter;
  const cut = config.show.status;
  const decoration = ROW.avatar * DISCORD_ROW.decorationRatio;
  const overhang = (decoration - ROW.avatar) / 2;

  return fragment(
    h(
      "defs",
      {},
      h(
        "mask",
        { id: "av" },
        h("circle", { cx: x + r, cy: y + r, r, fill: "#fff" }),
        cut && h("rect", { x: x + 19, y: y + 19, width: 16, height: 16, rx: 8, fill: "#000" }),
      ),
      cut &&
        h(
          "mask",
          { id: "dh", maskUnits: "userSpaceOnUse", x: x - overhang, y: y - overhang, width: decoration, height: decoration },
          h("rect", { x: x - overhang, y: y - overhang, width: decoration, height: decoration, fill: "#fff" }),
          h("circle", { cx: sx, cy: sy, r: ROW.statusCutout, fill: "#000" }),
        ),
      cut && h("mask", { id: "st" }, statusShape(model.status, sx, sy)),
    ),
    model.avatar
      ? image(model.avatar, x, y, ROW.avatar, ROW.avatar, { mask: "url(#av)" })
      : h("circle", { cx: x + r, cy: y + r, r, class: "m", mask: "url(#av)" }),
    model.decoration && image(model.decoration, x - overhang, y - overhang, decoration, decoration, { mask: cut ? "url(#dh)" : undefined }),
    cut && h("rect", { x: sx - 5, y: sy - 5, width: 10, height: 10, fill: STATUS_FILL[model.status], mask: "url(#st)" }),
  );
};
