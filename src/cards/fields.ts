import { field, type Infer } from "@/proto/schema";
import { FONTS, THEMES } from "@/render/theme";

export const FRAME_FIELDS = {
  theme: field.enum(2, THEMES),
  accent: field.color(3),
  width: field.uint(4, 360, 220, 640),
  scale: field.uint(5, 2, 1, 4),
  radius: field.uint(6, 8, 0, 21),
  font: field.enum(7, FONTS),
} as const;

export type FrameFields = Infer<typeof FRAME_FIELDS>;
