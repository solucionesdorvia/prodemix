import { apiError } from "@/lib/api-errors";

export function rateLimitResponse(retryAfterSec: number) {
  const res = apiError(
    429,
    "RATE_LIMIT",
    "Demasiados intentos. Probá de nuevo en unos segundos.",
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}
