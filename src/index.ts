import { basename, join } from "node:path";
import { serve } from "bun";
import { createApi, ROUTES } from "@/api/app";
import { FONT_DIR, FONT_PREFIX } from "./asset-dir";
import index from "./web/index.html";

const api = createApi();

const font = (req: Request): Response => {
  const file = Bun.file(join(FONT_DIR, basename(new URL(req.url).pathname)));
  return new Response(file, { headers: { "Content-Type": "font/woff2" } });
};

const server = serve({
  routes: Object.fromEntries([
    ["/*", index],
    [`${FONT_PREFIX}/*`, font],
    ...ROUTES.flatMap((route) => [
      [route, api.fetch],
      [`${route}/*`, api.fetch],
    ]),
  ]),
  development: process.env.NODE_ENV !== "production" && { hmr: false, console: true },
});

console.log(`cards at ${server.url}`);
