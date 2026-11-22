import type { Asset, Encoding } from "./types";

const PREFERENCE: readonly Encoding[] = ["br", "gzip"];

const parseAccepted = (header: string): ReadonlyMap<string, number> =>
  new Map(
    header.split(",").map((part) => {
      const [token = "", ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return [token.trim(), q ? Number.parseFloat(q.slice(2)) || 0 : 1] as const;
    }),
  );

export const negotiate = (asset: Asset, header: string | null): Encoding => {
  if (!header || asset.bodies.size === 1) return "identity";
  const accepted = parseAccepted(header);
  const wildcard = accepted.get("*") ?? 0;
  return PREFERENCE.find((e) => asset.bodies.has(e) && (accepted.get(e) ?? wildcard) > 0) ?? "identity";
};
