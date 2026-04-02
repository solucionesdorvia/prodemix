"use client";

import * as Sentry from "@sentry/nextjs";

/**
 * Report an unexpected failure from a client component (mutations, critical fetches).
 * Pass only non-sensitive tags (area name, resource type) — no emails, tokens, or bodies.
 */
export function reportClientError(
  error: unknown,
  context: { area: string } & Record<string, string | number | boolean | undefined>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, {
    tags: { client_area: context.area },
    extra: {
      ...context,
    },
  });
}
