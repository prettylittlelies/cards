import { join } from "node:path";
import { SqliteStorage, TelegramClient, type Message } from "@mtcute/bun";
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

export const createClient = (credentials: TelegramCredentials, storage?: string): TelegramClient =>
  new TelegramClient({ ...credentials, storage: storage ? new SqliteStorage(storage) : undefined });

export type TelegramConnection = {
  readonly client: () => Promise<TelegramClient>;
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

  const client = (): Promise<TelegramClient> =>
    (pending ??= (async () => {
      const instance = createClient(config, STORAGE_FILE);
      instance.onNewMessage.add((message) => void respond(instance, consent, message).catch((error: unknown) => console.error(error)));
      await instance.start({ session: config.session, sessionForce: true });
      return instance;
    })().catch((error: unknown) => {
      pending = null;
      throw error;
    }));

  const close = async (): Promise<void> => {
    const current = pending;
    pending = null;
    await current?.then((instance) => instance.destroy()).catch(() => undefined);
  };

  return { client, close };
};
