import type { Activity, Presence } from "./types";

export const ActivityType = {
  Playing: 0,
  Streaming: 1,
  Listening: 2,
  Watching: 3,
  Custom: 4,
  Competing: 5,
} as const;

export const ACTIVITY_KINDS = ["spotify", "code", "game", "stream", "media", "generic"] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

const CODE_NAMES = new Set(["Code", "Visual Studio Code", "Visual Studio Code - Insiders", "VSCord"]);

export const detectKind = (activity: Activity): ActivityKind => {
  if (activity.type === ActivityType.Listening && (activity.name === "Spotify" || Boolean(activity.sync_id))) return "spotify";
  if (CODE_NAMES.has(activity.name)) return "code";
  if (activity.type === ActivityType.Streaming) return "stream";
  if (activity.type === ActivityType.Watching) return "media";
  if (activity.type === ActivityType.Playing) return "game";
  return "generic";
};

export const isVisibleActivity = (activity: Activity): boolean => activity.type !== ActivityType.Custom && Boolean(activity.name);

export const customStatusOf = (activities: readonly Activity[]): Activity | undefined =>
  activities.find((activity) => activity.type === ActivityType.Custom && (activity.state || activity.emoji));

export const PLATFORMS = ["desktop", "web", "mobile", "embedded", "vr"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const activePlatforms = (presence: Presence): Platform[] =>
  PLATFORMS.filter((platform) => presence[`active_on_discord_${platform}`]);
