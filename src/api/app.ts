import { Hono } from "hono";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { CARDS } from "@/cards/registry";

import { cardPath } from "@/cards/paths";
import { compress } from "./compress";
import { problem } from "./problem";

export const API_BASE = "/x";
export const CARDS_BASE = "/cards";
export const ROUTES = [API_BASE, CARDS_BASE] as const;

export const ownsPath = (path: string): boolean => ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

const mount = (app: Hono): Hono => {
  for (const card of CARDS) {
    app.route(cardPath(card.kind), card.card);
    app.route(`${API_BASE}${cardPath(card.kind)}`, card.mint);
  }
  return app;
};

export const createApi = () =>
  mount(
    new Hono({ strict: false }).use(
      requestId(),
      secureHeaders({
        crossOriginResourcePolicy: "cross-origin",
        strictTransportSecurity: "max-age=63072000; includeSubDomains",
        xFrameOptions: "DENY",
      }),
      timing({ totalDescription: "total" }),
      cors({
        origin: "*",
        allowMethods: ["GET", "HEAD", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type"],
        exposeHeaders: ["ETag", "Server-Timing", "X-Request-Id", "X-Card-Stale"],
      }),
      compress(),
      etag(),
    ),
  )
    .notFound((c) => problem(c, 404, "Not found"))
    .onError((error, c) => {
      console.error(error);
      return problem(c, 500, "Internal error");
    });

export type Api = ReturnType<typeof createApi>;
