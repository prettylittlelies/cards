import { join } from "node:path";
import type { Entry, ResourceStore } from "./resource";

const CACHE_DIR = process.env.CACHE_DIR ?? ".cache";

const isEntry = (value: unknown): value is Entry<unknown> =>
  typeof value === "object" && value !== null && "value" in value && typeof (value as Entry<unknown>).fetchedAt === "number";

export const diskStore = <T>(name: string): ResourceStore<T> => {
  const path = join(CACHE_DIR, `${name}.json`);
  return {
    load: async () => {
      const file = Bun.file(path);
      if (!(await file.exists())) return null;
      const parsed: unknown = await file.json();
      return isEntry(parsed) ? (parsed as Entry<T>) : null;
    },
    save: async (entry) => {
      await Bun.write(path, JSON.stringify(entry), { createPath: true });
    },
  };
};
