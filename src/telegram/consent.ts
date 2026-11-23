import { join } from "node:path";

export type Consent = {
  readonly id: number;
  readonly username: string;
  readonly grantedAt: string;
};

const CACHE_DIR = process.env.CACHE_DIR ?? ".cache";
const FILE = join(CACHE_DIR, "telegram-consent.json");

const keyOf = (username: string): string => username.replace(/^@/, "").toLowerCase();

const isConsent = (value: unknown): value is Consent =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Consent).id === "number" &&
  typeof (value as Consent).username === "string" &&
  typeof (value as Consent).grantedAt === "string";

export type ConsentStore = {
  readonly lookup: (username: string) => Promise<Consent | null>;
  readonly grant: (id: number, username: string) => Promise<void>;
  readonly revoke: (id: number) => Promise<boolean>;
  readonly generation: () => number;
};

export const createConsentStore = (path: string = FILE): ConsentStore => {
  let entries: Promise<Map<string, Consent>> | null = null;
  let changes = 0;

  const load = (): Promise<Map<string, Consent>> =>
    (entries ??= (async () => {
      const file = Bun.file(path);
      const raw: unknown = (await file.exists()) ? await file.json().catch(() => []) : [];
      const list = Array.isArray(raw) ? raw.filter(isConsent) : [];
      return new Map(list.map((entry) => [keyOf(entry.username), entry]));
    })());

  const save = async (map: Map<string, Consent>): Promise<void> => {
    changes += 1;
    await Bun.write(path, JSON.stringify([...map.values()], null, 2), { createPath: true });
  };

  return {
    lookup: async (username) => (await load()).get(keyOf(username)) ?? null,
    grant: async (id, username) => {
      const map = await load();
      for (const [key, entry] of map) if (entry.id === id) map.delete(key);
      map.set(keyOf(username), { id, username, grantedAt: new Date().toISOString() });
      await save(map);
    },
    revoke: async (id) => {
      const map = await load();
      const keys = [...map].filter(([, entry]) => entry.id === id).map(([key]) => key);
      for (const key of keys) map.delete(key);
      if (keys.length > 0) await save(map);
      return keys.length > 0;
    },
    generation: () => changes,
  };
};
