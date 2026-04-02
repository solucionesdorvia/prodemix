import type { PublicPool } from "@/domain";
import type { TournamentCatalogueEntry } from "@/domain";
import {
  formatPublicPoolLabel,
  getPublicPoolForMatchday,
} from "@/mocks/catalog/primera-catalog";

export function isPoolPaid(pool: PublicPool): boolean {
  return pool.entryFeeArs > 0 || pool.type === "public_paid";
}

export type PoolExploreEntry = {
  pool: PublicPool;
  tournamentId: string;
  tournamentShortName: string;
  matchdayId: string;
  matchdayName: string;
  href: string;
  /** Ej. "AFA Futsal A — Fecha 3" */
  title: string;
};

export function collectPoolExploreEntries(
  catalogue: TournamentCatalogueEntry[],
): PoolExploreEntry[] {
  const out: PoolExploreEntry[] = [];
  for (const t of catalogue) {
    for (const md of t.matchdays) {
      const pool = getPublicPoolForMatchday(t.id, md.id);
      if (!pool) continue;
      out.push({
        pool,
        tournamentId: t.id,
        tournamentShortName: t.shortName,
        matchdayId: md.id,
        matchdayName: md.name,
        href: `/torneos/${encodeURIComponent(t.id)}/fechas/${encodeURIComponent(md.id)}`,
        title: formatPublicPoolLabel(pool),
      });
    }
  }
  return out;
}

/**
 * 0 = cierra hoy, 1 = mañana, 2 = después, 3 = día calendario pasado (raro con prode abierto).
 */
export function closeDayBucket(iso: string, nowMs = Date.now()): number {
  const close = new Date(iso);
  const now = new Date(nowMs);
  const closeDay = Date.UTC(
    close.getFullYear(),
    close.getMonth(),
    close.getDate(),
  );
  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diffDays = Math.round((closeDay - today) / 864e5);
  if (diffDays < 0) return 3;
  if (diffDays === 0) return 0;
  if (diffDays === 1) return 1;
  return 2;
}

export function sortPoolsByClosePriority(entries: PoolExploreEntry[]): PoolExploreEntry[] {
  return [...entries].sort((a, b) => {
    const bucketA = closeDayBucket(a.pool.closesAt);
    const bucketB = closeDayBucket(b.pool.closesAt);
    if (bucketA !== bucketB) return bucketA - bucketB;
    return (
      new Date(a.pool.closesAt).getTime() - new Date(b.pool.closesAt).getTime()
    );
  });
}
