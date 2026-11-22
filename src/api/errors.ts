export class UpstreamError extends Error {
  override readonly name = "UpstreamError";

  constructor(
    readonly source: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export const describe = (error: unknown): string =>
  error instanceof DOMException && error.name === "TimeoutError"
    ? "upstream timed out"
    : error instanceof Error
      ? error.message
      : "unknown error";
