import { Hono, type Context } from "hono";
import { problem } from "@/api/problem";
import { coerce, defaultsOf, ProtoError, type Schema } from "@/proto";
import { tokens, TokenError } from "@/token";
import type { CardDefinition } from "./kind";
import { cardPath, mintPath } from "./paths";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'",
  "X-Content-Type-Options": "nosniff",
} as const;

const LIVE_CACHE = "public, max-age=15, s-maxage=15, stale-while-revalidate=45";
const FAILURE_CACHE = "public, max-age=5";

const origin = (c: Context): string => process.env.CARDS_ORIGIN ?? new URL(c.req.url).origin;

const svg = (c: Context, body: string, cache: string, status: 200 | 503 = 200): Response =>
  c.body(body, status, { ...SVG_HEADERS, "Cache-Control": cache });

const attempt = <T, E extends Error>(run: () => T, expected: new (...args: never[]) => E): T | E => {
  try {
    return run();
  } catch (error) {
    if (error instanceof expected) return error;
    throw error;
  }
};

export const cardRoutes = <S extends Schema>(card: CardDefinition<S>) =>
  new Hono().get("/", async (c) => {
    const token = c.req.query("jwt") ?? c.req.query("t");
    if (!token) return problem(c, 400, "Missing token", `pass ?jwt=<token> minted from ${mintPath(card.kind)}`);
    const signer = await tokens;
    const config = attempt(() => signer.verify(card.token, token), TokenError);
    if (config instanceof TokenError) return problem(c, 401, "Invalid token", config.message);
    try {
      const { svg: body, stale } = await card.draw(config);
      c.header("X-Card-Stale", stale ? "1" : "0");
      return svg(c, body, LIVE_CACHE);
    } catch (error) {
      console.error(error);
      return svg(c, await card.unavailable(config), FAILURE_CACHE, 503);
    }
  });

export const mintRoutes = <S extends Schema>(card: CardDefinition<S>) =>
  new Hono()
    .get("/defaults", (c) => {
      c.header("Cache-Control", "public, max-age=3600");
      return c.json(defaultsOf(card.token.schema));
    })
    .get("/about", async (c) => {
      c.header("Cache-Control", "public, max-age=300");
      return c.json((await card.about?.()) ?? {});
    })
    .post("/token", async (c) => {
      const body: unknown = await c.req.json().catch(() => null);
      const config = attempt(() => coerce(card.token.schema, body), ProtoError);
      if (config instanceof ProtoError) return problem(c, 422, "Invalid card", config.message);
      const invalid = card.validate(config);
      if (invalid) return problem(c, 422, "Invalid card", invalid);
      const token = (await tokens).sign(card.token, config);
      const info = await card.inspect(config).catch(() => ({}));
      c.header("Cache-Control", "no-store");
      return c.json({ token, url: `${origin(c)}${cardPath(card.kind)}?jwt=${token}`, bytes: token.length, ...info });
    });

export type MountedCard = {
  readonly kind: CardDefinition<Schema>["kind"];
  readonly card: Hono;
  readonly mint: Hono;
};

export const mountCard = <S extends Schema>(card: CardDefinition<S>): MountedCard => ({
  kind: card.kind,
  card: cardRoutes(card),
  mint: mintRoutes(card),
});
