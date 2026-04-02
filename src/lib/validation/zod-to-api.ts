import type { ZodError } from "zod";

import { apiError } from "@/lib/api-errors";

/** Maps Zod failures to structured API errors (422). */
export function zodToApiError(error: ZodError) {
  const message = error.issues[0]?.message ?? "Validation failed.";
  return apiError(422, "INVALID_DATA", message, {
    issues: error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    })),
  });
}
