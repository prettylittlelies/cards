import type { DiscordStatus } from "@/discord/types";
import type { Surface } from "../frame";
import type { CardModel } from "./model";
import type { DiscordCardConfig } from "./schema";

export const DISCORD_ROW = {
  decorationRatio: 1.2,
  decoratorSize: 17,
  platformGap: 3.4,
  badgeSize: 16,
  badgeGap: 2,
  subIconColor: "#45a366",
  nameplateAspect: 448 / 84,
} as const;

export const STATUS_FILL: Readonly<Record<DiscordStatus, string>> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

export type Context = Surface & {
  readonly config: DiscordCardConfig;
  readonly model: CardModel;
};
