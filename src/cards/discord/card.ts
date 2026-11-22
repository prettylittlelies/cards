import { presenceOf } from "@/discord/lanyard";
import { readProfile } from "@/discord/profile";
import { buildModel } from "./model";
import { renderCard, renderNotice } from "./render";
import type { DiscordCardConfig } from "./schema";

export type CardResult = {
  readonly svg: string;
  readonly stale: boolean;
};

export const drawCard = async (config: DiscordCardConfig): Promise<CardResult> => {
  const [snapshot, profile] = await Promise.all([presenceOf(config.user)(), readProfile(config.user)]);
  if (snapshot.value.status === "untracked") {
    return { svg: await renderNotice(config, "Not tracked by Lanyard", "Join discord.gg/lanyard to enable this card"), stale: snapshot.stale };
  }
  const model = await buildModel(config, snapshot.value.presence, profile);
  return { svg: await renderCard(config, model), stale: snapshot.stale };
};

export const drawUnavailable = (config: DiscordCardConfig): Promise<string> =>
  renderNotice(config, "Presence unavailable", "Lanyard did not respond, retrying shortly");
