import { nameplateUrl } from "./cdn";
import type { DiscordUser, NameplatePalette } from "./types";

export const NAMEPLATE_PALETTE: Readonly<Record<NameplatePalette, number>> = {
  crimson: 0x900007,
  berry: 0x893a99,
  sky: 0x0080b7,
  teal: 0x086460,
  forest: 0x2d5401,
  bubble_gum: 0xdc3e97,
  violet: 0x730bc8,
  cobalt: 0x0131c2,
  clover: 0x047b20,
  lemon: 0xf6cd12,
  white: 0xffffff,
};

export type Nameplate = {
  readonly label: string;
  readonly color: number;
  readonly url: string;
};

export const nameplateOf = (user: Pick<DiscordUser, "collectibles">, animated: boolean): Nameplate | null => {
  const data = user.collectibles?.nameplate;
  if (!data?.asset) return null;
  return {
    label: data.label,
    color: NAMEPLATE_PALETTE[data.palette] ?? NAMEPLATE_PALETTE.white,
    url: nameplateUrl(data.asset, animated),
  };
};
