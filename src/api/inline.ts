import { hotSingleton } from "./hot";
import { limiter } from "./limit";
import { keyed, resource, type Resource } from "./resource";
import { DAY, MINUTE, SECOND } from "./time";

const MAX_BYTES = 384 * 1024;
const ALLOWED = /^image\/(png|jpeg|webp|gif|apng)$/;

const gate = limiter(8);

const toDataUri = async (url: string, signal: AbortSignal): Promise<string | null> =>
  gate(async () => {
    const response = await fetch(url, { signal, headers: { Accept: "image/webp,image/png,image/*;q=0.8" } });
    if (!response.ok) return null;
    const type = (response.headers.get("Content-Type") ?? "").split(";")[0]!.trim().toLowerCase();
    if (!ALLOWED.test(type)) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  });

const images: (url: string) => Resource<string | null> = hotSingleton("inline-images", () =>
  keyed(
    (url: string) => url,
    (url) => resource((signal) => toDataUri(url, signal), { ttlMs: DAY, staleMs: 6 * DAY, timeoutMs: 6 * SECOND, retryMs: 10 * MINUTE }),
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
