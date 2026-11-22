import { field, type Infer } from "@/proto";
import { FONTS, THEMES } from "@/render/theme";

export const SHOW = [
  "avatar",
  "decoration",
  "status",
  "username",
  "pronouns",
  "badges",
  "bio",
  "customStatus",
  "spotify",
  "activities",
  "elapsed",
  "platform",
  "border",
  "glow",
  "dividers",
] as const;

export const MOTION = ["progress", "equalizer", "pulse", "animatedAvatar", "animatedDecoration", "fadeIn"] as const;

export const LAYOUTS = ["stack", "compact"] as const;

export const FALLBACK_ACCENT = 0x8d8df0;

export const DiscordCard = {
  user: field.snowflake(1),
  theme: field.enum(2, THEMES),
  accent: field.color(3),
  width: field.uint(4, 420, 300, 640),
  radius: field.uint(5, 16, 0, 40),
  padding: field.uint(6, 20, 8, 40),
  font: field.enum(7, FONTS),
  layout: field.enum(8, LAYOUTS),
  show: field.flags(9, SHOW, ["avatar", "decoration", "status", "username", "badges", "bio", "customStatus", "spotify", "activities", "elapsed", "border", "dividers"]),
  motion: field.flags(10, MOTION, ["progress", "equalizer", "fadeIn"]),
  activities: field.uint(11, 2, 0, 4),
  bioLines: field.uint(12, 3, 1, 6),
  tagline: field.text(13, 120),
  offline: field.text(14, 48, "Not doing anything right now"),
  name: field.text(15, 32),
} as const;

export type DiscordCardConfig = Infer<typeof DiscordCard>;
