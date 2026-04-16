import type { RankingApiRow } from "@/lib/ranking-query";

/** Orden fijo bajo los 3 perfiles de exhibición (puestos 4–9 si están en el prode). */
export const SHOWCASE_PRIORITY_USERNAMES = [
  "Tiagopaezzz_",
  "limasr",
  "chona10",
  "antichorro",
  "manugol",
  "faustir0",
] as const;

const PLACEHOLDER_PROFILES = [
  { id: "__display_lb_ph_1__", name: "Lucía Fernández" },
  { id: "__display_lb_ph_2__", name: "Martín Acosta" },
  { id: "__display_lb_ph_3__", name: "Sofía Ramírez" },
] as const;

/** Une título y slug y normaliza “Fecha4” → “fecha 4” para comparar. */
export function normalizePremioKey(title: string, slug: string): string {
  const raw = `${title} ${slug}`.toLowerCase().replace(/\s+/g, " ").trim();
  return raw.replace(/fecha(\d)/g, "fecha $1");
}

/**
 * Premio A/B Fecha 4 y Premio C Fecha 2 o 3: el podio mostrado son los primeros 3 usernames
 * de la lista que participen (orden fijo de lista), con puntos reales.
 */
export function isNamedPremioTopThreeProde(title: string, slug: string): boolean {
  const n = normalizePremioKey(title, slug);
  const premioB = n.includes("premio b") && n.includes("fecha 4");
  const premioA = n.includes("premio a") && n.includes("fecha 4");
  const premioC =
    n.includes("premio c") &&
    (n.includes("fecha 2") || n.includes("fecha 3"));
  return premioB || premioA || premioC;
}

/**
 * Primeros 3 lugares: los primeros 3 de `SHOWCASE_PRIORITY_USERNAMES` que estén en el ranking
 * (orden de lista). El resto sigue el orden materializado en DB.
 */
export function applyNamedPremioTopThreeOverlay(
  ranking: RankingApiRow[],
): RankingApiRow[] {
  if (ranking.length === 0) return ranking;

  const byUsername = new Map<string, RankingApiRow>();
  for (const r of ranking) {
    const u = r.user.username;
    if (u && !byUsername.has(u)) byUsername.set(u, r);
  }

  const top3: RankingApiRow[] = [];
  for (const un of SHOWCASE_PRIORITY_USERNAMES) {
    if (top3.length >= 3) break;
    const row = byUsername.get(un);
    if (row) top3.push({ ...row });
  }

  const top3Ids = new Set(top3.map((r) => r.user.id));
  const rest = ranking.filter((r) => !top3Ids.has(r.user.id));

  return [...top3, ...rest].map((r, i) => ({
    ...r,
    rank: i + 1,
  }));
}

/**
 * Para los prodes más recientes: inserta 3 filas ficticias arriba (sin usuario real “ganador”)
 * y coloca a los usuarios priorizados en los puestos siguientes con sus puntos reales del cálculo.
 */
export function applyShowcaseLeaderboardOverlay(
  ranking: RankingApiRow[],
): RankingApiRow[] {
  if (ranking.length === 0) return ranking;

  const maxPoints = Math.max(...ranking.map((r) => r.points));
  const maxPlenos = Math.max(...ranking.map((r) => r.plenos));
  const maxSign = Math.max(...ranking.map((r) => r.signHits));
  const computedAt = ranking[0]!.computedAt;

  const priorityUsernames = new Set<string>(SHOWCASE_PRIORITY_USERNAMES);
  const byUsername = new Map<string, RankingApiRow>();
  for (const r of ranking) {
    const u = r.user.username;
    if (u && !byUsername.has(u)) byUsername.set(u, r);
  }

  const placeholders: RankingApiRow[] = PLACEHOLDER_PROFILES.map((p, i) => ({
    rank: null,
    points: maxPoints + 30 - i * 5,
    plenos: maxPlenos + 3 - i,
    signHits: Math.max(0, maxSign + 2 - i),
    computedAt,
    displayPlaceholder: true,
    user: {
      id: p.id,
      name: p.name,
      username: null,
      image: null,
    },
  }));

  const priorityRows: RankingApiRow[] = [];
  for (const un of SHOWCASE_PRIORITY_USERNAMES) {
    const row = byUsername.get(un);
    if (row) priorityRows.push({ ...row });
  }

  const priorityIds = new Set(priorityRows.map((r) => r.user.id));
  const rest = ranking.filter(
    (r) =>
      !priorityUsernames.has(r.user.username ?? "") && !priorityIds.has(r.user.id),
  );

  const merged = [...placeholders, ...priorityRows, ...rest];
  return merged.map((r, i) => ({
    ...r,
    rank: i + 1,
  }));
}
