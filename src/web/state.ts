import { useReducer } from "react";
import { DiscordCard, type DiscordCardConfig } from "@/cards/discord/schema";
import { defaultsOf } from "@/proto/schema";

export type Config = DiscordCardConfig;
export type FlagGroup = "show" | "motion";

export type Action =
  | { readonly type: "set"; readonly patch: Partial<Config> }
  | { readonly type: "flag"; readonly group: FlagGroup; readonly name: string; readonly value: boolean }
  | { readonly type: "reset" };

const STORAGE_KEY = "cards.discord.v1";

export const DEFAULTS: Config = defaultsOf(DiscordCard);

const restore = (): Config => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Record<string, unknown> | null;
    const saved = raw ? (Object.fromEntries(Object.entries(raw).filter(([key]) => key in DEFAULTS)) as Partial<Config>) : null;
    return saved ? { ...DEFAULTS, ...saved, show: { ...DEFAULTS.show, ...saved.show }, motion: { ...DEFAULTS.motion, ...saved.motion } } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const persist = (config: Config): Config => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
  return config;
};

const reduce = (config: Config, action: Action): Config => {
  switch (action.type) {
    case "set":
      return persist({ ...config, ...action.patch });
    case "flag":
      return persist({ ...config, [action.group]: { ...config[action.group], [action.name]: action.value } });
    case "reset":
      return persist({ ...DEFAULTS, user: config.user });
  }
};

export const useConfig = () => useReducer(reduce, undefined, restore);

export const humanize = (name: string): string => name.replace(/([A-Z])/g, " $1").toLowerCase();
