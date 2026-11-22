import { ProtoError } from "./errors";

export const WireType = {
  Varint: 0,
  I64: 1,
  Len: 2,
  I32: 5,
} as const;

export type WireType = (typeof WireType)[keyof typeof WireType];

const UINT32_LIMIT = 2 ** 32;

export class Writer {
  #buffer = new Uint8Array(64);
  #view = new DataView(this.#buffer.buffer);
  #length = 0;

  #reserve(bytes: number): number {
    const offset = this.#length;
    const needed = offset + bytes;
    if (needed > this.#buffer.byteLength) {
      const grown = new Uint8Array(Math.max(needed, this.#buffer.byteLength * 2));
      grown.set(this.#buffer.subarray(0, offset));
      this.#buffer = grown;
      this.#view = new DataView(grown.buffer);
    }
    this.#length = needed;
    return offset;
  }

  tag(no: number, type: WireType): this {
    return this.varint(no * 8 + type);
  }

  varint(value: number): this {
    let rest = value >>> 0;
    while (rest > 0x7f) {
      this.#buffer[this.#reserve(1)] = (rest & 0x7f) | 0x80;
      rest >>>= 7;
    }
    this.#buffer[this.#reserve(1)] = rest;
    return this;
  }

  fixed32(value: number): this {
    this.#view.setUint32(this.#reserve(4), value >>> 0, true);
    return this;
  }

  fixed64(value: bigint): this {
    this.#view.setBigUint64(this.#reserve(8), BigInt.asUintN(64, value), true);
    return this;
  }

  bytes(value: Uint8Array): this {
    this.varint(value.byteLength);
    const offset = this.#reserve(value.byteLength);
    this.#buffer.set(value, offset);
    return this;
  }

  finish(): Uint8Array<ArrayBuffer> {
    return this.#buffer.slice(0, this.#length);
  }
}

export class Reader {
  #offset = 0;
  readonly #view: DataView;

  constructor(readonly bytes: Uint8Array) {
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get done(): boolean {
    return this.#offset >= this.bytes.byteLength;
  }

  #advance(count: number): number {
    const offset = this.#offset;
    if (offset + count > this.bytes.byteLength) throw new ProtoError("", "unexpected end of buffer");
    this.#offset += count;
    return offset;
  }

  varint(): number {
    let value = 0;
    let scale = 1;
    for (let index = 0; index < 10; index += 1) {
      const byte = this.bytes[this.#advance(1)]!;
      if (scale < UINT32_LIMIT) value += (byte & 0x7f) * scale;
      scale *= 128;
      if (byte < 0x80) return value % UINT32_LIMIT;
    }
    throw new ProtoError("", "varint too long");
  }

  fixed32(): number {
    return this.#view.getUint32(this.#advance(4), true);
  }

  fixed64(): bigint {
    return this.#view.getBigUint64(this.#advance(8), true);
  }

  bytesField(): Uint8Array {
    const length = this.varint();
    const start = this.#advance(length);
    return this.bytes.subarray(start, start + length);
  }

  skip(type: number): void {
    switch (type) {
      case WireType.Varint:
        this.varint();
        return;
      case WireType.I64:
        this.#advance(8);
        return;
      case WireType.Len:
        this.bytesField();
        return;
      case WireType.I32:
        this.#advance(4);
        return;
      default:
        throw new ProtoError("", `unsupported wire type ${type}`);
    }
  }
}
