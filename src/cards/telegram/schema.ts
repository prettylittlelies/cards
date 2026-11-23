import { field, type Infer } from "@/proto/schema";
import { FRAME_FIELDS } from "../fields";

export const SHOW = ["avatar", "status", "premium", "gift", "scene", "seen", "surface"] as const;

export const MOTION = ["twinkle"] as const;

export const TelegramCard = {
  user: field.text(1, 32),
  ...FRAME_FIELDS,
  show: field.flags(8, SHOW, SHOW),
  motion: field.flags(9, MOTION, MOTION),
  name: field.text(10, 32),
} as const;

export type TelegramCardConfig = Infer<typeof TelegramCard>;

export const USERNAME = /^@?[a-z][a-z0-9_]{3,31}$/i;
