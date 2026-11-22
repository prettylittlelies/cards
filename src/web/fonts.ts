import { FONT_PREFIX } from "@/asset-dir";

const FAMILY = "gg sans";

const FACES = [
  [400, "ggsans"],
  [500, "ggsansmedium"],
  [600, "ggsanssemibold"],
  [700, "ggsansbold"],
] as const;

export const loadFonts = (): Promise<void> =>
  Promise.all(
    FACES.map(async ([weight, file]) => {
      const face = new FontFace(FAMILY, `url(${FONT_PREFIX}/${file}.woff2) format("woff2")`, { weight: String(weight), display: "swap" });
      document.fonts.add(await face.load());
    }),
  ).then(() => undefined, () => undefined);
