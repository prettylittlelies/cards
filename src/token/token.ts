import { timingSafeEqual } from "node:crypto";
import { decode, encode, ProtoError, type Infer, type Schema } from "@/proto";

const VERSION = 1;
const MAC_BYTES = 12;
const MAX_TOKEN_LENGTH = 2048;

export type TokenKind<S extends Schema> = {
  readonly id: number;
  readonly name: string;
  readonly schema: S;
};

export class TokenError extends Error {
  override readonly name = "TokenError";
}

export const tokenKind = <S extends Schema>(id: number, name: string, schema: S): TokenKind<S> => {
  if (!Number.isInteger(id) || id < 1 || id > 0xff) throw new RangeError("token kind id must fit in a byte");
  return Object.freeze({ id, name, schema });
};

const b64 = {
  encode: (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64url"),
  decode: (text: string): Uint8Array => {
    const bytes = new Uint8Array(Buffer.from(text, "base64url"));
    if (Buffer.from(bytes).toString("base64url") !== text) throw new TokenError("non-canonical encoding");
    return bytes;
  },
};

export type Tokens = {
  readonly sign: <S extends Schema>(kind: TokenKind<S>, value: Infer<S>) => string;
  readonly verify: <S extends Schema>(kind: TokenKind<S>, token: string) => Infer<S>;
};

export const createTokens = (secret: Uint8Array): Tokens => {
  const mac = (bytes: Uint8Array): Uint8Array =>
    new Bun.CryptoHasher("sha256", secret).update(bytes).digest().subarray(0, MAC_BYTES);

  return {
    sign: (kind, value) => {
      const body = encode(kind.schema, value);
      const payload = new Uint8Array(body.byteLength + 2);
      payload.set([VERSION, kind.id]);
      payload.set(body, 2);
      return `${b64.encode(payload)}.${b64.encode(mac(payload))}`;
    },
    verify: (kind, token) => {
      if (token.length > MAX_TOKEN_LENGTH) throw new TokenError("token too long");
      const [head, tail, ...rest] = token.split(".");
      if (!head || !tail || rest.length > 0) throw new TokenError("malformed token");
      const payload = b64.decode(head);
      const signature = b64.decode(tail);
      const expected = mac(payload);
      if (signature.byteLength !== expected.byteLength || !timingSafeEqual(signature, expected)) throw new TokenError("bad signature");
      if (payload[0] !== VERSION) throw new TokenError(`unsupported token version ${payload[0]}`);
      if (payload[1] !== kind.id) throw new TokenError(`token is not a ${kind.name} token`);
      try {
        return decode(kind.schema, payload.subarray(2));
      } catch (error) {
        throw new TokenError(error instanceof ProtoError ? error.message : "undecodable token");
      }
    },
  };
};
