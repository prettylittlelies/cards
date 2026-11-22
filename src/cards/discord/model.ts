import { inlineAll, inlineImage } from "@/api/inline";
import { saturation } from "@/render/color";
import { activityArt, avatarUrl, decorationUrl, emojiUrl, spotifyArtUrl } from "@/discord/cdn";
import type { Activity, DiscordStatus, Presence, Profile } from "@/discord/types";
import { FALLBACK_ACCENT, type DiscordCardConfig } from "./schema";

export type Platform = "desktop" | "mobile" | "web";

export type ActivityModel = {
  readonly key: string;
  readonly kind: "spotify" | "activity";
  readonly heading: string;
  readonly title: string;
  readonly lines: readonly string[];
  readonly art: string | null;
  readonly badge: string | null;
  readonly start: number | null;
  readonly end: number | null;
};

export type CustomStatusModel = {
  readonly emoji: string | null;
  readonly image: string | null;
  readonly text: string;
};

export type BadgeModel = {
  readonly label: string;
  readonly image: string;
};

export type CardModel = {
  readonly name: string;
  readonly username: string;
  readonly status: DiscordStatus;
  readonly platforms: readonly Platform[];
  readonly avatar: string | null;
  readonly decoration: string | null;
  readonly badges: readonly BadgeModel[];
  readonly bio: string;
  readonly pronouns: string;
  readonly custom: CustomStatusModel | null;
  readonly activities: readonly ActivityModel[];
  readonly accent: number;
  readonly now: number;
};

const MIN_SATURATION = 0.2;
const CUSTOM_STATUS = 4;

const HEADINGS: Readonly<Record<number, string>> = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  5: "Competing in",
};

const platformsOf = (presence: Presence): Platform[] =>
  (
    [
      ["desktop", presence.active_on_discord_desktop],
      ["mobile", presence.active_on_discord_mobile],
      ["web", presence.active_on_discord_web],
    ] as const
  )
    .filter(([, active]) => active)
    .map(([platform]) => platform);

const spotifyOf = async (presence: Presence): Promise<ActivityModel | null> => {
  const track = presence.spotify;
  if (!presence.listening_to_spotify || !track) return null;
  return {
    key: `spotify:${track.track_id ?? track.song}`,
    kind: "spotify",
    heading: "Listening to Spotify",
    title: track.song,
    lines: [track.artist?.replaceAll(";", ",") ?? "", track.album ?? ""].filter(Boolean),
    art: await inlineImage(track.album_art_url ? spotifyArtUrl(track.album_art_url) : null),
    badge: null,
    start: track.timestamps.start ?? null,
    end: track.timestamps.end ?? null,
  };
};

const activityOf = async (activity: Activity): Promise<ActivityModel> => {
  const art = activityArt(activity, 128);
  const images = await inlineAll({ large: art.large, small: art.small });
  return {
    key: activity.id,
    kind: "activity",
    heading: HEADINGS[activity.type] ?? "Playing",
    title: activity.name,
    lines: [activity.details, activity.state, activity.assets?.large_text].filter(
      (line, index, all): line is string => Boolean(line) && line !== activity.name && all.indexOf(line) === index,
    ),
    art: images.large,
    badge: images.large ? images.small : null,
    start: activity.timestamps?.start ?? null,
    end: activity.timestamps?.end ?? null,
  };
};

const customOf = async (presence: Presence): Promise<CustomStatusModel | null> => {
  const custom = presence.activities.find((activity) => activity.type === CUSTOM_STATUS);
  if (!custom || (!custom.state && !custom.emoji)) return null;
  const emoji = custom.emoji;
  return {
    emoji: emoji && !emoji.id ? emoji.name : null,
    image: emoji?.id ? await inlineImage(emojiUrl(emoji.id, false)) : null,
    text: custom.state ?? "",
  };
};

const activitiesOf = async (presence: Presence, config: DiscordCardConfig): Promise<ActivityModel[]> => {
  const rest = config.show.activities
    ? presence.activities.filter((activity) => activity.type !== CUSTOM_STATUS && !activity.id.startsWith("spotify:"))
    : [];
  const models = await Promise.all([config.show.spotify ? spotifyOf(presence) : null, ...rest.map(activityOf)]);
  return models.filter((model): model is ActivityModel => model !== null).slice(0, config.activities);
};

export const buildModel = async (config: DiscordCardConfig, presence: Presence, profile: Profile): Promise<CardModel> => {
  const user = presence.discord_user;
  const animated = config.motion;
  const [images, badges, custom, activities] = await Promise.all([
    inlineAll({
      avatar: config.show.avatar ? avatarUrl(user, 128, animated.animatedAvatar) : null,
      decoration: config.show.avatar && config.show.decoration ? decorationUrl(user, 160, animated.animatedDecoration) : null,
    }),
    config.show.badges
      ? Promise.all(
          profile.badges.map(async ({ label, icon }): Promise<readonly BadgeModel[]> => {
            const image = await inlineImage(icon);
            return image ? [{ label, image }] : [];
          }),
        ).then((groups) => groups.flat())
      : [],
    config.show.customStatus ? customOf(presence) : null,
    activitiesOf(presence, config),
  ]);

  return {
    name: config.name || user.global_name || user.username,
    username: user.username,
    status: presence.discord_status,
    platforms: platformsOf(presence),
    avatar: images.avatar,
    decoration: images.decoration,
    badges,
    bio: config.tagline || profile.bio,
    pronouns: profile.pronouns,
    custom,
    activities,
    accent: config.accent ?? (profile.accent !== null && saturation(profile.accent) >= MIN_SATURATION ? profile.accent : FALLBACK_ACCENT),
    now: Date.now(),
  };
};
