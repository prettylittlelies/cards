import { serve } from "bun";
import { createApi, ROUTES } from "@/api/app";
import index from "./web/index.html";

const api = createApi();

const server = serve({
  routes: Object.fromEntries([["/*", index], ...ROUTES.flatMap((route) => [[route, api.fetch], [`${route}/*`, api.fetch]])]),
  development: process.env.NODE_ENV !== "production" && { hmr: false, console: true },
});

console.log(`cards at ${server.url}`);
