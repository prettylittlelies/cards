import { presenceOf } from "@/discord/lanyard";
import { readProfile } from "@/discord/profile";
import { notice } from "../frame";
import { defineCard } from "../kind";
import { buildModel } from "./model";
import { renderCard } from "./render";
import { DISCORD_TOKEN } from "./token";

export const discordCard = defineCard({
  kind: "discord",
  token: DISCORD_TOKEN,
  validate: (config) => (config.user === "0" ? "user: required" : null),
  draw: async (config) => {
    const [snapshot, profile] = await Promise.all([presenceOf(config.user)(), readProfile(config.user)]);
    if (snapshot.value.status === "untracked") {
      return { svg: await notice(config, "Not tracked by Lanyard", "Join discord.gg/lanyard to enable this card"), stale: snapshot.stale };
    }
    const model = await buildModel(config, snapshot.value.presence, profile);
    return { svg: await renderCard(config, model), stale: snapshot.stale };
  },
  unavailable: (config) => notice(config, "Presence unavailable", "Lanyard did not respond, retrying shortly"),
  inspect: async (config) => ({ tracked: (await presenceOf(config.user)()).value.status === "ok" }),
});
