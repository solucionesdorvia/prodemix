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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML mínimo (sin layout React) para responder 503 desde el proxy.
 * Así no corre la app, auth ni fetch a APIs.
 */
export function buildMaintenanceHtmlPage(): string {
  const cuando = escapeHtml(getMaintenanceEndLabel());
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>Mantenimiento · ProdeMix</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.5rem;
  font-family:system-ui,-apple-system,sans-serif;background:#f7f8fa;color:#0f172a}
  .card{max-width:28rem;width:100%;border:1px solid #e2e8f0;border-radius:1rem;padding:2rem 1.5rem;
  background:#fff;box-shadow:0 8px 30px rgba(15,23,42,.08);text-align:center}
  .eyebrow{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b}
  h1{margin:.5rem 0 0;font-size:1.375rem;line-height:1.25}
  p{margin:1rem 0 0;font-size:.875rem;line-height:1.5;color:#64748b}
  .when{margin-top:.75rem;padding:.65rem .75rem;border-radius:.75rem;background:#f8fafc;
  border:1px solid #e2e8f0;font-size:.8125rem;font-weight:600;color:#0f172a}
  .when span{color:#2563eb}
</style>
</head>
<body>
  <div class="card">
    <p class="eyebrow">ProdeMix</p>
    <h1>Estamos en mantenimiento</h1>
    <p>La aplicación no está disponible por unos minutos. No podés iniciar sesión ni usar el sitio hasta entonces.</p>
    <p class="when">Tiempo estimado: hasta <span>${cuando}</span></p>
  </div>
</body>
</html>`;
}
