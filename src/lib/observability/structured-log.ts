/**
 * One JSON line per event for log aggregators. Intended for low-volume,
 * operational signals — not for high-frequency or PII-rich audit trails.
 *
 * Redacts keys that often carry secrets or personal data. Do not pass raw
 * request bodies or user profiles here.
 */

/** Keys (any segment) matching these patterns are replaced. */
const SENSITIVE_KEY =
  /(?:^|\.|_)(?:password|secret|token|authorization|cookie|credential|apikey|api_key|email|phone|userid|user_id|identifier|nationalid|ssn)(?:\.|_|$)/i;

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEY.test(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = sanitizeValue(v);
      }
    }
    return out;
  }
  return "[unserializable]";
}

/**
 * Structured log line for server-side critical flows. Keep payloads small:
 * resource ids (e.g. prode), counts, enums — not user identifiers.
 */
export function logStructured(
  event: string,
  data: Record<string, unknown> = {},
): void {
  const payload = sanitizeValue(data) as Record<string, unknown>;
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      service: "prodemix",
      event,
      ...payload,
    }),
  );
}
