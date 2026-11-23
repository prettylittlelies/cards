import { join } from "node:path";
import { MemoryStorage, SqliteStorage, TelegramClient, tl, type Message } from "@mtcute/bun";
import type { TelegramConfig, TelegramCredentials } from "./config";
import type { ConsentStore } from "./consent";

const CACHE_DIR = process.env.CACHE_DIR ?? ".cache";
const STORAGE_FILE = join(CACHE_DIR, "telegram.sqlite");
const BUILDER_URL = `${process.env.CARDS_ORIGIN ?? "https://discord.bhoppi.ng"}/?card=telegram`;

const OPT_IN = /^\/(start|card|cards)\b/i;
const OPT_OUT = /^\/stop\b/i;

const REPLIES = {
  granted: (username: string) => `You're in. Your card for @${username} is ready to build at ${BUILDER_URL}\n\nSend /stop any time to remove it.`,
  noUsername: "Set a public username in Telegram settings first, then send /card again.",
  revoked: "Done. Your card stops updating and shows as unavailable.",
  unknown: "Send /card to opt in to a Telegram card, or /stop to opt out.",
} as const;

export const DEVICE = {
  deviceModel: "cards.bhoppi.ng",
  systemVersion: "Linux",
  appVersion: "cards 1.0",
  systemLangCode: "en",
  langCode: "en",
} as const;

export const createClient = (credentials: TelegramCredentials, storage?: string): TelegramClient =>
  new TelegramClient({
    ...credentials,
    storage: storage ? new SqliteStorage(storage) : new MemoryStorage(),
    initConnectionOptions: DEVICE,
  });

export class SessionRevokedError extends Error {
  override readonly name = "SessionRevokedError";
}

const REVOKED = ["AUTH_KEY_DUPLICATED", "AUTH_KEY_UNREGISTERED", "SESSION_REVOKED"] as const;

export const isRevoked = (error: unknown): boolean =>
  REVOKED.some((text) => tl.RpcError.is(error, text)) || (error instanceof Error && REVOKED.some((text) => error.message.includes(text)));

export type TelegramConnection = {
  readonly client: () => Promise<TelegramClient>;
  readonly report: (error: unknown) => void;
  readonly close: () => Promise<void>;
};

const respond = async (tg: TelegramClient, consent: ConsentStore, message: Message): Promise<void> => {
  if (message.chat.type !== "user" || message.isOutgoing || !message.text) return;
  const sender = message.sender;
  if (sender.type !== "user" || sender.isBot) return;
  if (OPT_OUT.test(message.text)) {
    await consent.revoke(sender.id);
    await tg.answerText(message, REPLIES.revoked);
    return;
  }
  if (!OPT_IN.test(message.text)) {
    await tg.answerText(message, REPLIES.unknown);
    return;
  }
  if (!sender.username) {
    await tg.answerText(message, REPLIES.noUsername);
    return;
  }
  await consent.grant(sender.id, sender.username);
  await tg.answerText(message, REPLIES.granted(sender.username));
};

export const createConnection = (config: TelegramConfig, consent: ConsentStore): TelegramConnection => {
  let pending: Promise<TelegramClient> | null = null;
  let revoked = false;

  const revoke = (instance: TelegramClient): void => {
    if (revoked) return;
    revoked = true;
    pending = null;
    console.error("telegram: session was invalidated by Telegram; run `bun run telegram:login` and replace TELEGRAM_SESSION");
    void instance.destroy().catch(() => undefined);
  };

  const client = (): Promise<TelegramClient> => {
    if (revoked) return Promise.reject(new SessionRevokedError("telegram session revoked"));
    return (pending ??= (async () => {
      const instance = createClient(config, STORAGE_FILE);
      instance.onError.add((error) => {
        if (isRevoked(error)) revoke(instance);
      });
      instance.onNewMessage.add((message) => void respond(instance, consent, message).catch((error: unknown) => console.error(error)));
      try {
        await instance.start({ session: config.session, sessionForce: true });
      } catch (error) {
        if (isRevoked(error)) revoke(instance);
        throw error;
      }
      return instance;
    })().catch((error: unknown) => {
      pending = null;
      throw error;
    }));
  };

  const close = async (): Promise<void> => {
    const current = pending;
    pending = null;
    await current?.then((instance) => instance.destroy()).catch(() => undefined);
  };

  const report = (error: unknown): void => {
    if (isRevoked(error)) void pending?.then(revoke, () => undefined);
  };

  return { client, report, close };
};
