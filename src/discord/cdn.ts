import type { Activity, DiscordUser } from "./types";

export const DISCORD_CDN = "https://cdn.discordapp.com";
const MEDIA_PROXY = "https://media.discordapp.net";
const SPOTIFY_CDN = "https://i.scdn.co/image";
const SPOTIFY_SIZES = /^ab67616d0000(b273|1e02|4851)/;
const SPOTIFY_THUMB = "ab67616d00004851";

export type CdnSize = 16 | 32 | 64 | 96 | 128 | 160 | 256 | 512;

export const defaultAvatarUrl = (userId: string): string =>
  `${DISCORD_CDN}/embed/avatars/${Number((BigInt(userId) >> 22n) % 6n)}.png`;

export const avatarUrl = (user: Pick<DiscordUser, "id" | "avatar">, size: CdnSize, animated: boolean): string => {
  if (!user.avatar) return defaultAvatarUrl(user.id);
  const format = animated && user.avatar.startsWith("a_") ? "gif" : "webp";
  return `${DISCORD_CDN}/avatars/${user.id}/${user.avatar}.${format}?size=${size}`;
};

export const decorationUrl = (user: Pick<DiscordUser, "avatar_decoration_data">, size: CdnSize, animated: boolean): string | null => {
  const asset = user.avatar_decoration_data?.asset;
  return asset ? `${DISCORD_CDN}/avatar-decoration-presets/${asset}.png?size=${size}&passthrough=${animated}` : null;
};

export const badgeUrl = (icon: string): string => `${DISCORD_CDN}/badge-icons/${icon}.png?size=32`;

export const spotifyArtUrl = (url: string): string => {
  const id = url.slice(url.lastIndexOf("/") + 1);
  return `${SPOTIFY_CDN}/${id.replace(SPOTIFY_SIZES, SPOTIFY_THUMB)}`;
};

export const emojiUrl = (id: string, animated: boolean): string =>
  `${DISCORD_CDN}/emojis/${id}.${animated ? "gif" : "webp"}?size=48`;

const resolveAsset = (raw: string | undefined, applicationId: string | undefined, size: CdnSize): string | null => {
  if (!raw) return null;
  if (raw.startsWith("spotify:")) return `${SPOTIFY_CDN}/${raw.slice(8).replace(SPOTIFY_SIZES, SPOTIFY_THUMB)}`;
  if (raw.startsWith("mp:")) return `${MEDIA_PROXY}/${raw.slice(3)}?width=${size}&height=${size}`;
  if (/^https?:\/\//.test(raw)) return raw;
  return applicationId && /^\d+$/.test(raw) ? `${DISCORD_CDN}/app-assets/${applicationId}/${raw}.png?size=${size}` : null;
};

export const activityArt = (activity: Activity, size: CdnSize) => ({
  large: resolveAsset(activity.assets?.large_image, activity.application_id, size),
  small: resolveAsset(activity.assets?.small_image, activity.application_id, 32),
});
