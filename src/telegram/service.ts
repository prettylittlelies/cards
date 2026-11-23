import type { TelegramClient } from "@mtcute/bun";
import { hotSingleton } from "@/api/hot";
import { keyed, resource, type Resource } from "@/api/resource";
import { DAY, MINUTE, SECOND } from "@/api/time";
import { loadTelegramConfig } from "./config";
import { createConnection, type TelegramConnection } from "./connection";
import { createConsentStore, type ConsentStore } from "./consent";
import { loadEmojiArt, type EmojiArt } from "./emoji";
import { loadPalette, toProfile, type ProfilePalette, type TelegramProfile } from "./profile";

export type ProfileLookup =
  | { readonly status: "ok"; readonly profile: TelegramProfile }
  | { readonly status: "private" }
  | { readonly status: "unconfigured" };

export type Account = {
  readonly username: string;
  readonly name: string;
};

export type TelegramService = {
  readonly consent: ConsentStore;
  readonly account: () => Promise<Account | null>;
  readonly profile: (username: string) => Resource<ProfileLookup>;
  readonly avatar: (profile: TelegramProfile) => Promise<string | null>;
  readonly emoji: (documentId: string) => Promise<EmojiArt>;
  readonly warm: () => void;
  readonly close: () => Promise<void>;
};

const PROFILE_OPTIONS = { ttlMs: 30 * SECOND, staleMs: 10 * MINUTE, timeoutMs: 20 * SECOND, retryMs: 30 * SECOND };
const ASSET_OPTIONS = { ttlMs: DAY, staleMs: 7 * DAY, timeoutMs: 30 * SECOND, retryMs: 10 * MINUTE };
const EMPTY_ART: EmojiArt = { outline: null, image: null };

const settle = async <T>(label: string, source: Resource<T>, fallback: T): Promise<T> => {
  try {
    return (await source()).value;
  } catch (error) {
    console.error(`telegram: ${label} failed`, error);
    return fallback;
  }
};

const live = (connection: TelegramConnection, consent: ConsentStore): TelegramService => {
  const run = <T>(signal: AbortSignal, task: (tg: TelegramClient) => Promise<T>): Promise<T> =>
    Promise.race([
      connection.client().then(task).catch((error: unknown) => {
        connection.report(error);
        throw error;
      }),
      new Promise<never>((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true })),
    ]);

  const account = resource<Account | null>(
    (signal) => run(signal, async (tg) => {
      const me = await tg.getMe();
      return me.username ? { username: me.username, name: me.displayName } : null;
    }),
    ASSET_OPTIONS,
  );

  const palette = resource<ProfilePalette>((signal) => run(signal, loadPalette), { ...ASSET_OPTIONS, ttlMs: DAY });

  const profiles = keyed(
    ({ username, generation }: { readonly username: string; readonly generation: number }) => `${username.toLowerCase()}:${generation}`,
    ({ username }) =>
      resource<ProfileLookup>(async (signal) => {
        const granted = await consent.lookup(username);
        if (!granted) return { status: "private" };
        const [user, colors] = await Promise.all([
          run(signal, (tg) => tg.getFullUser(granted.id).catch(() => tg.getFullUser(granted.username))),
          settle("profile colours", palette, new Map() as ProfilePalette),
        ]);
        if (user.id !== granted.id) return { status: "private" };
        return { status: "ok", profile: toProfile(user, granted.username, colors) };
      }, PROFILE_OPTIONS),
    512,
  );

  const avatars = keyed(
    (entry: TelegramProfile) => entry.avatarKey ?? `none:${entry.id}`,
    (entry) =>
      resource<string | null>(async (signal) => {
        const location = entry.avatar;
        if (!location) return null;
        const bytes = await run(signal, (tg) => tg.downloadAsBuffer(location));
        return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
      }, ASSET_OPTIONS),
    512,
  );

  const emojis = keyed(
    (documentId: string) => documentId,
    (documentId) => resource((signal) => run(signal, (tg) => loadEmojiArt(tg, documentId)), ASSET_OPTIONS),
    1024,
  );

  return {
    consent,
    account: () => settle("account", account, null),
    profile: (username) => profiles({ username, generation: consent.generation() }),
    avatar: (entry) => settle(`avatar ${entry.id}`, avatars(entry), null),
    emoji: (documentId) => settle(`emoji ${documentId}`, emojis(documentId), EMPTY_ART),
    warm: () => void connection.client().catch((error: unknown) => console.error("telegram:", error)),
    close: connection.close,
  };
};

const unconfigured = (consent: ConsentStore): TelegramService => ({
  consent,
  account: () => Promise.resolve(null),
  profile: () => () => Promise.resolve({ value: { status: "unconfigured" }, fetchedAt: Date.now(), stale: false }),
  avatar: () => Promise.resolve(null),
  emoji: () => Promise.resolve(EMPTY_ART),
  warm: () => undefined,
  close: () => Promise.resolve(),
});

export const telegram: TelegramService = hotSingleton("telegram", () => {
  const consent = createConsentStore();
  const config = loadTelegramConfig();
  return config ? live(createConnection(config, consent), consent) : unconfigured(consent);
});
