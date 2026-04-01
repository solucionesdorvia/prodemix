/**
 * Dynamic urgency copy for prode listing cards (deadline-driven, es-AR).
 */

export type ProdeUrgencyVariant = "critical" | "today" | "soon" | "calm";

export type ProdeUrgencyPresentation = {
  variant: ProdeUrgencyVariant;
  /** Main line, e.g. "Últimas horas" */
  headline: string;
  /** Supporting line, e.g. "Faltan 3 h" or "Antes de las 20:30" */
  subline: string;
};

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function nextCalendarDay(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  return d;
}

function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatWeekdayShort(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Urgency for an upcoming close. If already past, still returns a calm line
 * (caller may hide when prode is not open).
 */
export function getProdeUrgency(
  closesAtIso: string,
  nowMs: number = Date.now(),
): ProdeUrgencyPresentation {
  const close = new Date(closesAtIso).getTime();
  const msLeft = close - nowMs;

  if (msLeft <= 0) {
    return {
      variant: "calm",
      headline: "Cierre",
      subline: "Pronósticos cerrados",
    };
  }

  const hours = msLeft / 3_600_000;
  const now = new Date(nowMs);
  const closeDate = new Date(closesAtIso);
  const closesToday = sameCalendarDay(closeDate, now);
  const closesTomorrow = sameCalendarDay(closeDate, nextCalendarDay(now));

  if (hours <= 3) {
    const mins = Math.ceil(msLeft / 60_000);
    return {
      variant: "critical",
      headline: "Últimas horas",
      subline:
        hours < 1 ? `Faltan ${Math.max(1, mins)} min` : `Faltan ${Math.ceil(hours)} h`,
    };
  }

  if (closesToday) {
    return {
      variant: "today",
      headline: "Cierra hoy",
      subline: `Antes de las ${formatClock(closesAtIso)}`,
    };
  }

  if (closesTomorrow) {
    return {
      variant: "soon",
      headline: "Cierra mañana",
      subline: `A las ${formatClock(closesAtIso)} · Faltan ${Math.ceil(hours)} h`,
    };
  }

  if (hours <= 24) {
    return {
      variant: "soon",
      headline: "Próximo cierre",
      subline: `Faltan ${Math.ceil(hours)} h`,
    };
  }

  return {
    variant: "calm",
    headline: "Cierra",
    subline: `${formatWeekdayShort(closesAtIso)} · ${formatClock(closesAtIso)}`,
  };
}

export function urgencyStripClass(variant: ProdeUrgencyVariant): string {
  switch (variant) {
    case "critical":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "today":
      return "border-amber-200/90 bg-amber-50/90 text-amber-950";
    case "soon":
      return "border-blue-200/80 bg-blue-50/80 text-blue-950";
    default:
      return "border-app-border bg-app-bg text-app-text";
  }
}
