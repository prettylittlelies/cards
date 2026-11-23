import { discordCard } from "./discord/card";
import { mountCard } from "./routes";
import { telegramCard } from "./telegram/card";

export const CARDS = [mountCard(discordCard), mountCard(telegramCard)] as const;
