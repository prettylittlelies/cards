export const CARD_KINDS = ["discord", "telegram"] as const;

export type CardKind = (typeof CARD_KINDS)[number];

export const cardPath = (kind: CardKind): string => `/cards/${kind}`;

export const mintPath = (kind: CardKind): string => `/x${cardPath(kind)}/token`;
