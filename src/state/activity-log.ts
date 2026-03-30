import type { ActivityKind } from "@/domain";
import { findCatalogueMatchById } from "@/lib/catalogue-matches";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { pointsForPrediction } from "@/lib/scoring";

import { predictionStorageKey } from "./selectors";
import type { ActivityLogEntry, PersistedAppState } from "./types";

const MAX_POINT_EVENTS_PER_SYNC = 5;

/** Short relative label for list rows (mock/local). */
export function formatActivityTimeLabel(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d}d`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function computePointActivityEntries(
  state: PersistedAppState,
  userId: string,
  newActivityId: () => string,
): { entry: ActivityLogEntry; dedupeKey: string }[] {
  const dedupe = new Set(state.activityDedupeKeys);
  const out: { entry: ActivityLogEntry; dedupeKey: string }[] = [];

  for (const prode of state.prodes) {
    if (prode.ownerId !== userId) continue;
    for (const matchId of prode.matchIds) {
      if (out.length >= MAX_POINT_EVENTS_PER_SYNC) return out;
      const dedupeKey = `pts:${prode.id}:${matchId}`;
      if (dedupe.has(dedupeKey)) continue;

      const pred =
        state.predictionMap[predictionStorageKey(userId, prode.id, matchId)];
      const res = getMockResultForMatch(matchId);
      if (!pred || !res) continue;

      const pts = pointsForPrediction(pred, res);
      if (pts === 0) continue;

      const m = findCatalogueMatchById(matchId);
      const label =
        m ? `${m.homeTeam} vs ${m.awayTeam}` : "Partido";
      const createdAt = new Date().toISOString();
      const title = pts === 3 ? "Pleno" : "Puntos sumados";
      const detail =
        pts === 3 ?
          `${label} · +3 pts (marcador exacto)`
        : `${label} · +1 pt (resultado)`;

      out.push({
        dedupeKey,
        entry: {
          id: newActivityId(),
          title,
          detail,
          timeLabel: formatActivityTimeLabel(createdAt),
          kind: "points" as ActivityKind,
          createdAt,
        },
      });
    }
  }
  return out;
}
