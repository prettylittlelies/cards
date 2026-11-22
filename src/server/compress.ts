import { brotliCompressSync, constants } from "node:zlib";
import type { Encoding } from "./types";

const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg\+xml)/;

export const isCompressible = (type: string): boolean => COMPRESSIBLE.test(type);

export const encodeAll = (raw: Uint8Array<ArrayBuffer>, type: string, minBytes: number): Map<Encoding, Uint8Array<ArrayBuffer>> => {
  const bodies = new Map<Encoding, Uint8Array<ArrayBuffer>>([["identity", raw]]);
  if (raw.byteLength < minBytes || !isCompressible(type)) return bodies;

  const br = brotliCompressSync(raw, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_SIZE_HINT]: raw.byteLength,
    },
  });
  const gzip = new Uint8Array(Bun.gzipSync(raw, { level: 9 }));

  if (br.byteLength < raw.byteLength) bodies.set("br", new Uint8Array(br));
  if (gzip.byteLength < raw.byteLength) bodies.set("gzip", gzip);
  return bodies;
};
