import { cp, rm } from "node:fs/promises";
import { ASSET_DIR, ENTRY, FONT_PREFIX, FONT_DIR, OUT_DIR } from "./config";
import { printReport, writeReport } from "./report";

await rm(OUT_DIR, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [ENTRY],
  outdir: OUT_DIR,
  target: "browser",
  splitting: true,
  minify: true,
  sourcemap: "none",
  publicPath: "/",

  naming: { entry: "[name].[ext]", chunk: `${ASSET_DIR}/[hash].[ext]`, asset: `${ASSET_DIR}/[hash].[ext]` },
  define: { "process.env.NODE_ENV": '"production"' },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await cp(FONT_DIR, `${OUT_DIR}${FONT_PREFIX}`, { recursive: true });

const records = await writeReport(result);
printReport(records);
console.log(`built ${records.length} files → ${OUT_DIR}/`);
