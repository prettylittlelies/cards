export type Encoding = "br" | "gzip" | "identity";

export type CachePolicy = "immutable" | "durable" | "revalidate";

export type Asset = {
  readonly path: string;
  readonly type: string;
  readonly etag: string;
  readonly lastModified: string;
  readonly policy: CachePolicy;
  readonly bodies: ReadonlyMap<Encoding, Uint8Array<ArrayBuffer>>;
};

export type Manifest = ReadonlyMap<string, Asset>;

export type ServerConfig = {
  readonly root: string;
  readonly port: number;
  readonly hostname: string;
  readonly entry: string;
  readonly immutablePrefix: string;
  readonly compressMinBytes: number;
};
