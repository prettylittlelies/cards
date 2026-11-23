import type { Infer, Schema } from "@/proto";
import type { TokenKind } from "@/token";
import type { CardKind } from "./paths";

export type Drawn = {
  readonly svg: string;
  readonly stale: boolean;
};

export type CardDefinition<S extends Schema> = {
  readonly kind: CardKind;
  readonly token: TokenKind<S>;
  readonly validate: (config: Infer<S>) => string | null;
  readonly draw: (config: Infer<S>) => Promise<Drawn>;
  readonly unavailable: (config: Infer<S>) => Promise<string>;
  readonly inspect: (config: Infer<S>) => Promise<Readonly<Record<string, unknown>>>;
};

export const defineCard = <S extends Schema>(definition: CardDefinition<S>): CardDefinition<S> => definition;
