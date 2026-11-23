import { useReducer } from "react";
import { CARD_KINDS, type CardKind } from "@/cards/paths";
import { defaultsOf } from "@/proto/schema";
import { CATALOG } from "./catalog";

export type Config = Readonly<Record<string, unknown>>;
export type Patch = Readonly<Record<string, unknown>>;

type State = {
  readonly kind: CardKind;
  readonly configs: Readonly<Record<CardKind, Config>>;
};

export type Action =
  | { readonly type: "kind"; readonly kind: CardKind }
  | { readonly type: "set"; readonly patch: Patch }
  | { readonly type: "reset" };

const STORAGE_KEY = "cards.builder.v2";

const defaults = (kind: CardKind): Config => defaultsOf(CATALOG[kind].schema);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const merge = (base: Config, saved: unknown): Config => {
  if (!isRecord(saved)) return base;
  const known = Object.entries(saved).filter(([key]) => key in base);
  return Object.fromEntries([
    ...Object.entries(base),
    ...known.map(([key, value]) => {
      const fallback = base[key];
      return [key, isRecord(fallback) && isRecord(value) ? { ...fallback, ...value } : value] as const;
    }),
  ]);
};

const initialKind = (saved: unknown): CardKind => {
  const requested = new URLSearchParams(location.search).get("card");
  const candidate = requested ?? (isRecord(saved) ? saved.kind : null);
  return CARD_KINDS.find((kind) => kind === candidate) ?? "discord";
};

const restore = (): State => {
  let saved: unknown = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {}
  const configs = isRecord(saved) && isRecord(saved.configs) ? saved.configs : {};
  return {
    kind: initialKind(saved),
    configs: Object.fromEntries(CARD_KINDS.map((kind) => [kind, merge(defaults(kind), configs[kind])])) as Record<CardKind, Config>,
  };
};

const persist = (state: State): State => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  return state;
};

const reduce = (state: State, action: Action): State => {
  const current = state.configs[state.kind];
  switch (action.type) {
    case "kind":
      return persist({ ...state, kind: action.kind });
    case "set":
      return persist({ ...state, configs: { ...state.configs, [state.kind]: { ...current, ...action.patch } } });
    case "reset":
      return persist({ ...state, configs: { ...state.configs, [state.kind]: { ...defaults(state.kind), user: current.user } } });
  }
};

export const useBuilder = () => useReducer(reduce, undefined, restore);

export const humanize = (name: string): string => name.replace(/([A-Z])/g, " $1").toLowerCase();
