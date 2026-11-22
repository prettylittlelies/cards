import { ProtoError } from "./errors";
import { defaultsOf, type Field, type Infer, type Schema } from "./schema";

const SNOWFLAKE = /^\d{1,20}$/;
const HEX = /^#?([\da-f]{3}|[\da-f]{6})$/i;
const UINT64_MAX = (1n << 64n) - 1n;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseColor = (value: unknown, path: string): number | null => {
  if (value === null) return null;
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 0xff_ffff) return value;
  if (typeof value === "string") {
    const hex = HEX.exec(value.trim())?.[1];
    if (hex) return Number.parseInt(hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex, 16);
  }
  throw new ProtoError(path, "expected #rrggbb, integer or null");
};

const parseSnowflake = (value: unknown, path: string): string => {
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !SNOWFLAKE.test(raw) || BigInt(raw) > UINT64_MAX) throw new ProtoError(path, "expected snowflake");
  return BigInt(raw).toString();
};

const parseFlags = (entry: Extract<Field, { kind: "flags" }>, value: unknown, path: string): Record<string, boolean> => {
  if (!isRecord(value)) throw new ProtoError(path, "expected object of booleans");
  const out: Record<string, boolean> = { ...entry.default };
  for (const [name, flag] of Object.entries(value)) {
    if (!entry.values.includes(name)) throw new ProtoError(`${path}.${name}`, "unknown flag");
    if (typeof flag !== "boolean") throw new ProtoError(`${path}.${name}`, "expected boolean");
    out[name] = flag;
  }
  return out;
};

const coerceField = (entry: Field, value: unknown, path: string): unknown => {
  switch (entry.kind) {
    case "uint":
      if (typeof value !== "number" || !Number.isFinite(value)) throw new ProtoError(path, "expected number");
      return Math.min(entry.max, Math.max(entry.min, Math.round(value)));
    case "bool":
      if (typeof value !== "boolean") throw new ProtoError(path, "expected boolean");
      return value;
    case "text":
      if (typeof value !== "string") throw new ProtoError(path, "expected string");
      return [...value.trim()].slice(0, entry.max).join("");
    case "color":
      return parseColor(value, path);
    case "snowflake":
      return parseSnowflake(value, path);
    case "enum":
      if (typeof value !== "string" || !entry.values.includes(value)) throw new ProtoError(path, `expected one of ${entry.values.join(", ")}`);
      return value;
    case "flags":
      return parseFlags(entry, value, path);
    case "message":
      return coerceAt(entry.schema, value, path);
  }
};

const coerceAt = <S extends Schema>(schema: S, input: unknown, prefix: string): Infer<S> => {
  if (!isRecord(input)) throw new ProtoError(prefix, "expected object");
  const out: Record<string, unknown> = { ...defaultsOf(schema) };
  for (const [name, value] of Object.entries(input)) {
    const entry = schema[name];
    const path = prefix ? `${prefix}.${name}` : name;
    if (!entry) throw new ProtoError(path, "unknown field");
    if (value !== undefined) out[name] = coerceField(entry, value, path);
  }
  return out as Infer<S>;
};

export const coerce = <S extends Schema>(schema: S, input: unknown): Infer<S> => coerceAt(schema, input, "");
