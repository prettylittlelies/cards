import { methodNotAllowed, redirect, serveAsset } from "./respond";
import type { Manifest, ServerConfig } from "./types";

const READ_METHODS = new Set(["GET", "HEAD"]);

const normalize = (pathname: string): string | null => {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.includes("\0") || decoded.split("/").includes("..") ? null : decoded;
  } catch {
    return null;
  }
};

export type Handler = (req: Request) => Response | Promise<Response>;

export const createRouter = (config: ServerConfig, manifest: Manifest, dynamic: Handler, owns: (path: string) => boolean): Handler => {
  const entry = manifest.get(config.entry)!;

  return (req) => {
    const url = new URL(req.url);
    if (owns(url.pathname)) return dynamic(req);
    if (!READ_METHODS.has(req.method)) return methodNotAllowed();
    if (url.pathname === "/") return serveAsset(req, entry);

    const path = normalize(url.pathname);
    const asset = path === null ? undefined : (manifest.get(path) ?? manifest.get(`${path.replace(/\/$/, "")}/index.html`));
    if (asset && asset !== entry) return serveAsset(req, asset);

    return redirect(`/${url.search}`);
  };
};
