import { DiscordCard } from "@/cards/discord/schema";
import type { CardKind } from "@/cards/paths";
import { TelegramCard, USERNAME } from "@/cards/telegram/schema";
import type { Schema } from "@/proto/schema";

export type HintPart = string | { readonly text: string; readonly href: string };

export type About = Readonly<Record<string, unknown>>;

export type Identity = {
  readonly label: string;
  readonly placeholder: string;
  readonly hint: (about: About) => readonly HintPart[];
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

const accountOf = (about: About): string | null => {
  const account = about.account;
  return typeof account === "object" && account !== null && "username" in account && typeof account.username === "string" ? account.username : null;
};

export const CATALOG: Readonly<Record<CardKind, Entry>> = {
  discord: {
    schema: DiscordCard,
    identity: {
      label: "discord id",
      placeholder: "442626774841556992",
      hint: () => ["join ", { text: "discord.gg/lanyard", href: "https://discord.gg/lanyard" }, " so your presence is tracked"],
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
      hint: (about) => {
        const username = accountOf(about);
        return username
          ? ["DM ", { text: `@${username}`, href: `https://t.me/${username}` }, " /card to opt in, /stop to opt out"]
          : ["telegram opt-in is unavailable right now"];
      },
      mono: false,
      valid: (value) => USERNAME.test(value),
      clean: (value) => value.trim().replace(/^@/, ""),
      empty: "",
    },
  },
};
