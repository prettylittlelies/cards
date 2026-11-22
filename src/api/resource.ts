export type Snapshot<T> = {
  readonly value: T;
  readonly fetchedAt: number;
  readonly stale: boolean;
};

export type ResourceOptions = {
  readonly ttlMs: number;
  readonly staleMs: number;
  readonly timeoutMs: number;
  readonly retryMs?: number;
};

export type Resource<T> = () => Promise<Snapshot<T>>;

export type Entry<T> = Omit<Snapshot<T>, "stale">;

export type ResourceStore<T> = {
  readonly load: () => Promise<Entry<T> | null>;
  readonly save: (entry: Entry<T>) => Promise<void>;
};

type Failure = { readonly error: unknown; readonly at: number };

export const resource = <T>(
  load: (signal: AbortSignal) => Promise<T>,
  { ttlMs, staleMs, timeoutMs, retryMs = ttlMs }: ResourceOptions,
  store?: ResourceStore<T>,
): Resource<T> => {
  let entry: Entry<T> | null = null;
  let hydration: Promise<void> | null = null;
  let failure: Failure | null = null;
  let inflight: Promise<Entry<T>> | null = null;

  const cooldown = (): Failure | null =>
    !inflight && failure && Date.now() - failure.at < retryMs ? failure : null;

  const refresh = (): Promise<Entry<T>> =>
    (inflight ??= load(AbortSignal.timeout(timeoutMs))
      .then((value) => {
        failure = null;
        entry = { value, fetchedAt: Date.now() };
        store?.save(entry).catch(() => undefined);
        return entry;
      })
      .catch((error: unknown) => {
        failure = { error, at: Date.now() };
        throw error;
      })
      .finally(() => {
        inflight = null;
      }));

  const hydrate = (): Promise<void> =>
    (hydration ??= (store?.load() ?? Promise.resolve(null))
      .then((saved) => {
        if (saved && !entry) entry = saved;
      })
      .catch(() => undefined));

  return async () => {
    await hydrate();
    const age = entry ? Date.now() - entry.fetchedAt : Number.POSITIVE_INFINITY;
    const blocked = cooldown();
    if (entry && (age < ttlMs || blocked)) return { ...entry, stale: age >= ttlMs };
    if (entry && age < ttlMs + staleMs) {
      refresh().catch(() => undefined);
      return { ...entry, stale: true };
    }
    if (blocked) throw blocked.error;
    try {
      return { ...(await refresh()), stale: false };
    } catch (error) {
      if (entry) return { ...entry, stale: true };
      throw error;
    }
  };
};

export const derived = <A, B>(source: Resource<A>, map: (value: A, fetchedAt: number) => B): Resource<B> => {
  let memo: { readonly from: A; readonly value: B } | null = null;
  return async () => {
    const snapshot = await source();
    if (memo?.from !== snapshot.value) memo = { from: snapshot.value, value: map(snapshot.value, snapshot.fetchedAt) };
    return { ...snapshot, value: memo.value };
  };
};

export const combined = <T extends Record<string, unknown>>(sources: { readonly [K in keyof T]: Resource<T[K]> }): Resource<T> => {
  const keys = Object.keys(sources) as (keyof T)[];
  return async () => {
    const snapshots = await Promise.all(keys.map((key) => sources[key]()));
    return {
      value: Object.fromEntries(keys.map((key, index) => [key, snapshots[index]!.value])) as T,
      fetchedAt: Math.min(...snapshots.map((snapshot) => snapshot.fetchedAt)),
      stale: snapshots.some((snapshot) => snapshot.stale),
    };
  };
};

export const keyed = <S, T>(
  keyOf: (spec: S) => string,
  create: (spec: S) => Resource<T>,
  capacity: number,
): ((spec: S) => Resource<T>) => {
  const store = new Map<string, Resource<T>>();
  return (spec) => {
    const key = keyOf(spec);
    const existing = store.get(key);
    if (existing) {
      store.delete(key);
      store.set(key, existing);
      return existing;
    }
    const created = create(spec);
    store.set(key, created);
    if (store.size > capacity) store.delete(store.keys().next().value!);
    return created;
  };
};

export const constant = <T>(value: T): Resource<T> => {
  const snapshot: Snapshot<T> = Object.freeze({ value, fetchedAt: Date.now(), stale: false });
  return () => Promise.resolve(snapshot);
};
