import type { MiddlewareHandler } from "hono";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { isCompressible } from "@/server/compress";

type Codec = {
  readonly name: "br" | "gzip";
  readonly encode: (bytes: Uint8Array) => Uint8Array<ArrayBuffer>;
};

const MIN_BYTES = 1024;

const CODECS: readonly Codec[] = [
  {
    name: "br",
    encode: (bytes) => new Uint8Array(brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })),
  },
  { name: "gzip", encode: (bytes) => new Uint8Array(gzipSync(bytes, { level: 6 })) },
];

const accepted = (header: string | undefined): ReadonlySet<string> =>
  new Set(
    (header ?? "")
      .split(",")
      .map((part) => part.trim().split(";")[0]!.toLowerCase())
      .filter(Boolean),
  );

export const compress = (): MiddlewareHandler => async (c, next) => {
  await next();
  const { res } = c;
  const type = res.headers.get("Content-Type") ?? "";
  if (!res.body || res.headers.has("Content-Encoding") || !isCompressible(type)) return;

  const codec = CODECS.find(({ name }) => accepted(c.req.header("Accept-Encoding")).has(name));
  if (!codec) return;

  const raw = new Uint8Array(await res.arrayBuffer());
  if (raw.byteLength < MIN_BYTES) {
    c.res = new Response(raw, res);
    return;
  }

  const encoded = codec.encode(raw);
  const headers = new Headers(res.headers);
  headers.set("Content-Encoding", codec.name);
  headers.set("Content-Length", String(encoded.byteLength));
  headers.append("Vary", "Accept-Encoding");
  c.res = new Response(encoded, { status: res.status, statusText: res.statusText, headers });
};
