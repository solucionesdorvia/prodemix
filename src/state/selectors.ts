import type {
  HomeStatsSnapshot,
  Match,
  ProdeSummary,
  RankingEntry,
  RankingScope,
  ScorePrediction,
} from "@/domain";

import { formatDeadlineLabel } from "@/lib/datetime";
import {
  findCatalogueMatchById,
  getMatchIdsForTournament,
} from "@/lib/catalogue-matches";
import {
  getMatchIdsForMatchday,
  getPublicPoolById,
} from "@/mocks/catalog/primera-catalog";
import {
  getAllScoredMatchIds,
  getMockResultForMatch,
} from "@/mocks/mock-match-results";
import { RANKING_BOTS, type RankingBot } from "@/mocks/ranking-bots";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";
import {
  compareRankingSortScalars,
  lastPredictionSavedAtMsInScope,
  withSyntheticSavedAtForPredictions,
} from "@/lib/ranking-tiebreak";
import { pointsForPrediction } from "@/lib/scoring";

import { mergeRankDeltas } from "./ranking-snapshot";
import type { PersistedAppState, StoredProde } from "./types";

type PlayerRow = {
  playerId: string;
  displayName: string;
  predictions: Record<string, ScorePrediction | undefined>;
};

export function predictionStorageKey(
  userId: string,
  prodeId: string,
  matchId: string,
): string {
  return `${userId}::${prodeId}::${matchId}`;
}

/** Predictions for one user scoped to a single prode. */
export function getPredictionsForProde(
  userId: string,
  prodeId: string,
  predictionMap: PersistedAppState["predictionMap"],
): Record<string, ScorePrediction> {
  const prefix = `${userId}::${prodeId}::`;
  const out: Record<string, ScorePrediction> = {};
  for (const [k, v] of Object.entries(predictionMap)) {
    if (!k.startsWith(prefix)) continue;
    const matchId = k.split("::")[2];
    if (matchId) out[matchId] = v;
  }
  return out;
}

export function getPredictionsForPublicPool(
  userId: string,
  poolId: string,
  publicPoolPredictionMap: PersistedAppState["publicPoolPredictionMap"],
): Record<string, ScorePrediction> {
  const prefix = `${userId}::${poolId}::`;
  const out: Record<string, ScorePrediction> = {};
  for (const [k, v] of Object.entries(publicPoolPredictionMap)) {
    if (!k.startsWith(prefix)) continue;
    const matchId = k.split("::")[2];
    if (matchId) out[matchId] = v;
  }
  return out;
}

function slicePredictionsToMatchIds(
  preds: Record<string, ScorePrediction | undefined>,
  matchIds: string[],
): Record<string, ScorePrediction | undefined> {
  const out: Record<string, ScorePrediction | undefined> = {};
  for (const id of matchIds) {
    const p = preds[id];
    if (p !== undefined) out[id] = p;
  }
  return out;
}

export type RankingScoreBreakdown = {
  points: number;
  exactScores: number;
  /** Aciertos de signo (1 pt c/u), sin contar plenos. */
  signHits: number;
  predictionsOnScored: number;
  /** Desempate: min(savedAt) en el scope — ASC gana (primera marca más temprana). */
  lastPredictionSavedAtMs: number;
};

/**
 * Puntos y stats por usuario para un set de partidos.
 * Solo cuenta partidos con resultado (`getMockResultForMatch`) y pronóstico.
 * Puntos: pleno 3 · signo 1 · error 0. Orden tabla: ver `compareRankingSortScalars`.
 */
export function computeRankingScoreBreakdown(
  predictions: Record<string, ScorePrediction | undefined>,
  matchIds: string[],
): RankingScoreBreakdown {
  let points = 0;
  let exactScores = 0;
  let signHits = 0;
  let predictionsOnScored = 0;
  for (const matchId of matchIds) {
    const actual = getMockResultForMatch(matchId);
    const pred = predictions[matchId];
    if (!actual || !pred) continue;
    predictionsOnScored += 1;
    const p = pointsForPrediction(pred, actual);
    points += p;
    if (p === 3) exactScores += 1;
    else if (p === 1) signHits += 1;
  }
  const lastPredictionSavedAtMs = lastPredictionSavedAtMsInScope(
    predictions,
    matchIds,
  );
  return {
    points,
    exactScores,
    signHits,
    predictionsOnScored,
    lastPredictionSavedAtMs,
  };
}

/** Points only for matches in this prode (intersection with mock results). */
export function computePointsBreakdownForProde(
  predictions: Record<string, ScorePrediction | undefined>,
  matchIds: string[],
): RankingScoreBreakdown {
  return computeRankingScoreBreakdown(predictions, matchIds);
}

export function buildProdeRankingEntries(
  prode: StoredProde,
  currentUserId: string,
  currentUserDisplayName: string,
  state: PersistedAppState,
): RankingEntry[] {
  const matchIds = prode.matchIds;
  const userPreds = getPredictionsForProde(
    currentUserId,
    prode.id,
    state.predictionMap,
  );
  const userSliced = slicePredictionsToMatchIds(userPreds, matchIds);

  const rows: PlayerRow[] = [
    {
      playerId: currentUserId,
      displayName: currentUserDisplayName,
      predictions: withSyntheticSavedAtForPredictions(
        currentUserId,
        userSliced,
      ),
    },
    ...RANKING_BOTS.map((b) => ({
      playerId: b.playerId,
      displayName: b.displayName,
      predictions: withSyntheticSavedAtForPredictions(
        b.playerId,
        slicePredictionsToMatchIds(
          b.predictions as Record<string, ScorePrediction | undefined>,
          matchIds,
        ),
      ),
    })),
  ];

  const scored = rows.map((row) => {
    const b = computePointsBreakdownForProde(row.predictions, matchIds);
    return {
      playerId: row.playerId,
      displayName: row.displayName,
      points: b.points,
      exactScores: b.exactScores,
      signHits: b.signHits,
      predictionsOnScored: b.predictionsOnScored,
      lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
    };
  });

  scored.sort((a, b) =>
    compareRankingSortScalars(
      {
        points: a.points,
        exactScores: a.exactScores,
        signHits: a.signHits,
        lastPredictionSavedAtMs: a.lastPredictionSavedAtMs,
        displayName: a.displayName,
      },
      {
        points: b.points,
        exactScores: b.exactScores,
        signHits: b.signHits,
        lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
        displayName: b.displayName,
      },
    ),
  );

  const mapped = scored.map((r, i) => ({
    rank: i + 1,
    playerId: r.playerId,
    displayName: r.displayName,
    points: r.points,
    exactScores: r.exactScores,
    signHits: r.signHits,
    predictionsOnScored: r.predictionsOnScored,
    streakDays: 0,
  }));

  return mergeRankDeltas(mapped, `prode:${prode.id}`);
}

/**
 * Union of predictions per match: pools públicos pisan pronósticos de prodes
 * si comparten el mismo matchId.
 */
export function aggregateUserPredictionsByMatch(
  userId: string,
  state: PersistedAppState,
): Record<string, ScorePrediction> {
  const out: Record<string, ScorePrediction> = {};
  const prefix = `${userId}::`;
  for (const [k, v] of Object.entries(state.predictionMap)) {
    if (!k.startsWith(prefix)) continue;
    const matchId = k.split("::")[2];
    if (matchId) out[matchId] = v;
  }
  for (const [k, v] of Object.entries(state.publicPoolPredictionMap)) {
    if (!k.startsWith(prefix)) continue;
    const matchId = k.split("::")[2];
    if (matchId) out[matchId] = v;
  }
  return out;
}

export function computePointsBreakdown(
  predictions: Record<string, ScorePrediction | undefined>,
): RankingScoreBreakdown {
  return computeRankingScoreBreakdown(predictions, getAllScoredMatchIds());
}

function botPredictionsRecord(bot: RankingBot): Record<string, ScorePrediction> {
  return bot.predictions;
}

function playersForTournament(
  tournamentId: string,
  currentUserId: string,
  userPredictions: Record<string, ScorePrediction>,
  currentUserDisplayName: string,
): PlayerRow[] {
  const matchIds = getMatchIdsForTournament(tournamentId);
  const userRow: PlayerRow = {
    playerId: currentUserId,
    displayName: currentUserDisplayName,
    predictions: slicePredictionsToMatchIds(userPredictions, matchIds),
  };
  const bots = RANKING_BOTS.map((b) => ({
    playerId: b.playerId,
    displayName: b.displayName,
    predictions: slicePredictionsToMatchIds(
      botPredictionsRecord(b) as Record<string, ScorePrediction | undefined>,
      matchIds,
    ),
  }));
  return [userRow, ...bots];
}

function playersForScope(
  scope: RankingScope,
  currentUserId: string,
  userPredictions: Record<string, ScorePrediction>,
  currentUserDisplayName: string,
): PlayerRow[] {
  const userRow: PlayerRow = {
    playerId: currentUserId,
    displayName: currentUserDisplayName,
    predictions: userPredictions,
  };

  const bots = RANKING_BOTS.filter((b) => {
    if (scope === "friends") return b.friendsScope;
    if (scope === "liga") return b.ligaScope;
    return true;
  }).map((b) => ({
    playerId: b.playerId,
    displayName: b.displayName,
    predictions: botPredictionsRecord(b) as Record<string, ScorePrediction | undefined>,
  }));

  return [userRow, ...bots];
}

export type BuildRankingOptions = {
  tournamentId?: string | null;
  publicPoolId?: string | null;
};

export function buildPublicPoolRankingEntries(
  poolId: string,
  currentUserId: string,
  currentUserDisplayName: string,
  state: PersistedAppState,
): RankingEntry[] {
  const pool = getPublicPoolById(poolId);
  if (!pool) return [];
  const matchIds = getMatchIdsForMatchday(pool.tournamentId, pool.matchdayId);
  const userPreds = getPredictionsForPublicPool(
    currentUserId,
    poolId,
    state.publicPoolPredictionMap,
  );
  const userSliced = slicePredictionsToMatchIds(userPreds, matchIds);

  const rows: PlayerRow[] = [
    {
      playerId: currentUserId,
      displayName: currentUserDisplayName,
      predictions: withSyntheticSavedAtForPredictions(
        currentUserId,
        userSliced,
      ),
    },
    ...RANKING_BOTS.map((b) => ({
      playerId: b.playerId,
      displayName: b.displayName,
      predictions: withSyntheticSavedAtForPredictions(
        b.playerId,
        slicePredictionsToMatchIds(
          b.predictions as Record<string, ScorePrediction | undefined>,
          matchIds,
        ),
      ),
    })),
  ];

  const scored = rows.map((row) => {
    const b = computePointsBreakdownForProde(row.predictions, matchIds);
    return {
      playerId: row.playerId,
      displayName: row.displayName,
      points: b.points,
      exactScores: b.exactScores,
      signHits: b.signHits,
      predictionsOnScored: b.predictionsOnScored,
      lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
    };
  });

  scored.sort((a, b) =>
    compareRankingSortScalars(
      {
        points: a.points,
        exactScores: a.exactScores,
        signHits: a.signHits,
        lastPredictionSavedAtMs: a.lastPredictionSavedAtMs,
        displayName: a.displayName,
      },
      {
        points: b.points,
        exactScores: b.exactScores,
        signHits: b.signHits,
        lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
        displayName: b.displayName,
      },
    ),
  );

  const mapped = scored.map((r, i) => ({
    rank: i + 1,
    playerId: r.playerId,
    displayName: r.displayName,
    points: r.points,
    exactScores: r.exactScores,
    signHits: r.signHits,
    predictionsOnScored: r.predictionsOnScored,
    streakDays: 0,
    scope: "fecha" as const,
  }));

  return mergeRankDeltas(mapped, `pool:${poolId}`);
}

export function buildRankingEntries(
  scope: RankingScope,
  currentUserId: string,
  currentUserDisplayName: string,
  state: PersistedAppState,
  options?: BuildRankingOptions,
): RankingEntry[] {
  const publicPoolId = options?.publicPoolId ?? null;
  if (scope === "fecha" && publicPoolId) {
    return buildPublicPoolRankingEntries(
      publicPoolId,
      currentUserId,
      currentUserDisplayName,
      state,
    );
  }

  const userPreds = aggregateUserPredictionsByMatch(currentUserId, state);

  const tournamentId = options?.tournamentId ?? null;
  const rows =
    scope === "tournament" && tournamentId ?
      playersForTournament(
        tournamentId,
        currentUserId,
        userPreds,
        currentUserDisplayName,
      )
    : scope === "tournament" ? []
    : playersForScope(
        scope,
        currentUserId,
        userPreds,
        currentUserDisplayName,
      );

  const matchIdsForScoring =
    scope === "tournament" && tournamentId ?
      getMatchIdsForTournament(tournamentId)
    : getAllScoredMatchIds();

  const rowsWithSeeds = rows.map((row) => ({
    ...row,
    predictions: withSyntheticSavedAtForPredictions(
      row.playerId,
      row.predictions,
    ),
  }));

  const scored = rowsWithSeeds.map((row) => {
    const b = computeRankingScoreBreakdown(row.predictions, matchIdsForScoring);
    return {
      playerId: row.playerId,
      displayName: row.displayName,
      points: b.points,
      exactScores: b.exactScores,
      signHits: b.signHits,
      predictionsOnScored: b.predictionsOnScored,
      lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
    };
  });

  scored.sort((a, b) =>
    compareRankingSortScalars(
      {
        points: a.points,
        exactScores: a.exactScores,
        signHits: a.signHits,
        lastPredictionSavedAtMs: a.lastPredictionSavedAtMs,
        displayName: a.displayName,
      },
      {
        points: b.points,
        exactScores: b.exactScores,
        signHits: b.signHits,
        lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
        displayName: b.displayName,
      },
    ),
  );

  const mapped = scored.map((r, i) => ({
    rank: i + 1,
    playerId: r.playerId,
    displayName: r.displayName,
    points: r.points,
    exactScores: r.exactScores,
    signHits: r.signHits,
    predictionsOnScored: r.predictionsOnScored,
    streakDays: 0,
    scope,
  }));

  const scopeKey =
    scope === "tournament" && tournamentId ?
      `tournament:${tournamentId}`
    : scope === "fecha" && publicPoolId ?
      `pool:${publicPoolId}`
    : scope;

  return mergeRankDeltas(mapped, scopeKey);
}

export function getGlobalRankForUser(
  currentUserId: string,
  currentUserDisplayName: string,
  state: PersistedAppState,
): number {
  const entries = buildRankingEntries(
    "global",
    currentUserId,
    currentUserDisplayName,
    state,
  );
  const row = entries.find((e) => e.playerId === currentUserId);
  return row?.rank ?? entries.length + 1;
}

export function countPendingMarkers(
  currentUserId: string,
  state: PersistedAppState,
): number {
  const mine = state.prodes.filter((p) => p.ownerId === currentUserId);
  let n = 0;
  for (const prode of mine) {
    for (const matchId of prode.matchIds) {
      const key = predictionStorageKey(currentUserId, prode.id, matchId);
      if (!state.predictionMap[key]) n += 1;
    }
  }
  for (const poolId of state.joinedPublicPoolIds) {
    const pool = getPublicPoolById(poolId);
    if (!pool) continue;
    const matchIds = getMatchIdsForMatchday(pool.tournamentId, pool.matchdayId);
    for (const matchId of matchIds) {
      const key = predictionStorageKey(currentUserId, poolId, matchId);
      if (!state.publicPoolPredictionMap[key]) n += 1;
    }
  }
  return n;
}

/** Upcoming catalogue matches in the user's prodes without prediction (actionable). */
export type HomePendingMatch = {
  match: Match;
  prodeId: string;
  prodeName: string;
};

export function buildHomePendingPredictions(
  userId: string,
  state: PersistedAppState,
  options?: { limit?: number },
): HomePendingMatch[] {
  const cap = options?.limit ?? 12;
  const now = Date.now();
  const out: HomePendingMatch[] = [];

  for (const prode of state.prodes) {
    if (prode.ownerId !== userId) continue;
    for (const matchId of prode.matchIds) {
      const key = predictionStorageKey(userId, prode.id, matchId);
      if (state.predictionMap[key]) continue;
      if (getMockResultForMatch(matchId)) continue;
      const m = findCatalogueMatchById(matchId);
      if (!m) continue;
      if (new Date(m.startsAt).getTime() <= now) continue;
      out.push({ match: m, prodeId: prode.id, prodeName: prode.name });
    }
  }

  out.sort(
    (a, b) =>
      new Date(a.match.startsAt).getTime() -
      new Date(b.match.startsAt).getTime(),
  );
  return out.slice(0, cap);
}

export function getFollowedTournamentsForHome(
  state: PersistedAppState,
): { id: string; shortName: string }[] {
  return state.followedTournamentIds.map((id) => {
    const t = getTournamentCatalogueEntryById(id);
    return t
      ? { id, shortName: t.shortName }
      : { id, shortName: id };
  });
}

export function buildProdeSummary(
  prode: StoredProde,
  currentUserId: string,
  state: PersistedAppState,
): ProdeSummary {
  const n = prode.matchIds.length;
  let pending = 0;
  let earliest: string | null = null;
  for (const matchId of prode.matchIds) {
    const key = predictionStorageKey(currentUserId, prode.id, matchId);
    if (!state.predictionMap[key]) pending += 1;
    const m = findCatalogueMatchById(matchId);
    if (m) {
      if (!earliest || m.startsAt < earliest) earliest = m.startsAt;
    }
  }
  return {
    id: prode.id,
    name: prode.name,
    matchCount: n,
    nextDeadline: earliest ? formatDeadlineLabel(earliest) : "—",
    progressLabel: `${n - pending}/${n} marcadores`,
  };
}

export function buildHomeStats(
  currentUserId: string,
  currentUserDisplayName: string,
  state: PersistedAppState,
): HomeStatsSnapshot {
  const preds = aggregateUserPredictionsByMatch(currentUserId, state);
  const { points, exactScores } = computePointsBreakdown(preds);
  return {
    weekPoints: points,
    exactScores,
    weekRank: getGlobalRankForUser(
      currentUserId,
      currentUserDisplayName,
      state,
    ),
    pendingMarkers: countPendingMarkers(currentUserId, state),
  };
}
