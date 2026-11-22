import type { DiscordStatus } from "@/discord/types";
import type { Theme } from "@/render";
import type { CardModel } from "./model";
import type { DiscordCardConfig } from "./schema";

export type Metrics = {
  readonly avatar: number;
  readonly art: number;
  readonly name: number;
  readonly body: number;
  readonly small: number;
  readonly line: number;
  readonly gap: number;
};

export type Context = {
  readonly config: DiscordCardConfig;
  readonly model: CardModel;
  readonly theme: Theme;
  readonly metrics: Metrics;
  readonly x: number;
  readonly width: number;
};

export const METRICS: Readonly<Record<DiscordCardConfig["layout"], Metrics>> = {
  stack: { avatar: 64, art: 56, name: 18, body: 13, small: 11, line: 18, gap: 16 },
  compact: { avatar: 44, art: 40, name: 15, body: 12, small: 10.5, line: 16, gap: 12 },
};

export const STATUS_COLORS: Readonly<Record<DiscordStatus, string>> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};
