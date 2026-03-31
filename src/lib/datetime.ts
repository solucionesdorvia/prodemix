const LOCALE = "es-AR";

/** One line: weekday, day, month, time — e.g. match rows in crear / torneo detail. */
export function formatMatchKickoffFull(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Compact line for home “Pendientes” (no month). */
export function formatMatchKickoffPending(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Split date / clock lines for MatchCard. */
export function formatMatchKickoffSplit(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { date, time };
}

/**
 * Short deadline label for prode summary (“Hoy · 21:00” or weekday + time).
 */
export function formatDeadlineLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const day = d.toDateString() === now.toDateString();
  const t = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  if (day) return `Hoy · ${t}`;
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Countdown-style label for pool close times (future ISO). */
export function formatTimeUntilFuture(iso: string): string {
  const end = new Date(iso).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return "Cerrado";
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h >= 72) {
    return `Cierra ${formatDeadlineLabel(iso)}`;
  }
  if (h > 0) {
    return `Cierra en ${h}h ${min}m`;
  }
  return `Cierra en ${totalMin}m`;
}
