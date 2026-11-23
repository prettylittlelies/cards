import { discordCard } from "@/cards/discord/card";
import { DiscordCard } from "@/cards/discord/schema";
import { coerce } from "@/proto";
import { fontFace, h, render } from "@/render";

const OUT = "assets";
const USER = process.argv[2] ?? "442626774841556992";
const BANNER = { width: 1280, height: 320 } as const;
const CARD_SCALE = 2;

const config = coerce(DiscordCard, { user: USER, font: "poppins", scale: CARD_SCALE });
const { svg: card } = await discordCard.draw(config);
await Bun.write(`${OUT}/example.svg`, card);

const cardWidth = config.width * CARD_SCALE;
const cardHeight = 42 * CARD_SCALE;

const banner = render(
  h(
    "svg",
    { xmlns: "http://www.w3.org/2000/svg", width: BANNER.width, height: BANNER.height, viewBox: `0 0 ${BANNER.width} ${BANNER.height}`, role: "img", "aria-label": "cards" },
    h("style", {}, `${await fontFace("poppins")}text{font-family:Poppins,sans-serif;font-weight:500}`),
    h("rect", { width: BANNER.width, height: BANNER.height, fill: "#000" }),
    h("text", { x: BANNER.width / 2, y: 118, "text-anchor": "middle", "font-size": 64, fill: "#ededed", "letter-spacing": -1.5 }, "cards"),
    h(
      "image",
      {
        href: `data:image/svg+xml;base64,${Buffer.from(card).toString("base64")}`,
        x: (BANNER.width - cardWidth) / 2,
        y: 170,
        width: cardWidth,
        height: cardHeight,
      },
    ),
  ),
);
await Bun.write(`${OUT}/banner.svg`, banner);

console.log(`wrote ${OUT}/example.svg (${card.length}b), ${OUT}/banner.svg (${banner.length}b)`);
