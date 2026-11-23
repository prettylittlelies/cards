import type { ChatPhotoSize, FullUser, TelegramClient, tl, UserStatus } from "@mtcute/bun";

export type Backdrop = {
  readonly center: number;
  readonly edge: number;
  readonly pattern: number;
  readonly symbolId: string | null;
};

export type StatusGift = {
  readonly title: string;
  readonly slug: string;
  readonly modelId: string;
};

export type TelegramProfile = {
  readonly id: number;
  readonly name: string;
  readonly username: string;
  readonly premium: boolean;
  readonly status: UserStatus;
  readonly lastOnline: number | null;
  readonly avatar: ChatPhotoSize | null;
  readonly avatarKey: string | null;
  readonly gift: StatusGift | null;
  readonly backdrop: Backdrop | null;
};

export type ProfilePalette = ReadonlyMap<number, readonly number[]>;

const PATTERN_SHADE = 0.62;

const shade = (rgb: number, factor: number): number => {
  const channel = (offset: number) => Math.round(((rgb >> offset) & 0xff) * factor);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};

const profileSet = (set: tl.help.TypePeerColorSet | undefined): readonly number[] | null =>
  set?._ === "help.peerColorProfileSet" ? set.bgColors : null;

export const loadPalette = async (tg: TelegramClient): Promise<ProfilePalette> => {
  const result = await tg.call({ _: "help.getPeerProfileColors", hash: 0 });
  if (result._ !== "help.peerColors") return new Map();
  return new Map(
    result.colors.flatMap((option) => {
      const colors = profileSet(option.darkColors) ?? profileSet(option.colors);
      return colors ? [[option.colorId, colors] as const] : [];
    }),
  );
};

const profileColors = (raw: tl.TypePeerColor, palette: ProfilePalette): readonly number[] | null => {
  switch (raw._) {
    case "peerColorCollectible":
      return raw.darkColors ?? raw.colors;
    case "peerColor":
      return raw.color === undefined ? null : (palette.get(raw.color) ?? null);
    default:
      return null;
  }
};

const profileBackdrop = (user: FullUser, palette: ProfilePalette): Backdrop | null => {
  const raw = user.raw.profileColor;
  if (!raw) return null;
  const [center, edge = center, pattern] = profileColors(raw, palette) ?? [];
  if (center === undefined || edge === undefined) return null;
  const symbol = raw._ === "peerColor" || raw._ === "peerColorCollectible" ? raw.backgroundEmojiId : undefined;
  return { center, edge, pattern: pattern ?? shade(edge, PATTERN_SHADE), symbolId: symbol?.toString() ?? null };
};

const giftOf = (user: FullUser): { readonly gift: StatusGift; readonly backdrop: Backdrop } | null => {
  const collectible = user.emojiStatus?.collectible?.raw;
  if (!collectible) return null;
  return {
    gift: { title: collectible.title, slug: collectible.slug, modelId: collectible.documentId.toString() },
    backdrop: {
      center: collectible.centerColor,
      edge: collectible.edgeColor,
      pattern: collectible.patternColor,
      symbolId: collectible.patternDocumentId.toString(),
    },
  };
};

export const toProfile = (user: FullUser, username: string, palette: ProfilePalette): TelegramProfile => {
  const status = giftOf(user);
  const photo = user.photo;
  return {
    id: user.id,
    name: user.displayName,
    username: user.username ?? username,
    premium: user.isPremium,
    status: user.status,
    lastOnline: user.lastOnline?.getTime() ?? null,
    avatar: photo?.small ?? null,
    avatarKey: photo?.small.uniqueFileId ?? null,
    gift: status?.gift ?? null,
    backdrop: status?.backdrop ?? profileBackdrop(user, palette),
  };
};
