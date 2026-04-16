/** Hora de fin del mantenimiento (Argentina). */
const AR_TZ = "America/Argentina/Buenos_Aires";

function envTruthy(v: string | undefined): boolean {
  return v === "true" || v === "1";
}

function endOfDayHourART(
  dayYmd: string,
  hour: number,
): Date {
  const [y, m, d] = dayYmd.split("-").map(Number);
  return new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00-03:00`,
  );
}

/**
 * `MAINTENANCE_MODE=true` y una de:
 * - `MAINTENANCE_UNTIL` (ISO 8601, fin del mantenimiento), o
 * - `MAINTENANCE_DAY=YYYY-MM-DD` (día calendario en Argentina) → hasta las 15:00 ART ese día.
 */
export function isMaintenanceModeActive(): boolean {
  if (!envTruthy(process.env.MAINTENANCE_MODE)) return false;
  const until = process.env.MAINTENANCE_UNTIL?.trim();
  if (until) {
    const t = new Date(until).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() < t;
  }
  const day = process.env.MAINTENANCE_DAY?.trim();
  if (!day) return false;
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TZ,
  }).format(new Date());
  if (todayStr !== day) return false;
  const end = endOfDayHourART(day, 15);
  return Date.now() < end.getTime();
}

/** Texto para la página de mantenimiento. */
export function getMaintenanceEndLabel(): string {
  const until = process.env.MAINTENANCE_UNTIL?.trim();
  if (until) {
    const d = new Date(until);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: AR_TZ,
      }).format(d);
    }
  }
  const day = process.env.MAINTENANCE_DAY?.trim();
  if (day) {
    const end = endOfDayHourART(day, 15);
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: AR_TZ,
    }).format(end);
  }
  return "hoy a las 15:00 (hora Argentina)";
}
