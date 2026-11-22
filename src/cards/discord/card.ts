import { presenceOf } from "@/discord/lanyard";
import { readProfile } from "@/discord/profile";
import { buildModel } from "./model";
import { renderCard, renderNotice } from "./render";
import type { DiscordCardConfig } from "./schema";

export type CardResult = {
  readonly svg: string;
  readonly live: boolean;
  readonly stale: boolean;
};

export const drawCard = async (config: DiscordCardConfig): Promise<CardResult> => {
  const [snapshot, profile] = await Promise.all([presenceOf(config.user)(), readProfile(config.user)]);
  if (snapshot.value.status === "untracked") {
    return {
      svg: renderNotice(config, "Not tracked by Lanyard", "Join discord.gg/lanyard to enable this card"),
      live: false,
      stale: snapshot.stale,
    };
  }
  const model = await buildModel(config, snapshot.value.presence, profile);
  return { svg: renderCard(config, model), live: true, stale: snapshot.stale };
};

export const drawUnavailable = (config: DiscordCardConfig): string =>
  renderNotice(config, "Presence unavailable", "Lanyard did not respond, retrying shortly");
