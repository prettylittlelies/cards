import { field, type Infer } from "@/proto";
import { FONTS, THEMES } from "@/render/theme";

export const SHOW = ["avatar", "decoration", "status", "platforms", "badges", "activity", "customStatus", "nameplate", "surface"] as const;

export const MOTION = ["animatedAvatar", "animatedDecoration", "animatedNameplate"] as const;

export const DiscordCard = {
  user: field.snowflake(1),
  theme: field.enum(2, THEMES),
  accent: field.color(3),
  width: field.uint(4, 360, 220, 640),
  scale: field.uint(5, 2, 1, 4),
  radius: field.uint(6, 8, 0, 21),
  font: field.enum(7, FONTS),
  show: field.flags(8, SHOW, SHOW),
  motion: field.flags(9, MOTION, []),
  name: field.text(10, 32),
} as const;

export type DiscordCardConfig = Infer<typeof DiscordCard>;
