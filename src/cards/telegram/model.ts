import type { UserStatus } from "@mtcute/bun";
import { inlineImage } from "@/api/inline";
import type { TelegramProfile } from "@/telegram/profile";
import type { TelegramService } from "@/telegram/service";
import type { TelegramCardConfig } from "./schema";

export type SceneModel = {
  readonly center: number;
  readonly edge: number;
  readonly symbol: string | null;
};

export type GiftModel = {
  readonly label: string;
  readonly image: string;
};

export type TelegramModel = {
  readonly name: string;
  readonly online: boolean;
  readonly seen: string;
  readonly premium: boolean;
  readonly avatar: string | null;
  readonly gift: GiftModel | null;
  readonly scene: SceneModel | null;
  readonly accent: number;
};

const TELEGRAM_BLUE = 0x2aabee;
const GIFT_FALLBACK = (documentId: string) => `https://api.changes.tg/document/${documentId}.png?size=128`;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const VAGUE: Partial<Record<UserStatus, string>> = {
  recently: "last seen recently",
  within_week: "last seen within a week",
  within_month: "last seen within a month",
  long_time_ago: "last seen a long time ago",
};

const ago = (elapsed: number): string => {
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ${Math.floor((elapsed % HOUR) / MINUTE)}m ago`;
  return `${Math.floor(elapsed / DAY)}d ago`;
};

const seenOf = ({ status, lastOnline }: TelegramProfile, now: number): { readonly online: boolean; readonly label: string } => {
  if (status === "online") return { online: true, label: "online" };
  if (lastOnline !== null) return { online: false, label: `last seen ${ago(now - lastOnline)}` };
  return { online: false, label: VAGUE[status] ?? "last seen recently" };
};

export const buildModel = async (config: TelegramCardConfig, profile: TelegramProfile, service: TelegramService): Promise<TelegramModel> => {
  const { show } = config;
  const { gift, backdrop } = profile;
  const [avatar, model, symbol] = await Promise.all([
    show.avatar ? service.avatar(profile) : null,
    show.gift && gift ? service.emoji(gift.modelId) : null,
    show.scene && backdrop?.symbolId ? service.emoji(backdrop.symbolId) : null,
  ]);
  const giftImage = gift && model ? (model.image ?? (await inlineImage(GIFT_FALLBACK(gift.modelId)))) : null;
  const seen = seenOf(profile, Date.now());

  return {
    name: config.name || profile.name,
    online: seen.online,
    seen: show.seen ? seen.label : `@${profile.username}`,
    premium: show.premium && profile.premium,
    avatar,
    gift: gift && giftImage ? { label: gift.title, image: giftImage } : null,
    scene: show.scene && backdrop ? { center: backdrop.center, edge: backdrop.edge, symbol: symbol?.outline ?? null } : null,
    accent: config.accent ?? backdrop?.center ?? TELEGRAM_BLUE,
  };
};
