import type { ActivityKind, ProdeVisibility, ScorePrediction } from "@/domain";

/** Prode as stored locally (owner + included tournaments/matches). */
export interface StoredProde {
  id: string;
  ownerId: string;
  name: string;
  visibility: ProdeVisibility;
  createdAt: string;
  /** Mock shareable code (e.g. PMX-ABC12D). */
  inviteCode: string;
  tournamentIds: string[];
  /** Match ids included in this prode (subset of catalogue matches). */
  matchIds: string[];
}

export interface ActivityLogEntry {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  kind: ActivityKind;
  createdAt: string;
}

/** Key: `${userId}::${publicPoolId}::${matchId}` — mismo formato que prodes. */
export type PublicPoolPredictionMap = Record<string, ScorePrediction>;

export interface PersistedAppState {
  /**
   * When set, first-run onboarding is not shown again.
   * Omitted in older saves; persistence migrates from usage (prodes/follows).
   */
  onboardingCompletedAt: string | null;
  followedTournamentIds: string[];
  prodes: StoredProde[];
  /**
   * Predictions: key `${userId}::${prodeId}::${matchId}` → exact score.
   * Same match in two prodes uses distinct keys.
   */
  predictionMap: Record<string, ScorePrediction>;
  /** Pools públicos de fecha en los que el usuario entró (demo local). */
  joinedPublicPoolIds: string[];
  publicPoolPredictionMap: PublicPoolPredictionMap;
  activity: ActivityLogEntry[];
  /** Dedupe keys for one-off generated notifications (e.g. pts:prodeId:matchId). */
  activityDedupeKeys: string[];
  /** ISO timestamp — activity newer than this counts as unread for badge. */
  activityLastSeenAt: string | null;
}

export const DEFAULT_APP_STATE: PersistedAppState = {
  onboardingCompletedAt: null,
  followedTournamentIds: [],
  prodes: [],
  predictionMap: {},
  joinedPublicPoolIds: [],
  publicPoolPredictionMap: {},
  activity: [],
  activityDedupeKeys: [],
  activityLastSeenAt: null,
};
