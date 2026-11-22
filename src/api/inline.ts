import { UpstreamError } from "./errors";
import { hotSingleton } from "./hot";
import { limiter } from "./limit";
import { keyed, resource, type Resource } from "./resource";
import { DAY, MINUTE, SECOND } from "./time";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = /^image\/(png|jpeg|webp|gif|apng)$/;

const gate = limiter(8);

const toDataUri = (url: string, signal: AbortSignal): Promise<string> =>
  gate(async () => {
    const response = await fetch(url, { signal, headers: { Accept: "image/webp,image/png,image/*;q=0.8" } });
    if (!response.ok) throw new UpstreamError("image", `${url} responded ${response.status}`);
    const type = (response.headers.get("Content-Type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED.test(type)) throw new UpstreamError("image", `${url} is ${type || "untyped"}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new UpstreamError("image", `${url} exceeds ${MAX_BYTES} bytes`);
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  });

const images: (url: string) => Resource<string> = hotSingleton("inline-data-uris", () =>
  keyed(
    (url: string) => url,
    (url) => resource((signal) => toDataUri(url, signal), { ttlMs: DAY, staleMs: 6 * DAY, timeoutMs: 15 * SECOND, retryMs: 10 * MINUTE }),
    1024,
  ),
);

export const inlineImage = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  try {
    return (await images(url)()).value;
  } catch {
    return null;
  }
};

export const inlineAll = async <K extends string>(urls: Readonly<Record<K, string | null>>): Promise<Record<K, string | null>> => {
  const keys = Object.keys(urls) as K[];
  const values = await Promise.all(keys.map((key) => inlineImage(urls[key])));
  return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? null])) as Record<K, string | null>;
};
