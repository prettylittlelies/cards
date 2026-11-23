import { telegram } from "@/telegram/service";
import { createApp } from "./app";

const { config, manifest, fetch } = await createApp();

const server = Bun.serve({
  port: config.port,
  hostname: config.hostname,
  fetch,
  error: (error) => {
    console.error(error);
    return new Response(null, { status: 500 });
  },
});

const shutdown = async (signal: NodeJS.Signals) => {
  console.log(`${signal} received, draining`);
  await Promise.all([telegram.close(), server.stop()]);
  process.exit(0);
};

for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, shutdown);

telegram.warm();

console.log(`serving ${manifest.size} assets from ${config.root}/ at ${server.url}`);
