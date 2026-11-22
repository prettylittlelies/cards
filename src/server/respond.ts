import { assetHeaders, SECURITY_HEADERS } from "./headers";
import { negotiate } from "./negotiate";
import type { Asset } from "./types";

const isFresh = (req: Request, asset: Asset): boolean => {
  const match = req.headers.get("If-None-Match");
  if (match) return match === "*" || match.split(",").some((t) => t.trim().replace(/^W\//, "") === asset.etag);
  const since = req.headers.get("If-Modified-Since");
  return since !== null && Date.parse(since) >= Date.parse(asset.lastModified);
};

export const serveAsset = (req: Request, asset: Asset): Response => {
  const encoding = negotiate(asset, req.headers.get("Accept-Encoding"));
  const body = asset.bodies.get(encoding)!;
  const headers = assetHeaders(asset, encoding, body.byteLength);
  if (isFresh(req, asset)) {
    headers.delete("Content-Length");
    return new Response(null, { status: 304, headers });
  }
  return new Response(req.method === "HEAD" ? null : body, { status: 200, headers });
};

export const redirect = (location: string, status: 302 | 308 = 302): Response =>
  new Response(null, { status, headers: { ...SECURITY_HEADERS, Location: location, "Cache-Control": "no-store" } });

export const methodNotAllowed = (): Response =>
  new Response(null, { status: 405, headers: { ...SECURITY_HEADERS, Allow: "GET, HEAD" } });
