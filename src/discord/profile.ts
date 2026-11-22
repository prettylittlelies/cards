import { diskStore } from "@/api/disk-store";
import { UpstreamError } from "@/api/errors";
import { hotSingleton } from "@/api/hot";
import { limiter } from "@/api/limit";
import { keyed, resource, type Resource } from "@/api/resource";
import { DAY, HOUR, MINUTE, SECOND } from "@/api/time";
import { badgeUrl } from "./cdn";
import type { Profile, RawProfile } from "./types";

const PROFILE_API = "https://dcdn.dstn.to/profile";
const MISSING = new Set([403, 404]);

const EMPTY: Profile = Object.freeze({ badges: [], bio: "", pronouns: "", accent: null });

const gate = limiter(2);

const normalize = (raw: RawProfile): Profile => ({
  badges: (raw.badges ?? []).map(({ id, description, icon }) => ({ id, label: description, icon: badgeUrl(icon) })),
  bio: (raw.user_profile?.bio ?? raw.user?.bio ?? "").trim(),
  pronouns: (raw.user_profile?.pronouns ?? "").trim(),
  accent: raw.user_profile?.accent_color ?? raw.user?.accent_color ?? null,
});

const loadProfile =
  (userId: string) =>
  (signal: AbortSignal): Promise<Profile> =>
    gate(async () => {
      const response = await fetch(`${PROFILE_API}/${userId}`, { signal, headers: { Accept: "application/json" } });
      if (MISSING.has(response.status)) return EMPTY;
      if (!response.ok) throw new UpstreamError("dstn", `profile responded ${response.status}`);
      return normalize((await response.json()) as RawProfile);
    });

export const profileOf: (userId: string) => Resource<Profile> = hotSingleton("dstn", () =>
  keyed(
    (userId: string) => userId,
    (userId) =>
      resource(
        loadProfile(userId),
        { ttlMs: 12 * HOUR, staleMs: 14 * DAY, timeoutMs: 8 * SECOND, retryMs: 30 * MINUTE },
        diskStore<Profile>(`dstn/${userId}`),
      ),
    8192,
  ),
);

export const readProfile = async (userId: string): Promise<Profile> => {
  try {
    return (await profileOf(userId)()).value;
  } catch {
    return EMPTY;
  }
};
