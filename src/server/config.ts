import { ASSET_PREFIX } from "../asset-dir";
import type { ServerConfig } from "./types";

const integer = (raw: string | undefined, fallback: number): number => {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
};

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): ServerConfig =>
  Object.freeze({
    root: env.STATIC_ROOT ?? "dist",
    port: integer(env.PORT, 3000),
    hostname: env.HOST ?? "0.0.0.0",
    entry: "/index.html",
    immutablePrefix: ASSET_PREFIX,
    compressMinBytes: integer(env.COMPRESS_MIN_BYTES, 1024),
  });
