import { Hono, type Context } from "hono";
import { problem } from "@/api/problem";
import { presenceOf } from "@/discord/lanyard";
import { coerce, defaultsOf, ProtoError } from "@/proto";
import { tokens, TokenError } from "@/token";
import { drawCard, drawUnavailable } from "./card";
import { DiscordCard, type DiscordCardConfig } from "./schema";
import { CARD_PATH, MINT_PATH } from "./path";
import { DISCORD_TOKEN } from "./token";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
} as const;

const LIVE_CACHE = "public, max-age=15, s-maxage=15, stale-while-revalidate=45";
const FAILURE_CACHE = "public, max-age=5";

const origin = (c: Context): string => process.env.CARDS_ORIGIN ?? new URL(c.req.url).origin;

const parse = (input: unknown): DiscordCardConfig | ProtoError => {
  try {
    return coerce(DiscordCard, input);
  } catch (error) {
    if (error instanceof ProtoError) return error;
    throw error;
  }
};

const verify = async (token: string): Promise<DiscordCardConfig | TokenError> => {
  try {
    return (await tokens).verify(DISCORD_TOKEN, token);
  } catch (error) {
    if (error instanceof TokenError) return error;
    throw error;
  }
};

const svg = (c: Context, body: string, cache: string, status: 200 | 503 = 200): Response =>
  c.body(body, status, { ...SVG_HEADERS, "Cache-Control": cache });

export const cardRoutes = new Hono().get("/", async (c) => {
  const token = c.req.query("jwt") ?? c.req.query("t");
  if (!token) return problem(c, 400, "Missing token", `pass ?jwt=<token> minted from ${MINT_PATH}`);
  const config = await verify(token);
  if (config instanceof TokenError) return problem(c, 401, "Invalid token", config.message);
  try {
    const { svg: body, stale } = await drawCard(config);
    c.header("X-Card-Stale", stale ? "1" : "0");
    return svg(c, body, LIVE_CACHE);
  } catch (error) {
    console.error(error);
    return svg(c, drawUnavailable(config), FAILURE_CACHE, 503);
  }
});

export const mintRoutes = new Hono()
  .get("/defaults", (c) => {
    c.header("Cache-Control", "public, max-age=3600");
    return c.json(defaultsOf(DiscordCard));
  })
  .post("/token", async (c) => {
    const config = parse(await c.req.json().catch(() => null));
    if (config instanceof ProtoError) return problem(c, 422, "Invalid card", config.message);
    if (config.user === "0") return problem(c, 422, "Invalid card", "user: required");
    const token = (await tokens).sign(DISCORD_TOKEN, config);
    const tracked = await presenceOf(config.user)()
      .then((snapshot) => snapshot.value.status === "ok")
      .catch(() => null);
    c.header("Cache-Control", "no-store");
    return c.json({ token, url: `${origin(c)}${CARD_PATH}?jwt=${token}`, bytes: token.length, tracked });
  });
