import { field, type Infer } from "@/proto/schema";
import { FRAME_FIELDS } from "../fields";

export const SHOW = ["avatar", "decoration", "status", "platforms", "badges", "activity", "customStatus", "nameplate", "surface"] as const;

export const MOTION = ["animatedAvatar", "animatedDecoration", "animatedNameplate"] as const;

export const DiscordCard = {
  user: field.snowflake(1),
  ...FRAME_FIELDS,
  show: field.flags(8, SHOW, SHOW),
  motion: field.flags(9, MOTION, []),
  name: field.text(10, 32),
} as const;

export type DiscordCardConfig = Infer<typeof DiscordCard>;
