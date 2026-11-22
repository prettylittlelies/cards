import { join } from "node:path";
import type { FontName } from "./theme";

type Face = {
  readonly family: string;
  readonly path: string;
};

const FACES: Readonly<Record<FontName, Face | null>> = {
  gg: { family: "gg sans", path: join(import.meta.dir, "..", "fonts", "ggsansmedium.woff2") },
  poppins: { family: "Poppins", path: Bun.resolveSync("@fontsource/poppins/files/poppins-latin-500-normal.woff2", import.meta.dir) },
  system: null,
};

const cache = new Map<FontName, Promise<string>>();

const load = async (name: FontName): Promise<string> => {
  const face = FACES[name];
  if (!face) return "";
  const bytes = await Bun.file(face.path).bytes();
  return `@font-face{font-family:'${face.family}';font-weight:500;src:url(data:font/woff2;base64,${Buffer.from(bytes).toString("base64")}) format("woff2")}`;
};

export const fontFace = (name: FontName): Promise<string> => {
  const existing = cache.get(name);
  if (existing) return existing;
  const created = load(name);
  cache.set(name, created);
  return created;
};
