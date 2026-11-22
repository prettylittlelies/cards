export class ProtoError extends Error {
  override readonly name = "ProtoError";

  constructor(
    readonly path: string,
    message: string,
  ) {
    super(path ? `${path}: ${message}` : message);
  }
}
