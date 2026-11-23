import { DiscordCard } from "@/cards/discord/schema";
import type { CardKind } from "@/cards/paths";
import { TelegramCard, USERNAME } from "@/cards/telegram/schema";
import type { Schema } from "@/proto/schema";

export type Identity = {
  readonly label: string;
  readonly placeholder: string;
  readonly hint: string;
  readonly mono: boolean;
  readonly valid: (value: string) => boolean;
  readonly clean: (value: string) => string;
  readonly empty: string;
};

export type Entry = {
  readonly schema: Schema;
  readonly identity: Identity;
};

const SNOWFLAKE = /^\d{17,20}$/;

export const CATALOG: Readonly<Record<CardKind, Entry>> = {
  discord: {
    schema: DiscordCard,
    identity: {
      label: "discord id",
      placeholder: "442626774841556992",
      hint: "join discord.gg/lanyard so your presence is tracked",
      mono: true,
      valid: (value) => SNOWFLAKE.test(value),
      clean: (value) => value.replace(/\D/g, "") || "0",
      empty: "0",
    },
  },
  telegram: {
    schema: TelegramCard,
    identity: {
      label: "username",
      placeholder: "brushful",
      hint: "DM the cards account /card to opt in, /stop to opt out",
      mono: false,
      valid: (value) => USERNAME.test(value),
      clean: (value) => value.trim().replace(/^@/, ""),
      empty: "",
    },
  },
};
