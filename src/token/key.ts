const KEY_ENV = "CARDS_SECRET";
const KEY_FILE = ".cardkey";
const MIN_BYTES = 32;

const decode = (text: string): Uint8Array => new Uint8Array(Buffer.from(text.trim(), "base64"));

const fromEnv = (): Uint8Array | null => {
  const raw = process.env[KEY_ENV];
  if (!raw) return null;
  const key = decode(raw);
  if (key.byteLength < MIN_BYTES) throw new Error(`${KEY_ENV} must decode to at least ${MIN_BYTES} bytes`);
  return key;
};

const fromFile = async (): Promise<Uint8Array> => {
  const file = Bun.file(KEY_FILE);
  if (await file.exists()) {
    const existing = decode(await file.text());
    if (existing.byteLength >= MIN_BYTES) return existing;
  }
  if (process.env.NODE_ENV === "production") console.warn(`${KEY_ENV} unset; minting with an ephemeral ${KEY_FILE}`);
  const created = crypto.getRandomValues(new Uint8Array(MIN_BYTES));
  await Bun.write(KEY_FILE, Buffer.from(created).toString("base64"));
  return created;
};

export const loadSecret = async (): Promise<Uint8Array> => fromEnv() ?? (await fromFile());
