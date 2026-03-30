/** Parse non-negative goals from input; empty → null. */
export function parseGoalsInput(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number.parseInt(t, 10);
  if (Number.isNaN(n) || n < 0 || n > 99) return null;
  return n;
}

export function formatGoalsInput(n: number | null): string {
  if (n === null) return "";
  return String(n);
}
