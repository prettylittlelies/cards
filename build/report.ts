import { relative, sep } from "node:path";
import type { BuildOutput } from "bun";
import { MANIFEST_FILE, OUT_DIR } from "./config";

export type OutputRecord = {
  readonly path: string;
  readonly kind: string;
  readonly bytes: number;
  readonly gzip: number;
};

const toRecord = async (output: BuildOutput["outputs"][number]): Promise<OutputRecord> => {
  const bytes = new Uint8Array(await Bun.file(output.path).arrayBuffer());
  return {
    path: relative(OUT_DIR, output.path).split(sep).join("/"),
    kind: output.kind,
    bytes: bytes.byteLength,
    gzip: Bun.gzipSync(bytes, { level: 9 }).byteLength,
  };
};

export const writeReport = async (result: BuildOutput): Promise<readonly OutputRecord[]> => {
  const records = (await Promise.all(result.outputs.map(toRecord))).sort((a, b) => a.path.localeCompare(b.path));
  await Bun.write(MANIFEST_FILE, `${JSON.stringify({ generatedAt: new Date().toISOString(), outputs: records }, null, 2)}\n`);
  return records;
};

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)}k`;

export const printReport = (records: readonly OutputRecord[]): void => {
  const width = Math.max(...records.map((r) => r.path.length));
  for (const r of records) console.log(`  ${r.path.padEnd(width)}  ${kb(r.bytes).padStart(7)}  ${kb(r.gzip).padStart(7)} gz`);
};
