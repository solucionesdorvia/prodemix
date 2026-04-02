const LOCALE = "es-AR";

/** One line: weekday, day, month, time — e.g. match rows in torneo detail. */
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

/** Cierre de pronósticos: 3 h antes del inicio del partido. */
export const PREDICTION_CLOSE_MS_BEFORE_KICKOFF = 3 * 60 * 60 * 1000;

/** ISO del instante en que dejan de aceptarse pronósticos para ese partido. */
export function predictionCloseAtIso(matchStartsAtIso: string): string {
  const t = Date.parse(matchStartsAtIso);
  if (Number.isNaN(t)) return matchStartsAtIso;
  return new Date(t - PREDICTION_CLOSE_MS_BEFORE_KICKOFF).toISOString();
}

/**
 * `true` si todavía se puede cargar o editar el pronóstico (hasta 3 h antes del kickoff).
 */
export function isPredictionDeadlineOpen(
  matchStartsAtIso: string,
  nowMs = Date.now(),
): boolean {
  const t = Date.parse(matchStartsAtIso);
  if (Number.isNaN(t)) return false;
  const deadline = t - PREDICTION_CLOSE_MS_BEFORE_KICKOFF;
  return nowMs < deadline;
}

/**
 * Cierre de pool / pronósticos — solo hechos, sin tono promocional.
 * "Cerrado" · "Cierra hoy HH:MM" · "Cierra en X h …" · fecha relativa si aplica.
 */
export function formatPoolCloseLabel(iso: string, nowMs = Date.now()): string {
  const endMs = new Date(iso).getTime();
  const diff = endMs - nowMs;
  if (diff <= 0) return "Cerrado";

  const close = new Date(iso);
  const now = new Date(nowMs);
  const timeOnly = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(close);

  if (close.toDateString() === now.toDateString()) {
    return `Cierra hoy ${timeOnly}`;
  }

  const hoursFloat = diff / 3_600_000;
  if (hoursFloat < 24) {
    const h = Math.floor(hoursFloat);
    const m = Math.round((hoursFloat - h) * 60);
    if (h === 0) return `Cierra en ${m} min`;
    return m > 0 ? `Cierra en ${h} h ${m} min` : `Cierra en ${h} h`;
  }

  const tomorrow = new Date(nowMs);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (close.toDateString() === tomorrow.toDateString()) {
    return `Cierra mañana ${timeOnly}`;
  }

  return `Cierra ${formatDeadlineLabel(iso)}`;
}

/** @deprecated Use {@link formatPoolCloseLabel} — mismo comportamiento. */
export const formatTimeUntilFuture = formatPoolCloseLabel;
