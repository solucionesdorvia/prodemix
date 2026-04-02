import type { ZodType } from "zod";

import { apiError } from "@/lib/api-errors";

import { zodToApiError } from "./zod-to-api";

export type ParseJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: ReturnType<typeof apiError> };

/** Read JSON body and validate with Zod. */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<ParseJsonResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: apiError(400, "INVALID_DATA", "Invalid JSON body."),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: zodToApiError(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
