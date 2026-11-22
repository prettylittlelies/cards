import type { DiscordUser } from "./types";

export const DISCORD_CDN = "https://cdn.discordapp.com";

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

export const nameplateUrl = (asset: string, animated: boolean): string =>
  `${DISCORD_CDN}/assets/collectibles/${asset.endsWith("/") ? asset : `${asset}/`}${animated ? "img" : "static"}.png`;
