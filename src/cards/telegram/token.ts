import { tokenKind } from "@/token/token";
import { TelegramCard } from "./schema";

export const TELEGRAM_TOKEN = tokenKind(2, "telegram", TelegramCard);
