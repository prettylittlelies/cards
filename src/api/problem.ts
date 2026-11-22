import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Problem = {
  readonly type: string;
  readonly title: string;
  readonly status: ContentfulStatusCode;
  readonly detail?: string;
  readonly instance: string;
};

export const problem = (c: Context, status: ContentfulStatusCode, title: string, detail?: string): Response =>
  c.body(
    JSON.stringify({ type: "about:blank", title, status, detail, instance: c.req.path } satisfies Problem),
    status,
    { "Content-Type": "application/problem+json", "Cache-Control": "no-store" },
  );
