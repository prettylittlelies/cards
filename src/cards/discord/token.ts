import { tokenKind } from "@/token/token";
import { DiscordCard } from "./schema";

export const DISCORD_TOKEN = tokenKind(1, "discord", DiscordCard);
