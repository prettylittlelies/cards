import { join } from "node:path";
import { openSync, type Font } from "fontkit";
import { estimate, graphemes, type Measure } from "./text";
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

const faces = new Map<FontName, Promise<string>>();
const metrics = new Map<FontName, Measure>();

const SYSTEM_SAFETY = 1.1;

const systemMeasure: Measure = (text) => estimate(text) * SYSTEM_SAFETY;

const load = async (name: FontName): Promise<string> => {
  const face = FACES[name];
  if (!face) return "";
  const bytes = await Bun.file(face.path).bytes();
  return `@font-face{font-family:'${face.family}';font-weight:500;src:url(data:font/woff2;base64,${Buffer.from(bytes).toString("base64")}) format("woff2")}`;
};

export const fontFace = (name: FontName): Promise<string> => {
  const existing = faces.get(name);
  if (existing) return existing;
  const created = load(name);
  faces.set(name, created);
  return created;
};

const covers = (font: Font, grapheme: string): boolean => [...grapheme].every((char) => font.hasGlyphForCodePoint(char.codePointAt(0)!));

const fromFont = (font: Font): Measure => (text) => {
  const parts = graphemes(text);
  const native = parts.filter((g) => covers(font, g)).join("");
  const fallback = parts.filter((g) => !covers(font, g)).join("");
  const advance = font.layout(native).glyphs.reduce((sum, glyph) => sum + glyph.advanceWidth, 0) / font.unitsPerEm;
  return advance + estimate(fallback);
};

export const metricsOf = (name: FontName): Measure => {
  const existing = metrics.get(name);
  if (existing) return existing;
  const face = FACES[name];
  const created = face ? fromFont(openSync(face.path) as Font) : systemMeasure;
  metrics.set(name, created);
  return created;
};
