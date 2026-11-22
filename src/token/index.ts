import { hotSingleton } from "@/api/hot";
import { loadSecret } from "./key";
import { createTokens, type Tokens } from "./token";

export { createTokens, TokenError, tokenKind, type TokenKind, type Tokens } from "./token";

export const tokens = hotSingleton("tokens", async (): Promise<Tokens> => createTokens(await loadSecret()));
