import { inlineAll, inlineImage } from "@/api/inline";
import { activePlatforms, customStatusOf, detectKind, isVisibleActivity, type ActivityKind, type Platform } from "@/discord/activity";
import { avatarUrl, decorationUrl } from "@/discord/cdn";
import { nameplateOf } from "@/discord/nameplate";
import type { DiscordStatus, Presence, Profile } from "@/discord/types";
import type { DiscordCardConfig } from "./schema";

export type Summary =
  | { readonly kind: "custom"; readonly emoji: string | null; readonly text: string }
  | { readonly kind: "activity"; readonly activity: ActivityKind; readonly label: string; readonly extra: number };

export type BadgeModel = {
  readonly label: string;
  readonly image: string;
};

export type NameplateModel = {
  readonly label: string;
  readonly color: number;
  readonly image: string;
};

export type CardModel = {
  readonly name: string;
  readonly status: DiscordStatus;
  readonly platforms: readonly Platform[];
  readonly avatar: string | null;
  readonly decoration: string | null;
  readonly nameplate: NameplateModel | null;
  readonly badges: readonly BadgeModel[];
  readonly summary: Summary | null;
  readonly accent: number;
};

const NEUTRAL_ACCENT = 0x78788a;

const AVATAR_SIZE = 64;
const DECORATION_SIZE = 96;

const summaryOf = (presence: Presence, config: DiscordCardConfig): Summary | null => {
  const custom = config.show.customStatus ? customStatusOf(presence.activities) : undefined;
  if (custom) return { kind: "custom", emoji: custom.emoji && !custom.emoji.id ? custom.emoji.name : null, text: custom.state ?? "" };
  if (!config.show.activity) return null;
  const visible = presence.activities.filter(isVisibleActivity);
  const [primary] = visible;
  return primary ? { kind: "activity", activity: detectKind(primary), label: primary.name, extra: visible.length - 1 } : null;
};

const badgesOf = async (profile: Profile): Promise<BadgeModel[]> => {
  const images = await Promise.all(profile.badges.map(({ icon }) => inlineImage(icon)));
  return profile.badges.flatMap(({ label }, index) => {
    const image = images[index];
    return image ? [{ label, image }] : [];
  });
};

export const buildModel = async (config: DiscordCardConfig, presence: Presence, profile: Profile): Promise<CardModel> => {
  const { show, motion } = config;
  const user = presence.discord_user;
  const plate = show.nameplate ? nameplateOf(user, motion.animatedNameplate) : null;
  const [images, badges] = await Promise.all([
    inlineAll({
      avatar: show.avatar ? avatarUrl(user, AVATAR_SIZE, motion.animatedAvatar) : null,
      decoration: show.avatar && show.decoration ? decorationUrl(user, DECORATION_SIZE, motion.animatedDecoration) : null,
      nameplate: plate?.url ?? null,
    }),
    show.badges ? badgesOf(profile) : [],
  ]);

  return {
    name: config.name || user.global_name || user.username,
    status: presence.discord_status,
    platforms: show.platforms ? activePlatforms(presence) : [],
    avatar: images.avatar,
    decoration: images.decoration,
    nameplate: plate && images.nameplate ? { label: plate.label, color: plate.color, image: images.nameplate } : null,
    badges,
    summary: summaryOf(presence, config),
    accent: config.accent ?? plate?.color ?? profile.accent ?? NEUTRAL_ACCENT,
  };
};
