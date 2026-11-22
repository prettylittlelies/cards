import { Hono } from "hono";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { CARD_PATH } from "@/cards/discord/path";
import { cardRoutes, mintRoutes } from "@/cards/discord/routes";
import { compress } from "./compress";
import { problem } from "./problem";

export const API_BASE = "/x";
export const CARDS_BASE = "/cards";
export const ROUTES = [API_BASE, CARDS_BASE] as const;

export const ownsPath = (path: string): boolean => ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

export const createApi = () =>
  new Hono({ strict: false })
    .use(
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
    )
    .route(CARD_PATH, cardRoutes)
    .route(`${API_BASE}${CARD_PATH}`, mintRoutes)
    .notFound((c) => problem(c, 404, "Not found"))
    .onError((error, c) => {
      console.error(error);
      return problem(c, 500, "Internal error");
    });

export type Api = ReturnType<typeof createApi>;
