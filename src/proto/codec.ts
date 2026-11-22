import { ProtoError } from "./errors";
import { byNumber, defaultsOf, WIRE, type Field, type Infer, type Schema } from "./schema";
import { Reader, Writer } from "./wire";

const utf8 = { encoder: new TextEncoder(), decoder: new TextDecoder("utf-8", { fatal: true }) };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const bitsOf = (values: readonly string[], record: Readonly<Record<string, boolean>>): number =>
  values.reduce((bits, value, index) => (record[value] ? bits | (1 << index) : bits), 0) >>> 0;

const recordOf = (values: readonly string[], bits: number): Record<string, boolean> =>
  Object.fromEntries(values.map((value, index) => [value, ((bits >>> index) & 1) === 1]));

const ordered = (schema: Schema): readonly (readonly [string, Field])[] =>
  [...byNumber(schema).values()].sort(([, a], [, b]) => a.no - b.no);

const writeField = (writer: Writer, entry: Field, value: unknown): void => {
  switch (entry.kind) {
    case "uint":
      if (value !== entry.default) writer.tag(entry.no, WIRE.uint).varint(value as number);
      return;
    case "bool":
      if (value !== entry.default) writer.tag(entry.no, WIRE.bool).varint(value ? 1 : 0);
      return;
    case "enum":
      if (value !== entry.default) writer.tag(entry.no, WIRE.enum).varint(entry.values.indexOf(value as string));
      return;
    case "flags": {
      const bits = bitsOf(entry.values, value as Readonly<Record<string, boolean>>);
      if (bits !== bitsOf(entry.values, entry.default)) writer.tag(entry.no, WIRE.flags).varint(bits);
      return;
    }
    case "color":
      if (value !== null && value !== entry.default) writer.tag(entry.no, WIRE.color).fixed32(value as number);
      return;
    case "snowflake":
      if (value !== entry.default) writer.tag(entry.no, WIRE.snowflake).fixed64(BigInt(value as string));
      return;
    case "text":
      if (value !== entry.default) writer.tag(entry.no, WIRE.text).bytes(utf8.encoder.encode(value as string));
      return;
    case "message": {
      const nested = encode(entry.schema, value as Infer<Schema>);
      if (nested.byteLength > 0) writer.tag(entry.no, WIRE.message).bytes(nested);
      return;
    }
  }
};

const readText = (bytes: Uint8Array, max: number, path: string): string => {
  try {
    return [...utf8.decoder.decode(bytes)].slice(0, max).join("");
  } catch {
    throw new ProtoError(path, "invalid utf-8");
  }
};

const readField = (reader: Reader, entry: Field, path: string): unknown => {
  switch (entry.kind) {
    case "uint":
      return clamp(reader.varint(), entry.min, entry.max);
    case "bool":
      return reader.varint() !== 0;
    case "enum":
      return entry.values[reader.varint()] ?? entry.default;
    case "flags":
      return recordOf(entry.values, reader.varint());
    case "color":
      return reader.fixed32() & 0xff_ffff;
    case "snowflake":
      return reader.fixed64().toString();
    case "text":
      return readText(reader.bytesField(), entry.max, path);
    case "message":
      return decodeAt(entry.schema, reader.bytesField(), path);
  }
};

export const encode = <S extends Schema>(schema: S, value: Infer<S>): Uint8Array<ArrayBuffer> => {
  const writer = new Writer();
  for (const [name, entry] of ordered(schema)) writeField(writer, entry, value[name]);
  return writer.finish();
};

const decodeAt = <S extends Schema>(schema: S, bytes: Uint8Array, prefix: string): Infer<S> => {
  const reader = new Reader(bytes);
  const index = byNumber(schema);
  const out: Record<string, unknown> = { ...defaultsOf(schema) };
  while (!reader.done) {
    const key = reader.varint();
    const type = key % 8;
    const known = index.get(Math.floor(key / 8));
    if (!known) {
      reader.skip(type);
      continue;
    }
    const [name, entry] = known;
    const path = prefix ? `${prefix}.${name}` : name;
    if (WIRE[entry.kind] !== type) throw new ProtoError(path, `wire type ${type} does not match ${entry.kind}`);
    out[name] = readField(reader, entry, path);
  }
  return out as Infer<S>;
};

export const decode = <S extends Schema>(schema: S, bytes: Uint8Array): Infer<S> => decodeAt(schema, bytes, "");
