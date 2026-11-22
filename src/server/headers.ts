import type { Asset, CachePolicy, Encoding } from "./types";

const CACHE_CONTROL: Readonly<Record<CachePolicy, string>> = {
  immutable: "public, max-age=31536000, immutable",
  durable: "public, max-age=86400, stale-while-revalidate=604800",
  revalidate: "public, max-age=0, must-revalidate",
};

export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
});

export const assetHeaders = (asset: Asset, encoding: Encoding, length: number): Headers => {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("Content-Type", asset.type);
  headers.set("Content-Length", String(length));
  headers.set("Cache-Control", CACHE_CONTROL[asset.policy]);
  headers.set("ETag", asset.etag);
  headers.set("Last-Modified", asset.lastModified);
  if (asset.bodies.size > 1) headers.set("Vary", "Accept-Encoding");
  if (encoding !== "identity") headers.set("Content-Encoding", encoding);
  return headers;
};
