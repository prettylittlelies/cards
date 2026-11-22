import type { FontName } from "./theme";

const FACES: Readonly<Record<FontName, string | null>> = {
  poppins: "@fontsource/poppins/files/poppins-latin-500-normal.woff2",
  system: null,
};

const cache = new Map<FontName, Promise<string>>();

const load = async (name: FontName): Promise<string> => {
  const specifier = FACES[name];
  if (!specifier) return "";
  const bytes = await Bun.file(Bun.resolveSync(specifier, import.meta.dir)).bytes();
  const family = name[0]!.toUpperCase() + name.slice(1);
  return `@font-face{font-family:${family};font-weight:500;src:url(data:font/woff2;base64,${Buffer.from(bytes).toString("base64")}) format("woff2")}`;
};

export const fontFace = (name: FontName): Promise<string> => {
  const existing = cache.get(name);
  if (existing) return existing;
  const created = load(name);
  cache.set(name, created);
  return created;
};
