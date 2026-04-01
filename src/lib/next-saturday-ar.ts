const AR = "America/Argentina/Buenos_Aires";

/**
 * Próximo sábado 14:00 en Argentina (sin DST; offset -03:00).
 * Usado para anclar la Fecha 1 del fixture AFA Premio al fin de semana siguiente.
 */
export function getNextSaturday14BuenosAires(now: Date = new Date()): Date {
  for (let day = 0; day < 21; day++) {
    const t = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: AR,
      weekday: "short",
    }).format(t);
    if (wd !== "Sat") continue;
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: AR,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(t);
    const [y, mo, d] = ymd.split("-").map((x) => parseInt(x, 10));
    const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T14:00:00-03:00`;
    const candidate = new Date(iso);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}
