import { WireType } from "./wire";

type Base<K extends string, V> = {
  readonly no: number;
  readonly kind: K;
  readonly default: V;
};

export type UintField = Base<"uint", number> & { readonly min: number; readonly max: number };
export type BoolField = Base<"bool", boolean>;
export type TextField = Base<"text", string> & { readonly max: number };
export type ColorField = Base<"color", number | null>;
export type SnowflakeField = Base<"snowflake", string>;
export type EnumField<V extends readonly string[] = readonly string[]> = Base<"enum", V[number]> & { readonly values: V };
export type FlagsField<V extends readonly string[] = readonly string[]> = Base<"flags", Flags<V>> & { readonly values: V };
export type MessageField<S extends Schema = Schema> = Base<"message", Infer<S>> & { readonly schema: S };

export type Flags<V extends readonly string[]> = { readonly [K in V[number]]: boolean };

export type Field = UintField | BoolField | TextField | ColorField | SnowflakeField | EnumField | FlagsField | MessageField;

export type Schema = { readonly [name: string]: Field };

export type ValueOf<F> = F extends Base<string, infer V> ? V : never;

export type Infer<S extends Schema> = { readonly [K in keyof S]: ValueOf<S[K]> };

export type Kind = Field["kind"];

export const WIRE: Readonly<Record<Kind, WireType>> = {
  uint: WireType.Varint,
  bool: WireType.Varint,
  enum: WireType.Varint,
  flags: WireType.Varint,
  snowflake: WireType.I64,
  color: WireType.I32,
  text: WireType.Len,
  message: WireType.Len,
};

export const defaultsOf = <S extends Schema>(schema: S): Infer<S> =>
  Object.fromEntries(Object.entries(schema).map(([name, entry]) => [name, entry.default])) as Infer<S>;

const flagRecord = <V extends readonly string[]>(values: V, on: readonly V[number][]): Flags<V> =>
  Object.fromEntries(values.map((value) => [value, on.includes(value)])) as Flags<V>;

export const field = {
  uint: (no: number, initial: number, min = 0, max = 0xffff_ffff): UintField => ({ no, kind: "uint", default: initial, min, max }),
  bool: (no: number, initial = false): BoolField => ({ no, kind: "bool", default: initial }),
  text: (no: number, max: number, initial = ""): TextField => ({ no, kind: "text", default: initial, max }),
  color: (no: number, initial: number | null = null): ColorField => ({ no, kind: "color", default: initial }),
  snowflake: (no: number): SnowflakeField => ({ no, kind: "snowflake", default: "0" }),
  enum: <const V extends readonly [string, ...string[]]>(no: number, values: V, initial: V[number] = values[0]): EnumField<V> => ({
    no,
    kind: "enum",
    default: initial,
    values,
  }),
  flags: <const V extends readonly string[]>(no: number, values: V, on: readonly V[number][]): FlagsField<V> => {
    if (values.length > 32) throw new RangeError("flags support at most 32 values");
    return { no, kind: "flags", default: flagRecord(values, on), values };
  },
  message: <S extends Schema>(no: number, schema: S): MessageField<S> => ({ no, kind: "message", default: defaultsOf(schema), schema }),
} as const;

const fieldIndex = new WeakMap<Schema, ReadonlyMap<number, readonly [string, Field]>>();

export const byNumber = (schema: Schema): ReadonlyMap<number, readonly [string, Field]> => {
  const cached = fieldIndex.get(schema);
  if (cached) return cached;
  const index = new Map<number, readonly [string, Field]>();
  for (const [name, entry] of Object.entries(schema)) {
    if (index.has(entry.no)) throw new Error(`duplicate field number ${entry.no} (${name})`);
    index.set(entry.no, [name, entry]);
  }
  fieldIndex.set(schema, index);
  return index;
};
