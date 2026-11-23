export type TelegramConfig = {
  readonly apiId: number;
  readonly apiHash: string;
  readonly session: string;
};

export type TelegramCredentials = Omit<TelegramConfig, "session">;

const read = (env: NodeJS.ProcessEnv, key: string): string | null => env[key]?.trim() || null;

export const loadCredentials = (env: NodeJS.ProcessEnv = process.env): TelegramCredentials | null => {
  const apiId = Number(read(env, "TELEGRAM_API_ID"));
  const apiHash = read(env, "TELEGRAM_API_HASH");
  return Number.isSafeInteger(apiId) && apiId > 0 && apiHash ? { apiId, apiHash } : null;
};

export const loadTelegramConfig = (env: NodeJS.ProcessEnv = process.env): TelegramConfig | null => {
  const credentials = loadCredentials(env);
  const session = read(env, "TELEGRAM_SESSION");
  return credentials && session ? { ...credentials, session } : null;
};
