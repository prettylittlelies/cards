import type { DiscordStatus } from "@/discord/types";
import type { Palette } from "@/render";
import type { CardModel } from "./model";
import type { DiscordCardConfig } from "./schema";

export const ROW = {
  height: 42,
  inset: 8,
  gap: 12,
  avatar: 32,
  decorationRatio: 1.2,
  statusCenter: 27,
  statusRadius: 5,
  statusCutout: 8,
  nameSize: 15,
  nameLine: 20,
  decoratorSize: 17,
  decoratorGap: 4,
  platformGap: 3.4,
  badgeSize: 16,
  badgeGap: 2,
  subSize: 12,
  subLine: 16,
  subGap: 4,
  subIcon: 12,
  subIconColor: "#45a366",
  nameplateAspect: 448 / 84,
} as const;

export const STATUS_FILL: Readonly<Record<DiscordStatus, string>> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

export type Context = {
  readonly config: DiscordCardConfig;
  readonly model: CardModel;
  readonly palette: Palette;
  readonly fontWidth: number;
};
