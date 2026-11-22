import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { encodeAll } from "./compress";
import type { Asset, Manifest, ServerConfig } from "./types";

const HIDDEN = /(^|\/)\.|\.map$/;

const walk = async (dir: string): Promise<string[]> =>
  (await readdir(dir, { recursive: true, withFileTypes: true }))
    .filter((d) => d.isFile())
    .map((d) => join(d.parentPath, d.name));

const toUrlPath = (root: string, file: string): string => `/${relative(root, file).split(sep).join("/")}`;

const digest = (bytes: Uint8Array<ArrayBuffer>): string =>
  `"${new Bun.CryptoHasher("sha256").update(bytes).digest("base64url").slice(0, 27)}"`;

const buildAsset = async (config: ServerConfig, file: string): Promise<Asset> => {
  const handle = Bun.file(file);
  const raw: Uint8Array<ArrayBuffer> = new Uint8Array(await handle.arrayBuffer());
  const path = toUrlPath(config.root, file);
  const type = handle.type;
  return Object.freeze({
    path,
    type,
    etag: digest(raw),
    lastModified: new Date(handle.lastModified).toUTCString(),
    policy: path.startsWith(config.immutablePrefix) ? "immutable" : "revalidate",
    bodies: encodeAll(raw, type, config.compressMinBytes),
  });
};

export const loadManifest = async (config: ServerConfig): Promise<Manifest> => {
  const files = (await walk(config.root)).filter((f) => !HIDDEN.test(toUrlPath(config.root, f)));
  const assets = await Promise.all(files.map((f) => buildAsset(config, f)));
  const manifest = new Map(assets.map((a) => [a.path, a] as const));
  if (!manifest.has(config.entry)) throw new Error(`missing ${config.entry} in ${config.root}; run \`bun run build\``);
  return manifest;
};
