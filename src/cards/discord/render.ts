import { fragment } from "@/render";
import { frame, surfaceOf } from "../frame";
import type { Context } from "./context";
import type { CardModel } from "./model";
import type { DiscordCardConfig } from "./schema";
import { avatar } from "./sections/avatar";
import { nameLine } from "./sections/line";
import { nameplate } from "./sections/nameplate";
import { summary } from "./sections/summary";

export const renderCard = (config: DiscordCardConfig, model: CardModel): Promise<string> => {
  const ctx: Context = { ...surfaceOf(config), config, model };
  return frame({
    config,
    label: `${model.name} on Discord`,
    body: fragment(nameplate(ctx), avatar(ctx), nameLine(ctx), summary(ctx)),
  });
};
