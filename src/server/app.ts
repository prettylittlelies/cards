import { createApi, ownsPath } from "@/api/app";
import { loadConfig } from "./config";
import { loadManifest } from "./manifest";
import { createRouter } from "./router";
import type { ServerConfig } from "./types";

export const createApp = async (config: ServerConfig = loadConfig()) => {
  const manifest = await loadManifest(config);
  const api = createApi();
  return { config, manifest, fetch: createRouter(config, manifest, api.fetch, ownsPath) } as const;
};
