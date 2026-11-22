import { UpstreamError } from "@/api/errors";
import { hotSingleton } from "@/api/hot";
import { keyed, resource, type Resource } from "@/api/resource";
import { SECOND } from "@/api/time";
import type { LanyardResponse, Presence } from "./types";

const LANYARD_REST = "https://api.lanyard.rest/v1/users";
const UNTRACKED = "user_not_monitored";

export type PresenceResult =
  | { readonly status: "ok"; readonly presence: Presence }
  | { readonly status: "untracked" };

const loadPresence =
  (userId: string) =>
  async (signal: AbortSignal): Promise<PresenceResult> => {
    const response = await fetch(`${LANYARD_REST}/${userId}`, { signal, headers: { Accept: "application/json" } });
    const body = (await response.json().catch(() => null)) as LanyardResponse | null;
    if (body?.success) return { status: "ok", presence: body.data };
    if (body && body.error.code === UNTRACKED) return { status: "untracked" };
    throw new UpstreamError("lanyard", `lanyard responded ${response.status}`);
  };

export const presenceOf: (userId: string) => Resource<PresenceResult> = hotSingleton("lanyard", () =>
  keyed(
    (userId: string) => userId,
    (userId) => resource(loadPresence(userId), { ttlMs: 10 * SECOND, staleMs: 50 * SECOND, timeoutMs: 6 * SECOND, retryMs: 5 * SECOND }),
    4096,
  ),
);
