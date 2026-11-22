import { FONT_STACKS, fontFace, hex, type Palette } from "@/render";
import { ROW } from "./context";
import type { DiscordCardConfig } from "./schema";

export const stylesheet = async (palette: Palette, config: DiscordCardConfig): Promise<string> =>
  [
    await fontFace(config.font),
    `text{font-family:${FONT_STACKS[config.font]};font-weight:500;white-space:pre}`,
    `.n{font-size:${ROW.nameSize}px;fill:${hex(palette.fg)}}`,
    `.s{font-size:${ROW.subSize}px;fill:${hex(palette.muted)}}`,
    `.m{fill:${hex(palette.muted)}}`,
    ".tnum{font-variant-numeric:tabular-nums}",
  ].join("");
