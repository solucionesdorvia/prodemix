import type { MatchId } from "@/domain";

export type RankingBot = {
  playerId: string;
  displayName: string;
  /** Included in “Amigos” tab */
  friendsScope: boolean;
  /** Included in “Liga” tab */
  ligaScope: boolean;
  /** One prediction per scored catalogue match */
  predictions: Record<MatchId, { home: number; away: number }>;
};

/**
 * Mock competitors with fixed predictions vs MOCK_MATCH_RESULTS.
 * Rankings are computed dynamically from these + the current user’s predictions.
 */
export const RANKING_BOTS: RankingBot[] = [
  {
    playerId: "bot-lucia",
    displayName: "Lucía Fernández",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-joma-p-f01-m01": { home: 2, away: 1 },
      "cm-joma-p-f01-m02": { home: 1, away: 1 },
      "cm-joma-p-f01-m03": { home: 0, away: 2 },
      "cm-joma-p-f01-m04": { home: 3, away: 3 },
      "cm-joma-p-f01-m05": { home: 2, away: 2 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 1, away: 2 },
      "cm-joma-p-f01-m08": { home: 2, away: 1 },
      "cm-joma-p-f01-m09": { home: 0, away: 2 },
      "cm-joma-p-f01-m10": { home: 3, away: 3 },
    },
  },
  {
    playerId: "bot-martin",
    displayName: "Martín Acosta",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-joma-p-f01-m01": { home: 1, away: 0 },
      "cm-joma-p-f01-m02": { home: 2, away: 2 },
      "cm-joma-p-f01-m03": { home: 1, away: 2 },
      "cm-joma-p-f01-m04": { home: 4, away: 3 },
      "cm-joma-p-f01-m05": { home: 1, away: 1 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 2, away: 3 },
      "cm-joma-p-f01-m08": { home: 2, away: 0 },
      "cm-joma-p-f01-m09": { home: 1, away: 2 },
      "cm-joma-p-f01-m10": { home: 4, away: 4 },
    },
  },
  {
    playerId: "bot-sofi",
    displayName: "Sofi R.",
    friendsScope: true,
    ligaScope: false,
    predictions: {
      "cm-joma-p-f01-m01": { home: 3, away: 1 },
      "cm-joma-p-f01-m02": { home: 1, away: 1 },
      "cm-joma-p-f01-m03": { home: 0, away: 1 },
      "cm-joma-p-f01-m04": { home: 5, away: 2 },
      "cm-joma-p-f01-m05": { home: 2, away: 3 },
      "cm-joma-p-f01-m06": { home: 2, away: 2 },
      "cm-joma-p-f01-m07": { home: 1, away: 3 },
      "cm-joma-p-f01-m08": { home: 3, away: 0 },
      "cm-joma-p-f01-m09": { home: 0, away: 4 },
      "cm-joma-p-f01-m10": { home: 3, away: 5 },
    },
  },
  {
    playerId: "bot-nacho",
    displayName: "Nacho Pérez",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-joma-p-f01-m01": { home: 2, away: 0 },
      "cm-joma-p-f01-m02": { home: 0, away: 0 },
      "cm-joma-p-f01-m03": { home: 0, away: 2 },
      "cm-joma-p-f01-m04": { home: 4, away: 2 },
      "cm-joma-p-f01-m05": { home: 3, away: 3 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 2, away: 3 },
      "cm-joma-p-f01-m08": { home: 1, away: 1 },
      "cm-joma-p-f01-m09": { home: 0, away: 3 },
      "cm-joma-p-f01-m10": { home: 5, away: 3 },
    },
  },
  {
    playerId: "bot-cami",
    displayName: "Cami López",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-joma-p-f01-m01": { home: 1, away: 1 },
      "cm-joma-p-f01-m02": { home: 1, away: 1 },
      "cm-joma-p-f01-m03": { home: 0, away: 3 },
      "cm-joma-p-f01-m04": { home: 4, away: 3 },
      "cm-joma-p-f01-m05": { home: 2, away: 2 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 1, away: 4 },
      "cm-joma-p-f01-m08": { home: 2, away: 1 },
      "cm-joma-p-f01-m09": { home: 1, away: 2 },
      "cm-joma-p-f01-m10": { home: 4, away: 4 },
    },
  },
  {
    playerId: "bot-tomi",
    displayName: "Tomi G.",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-joma-p-f01-m01": { home: 2, away: 1 },
      "cm-joma-p-f01-m02": { home: 2, away: 2 },
      "cm-joma-p-f01-m03": { home: 1, away: 2 },
      "cm-joma-p-f01-m04": { home: 3, away: 1 },
      "cm-joma-p-f01-m05": { home: 1, away: 1 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 2, away: 2 },
      "cm-joma-p-f01-m08": { home: 3, away: 0 },
      "cm-joma-p-f01-m09": { home: 0, away: 4 },
      "cm-joma-p-f01-m10": { home: 3, away: 5 },
    },
  },
  {
    playerId: "bot-juli",
    displayName: "Juli Martínez",
    friendsScope: false,
    ligaScope: false,
    predictions: {
      "cm-joma-p-f01-m01": { home: 0, away: 1 },
      "cm-joma-p-f01-m02": { home: 1, away: 1 },
      "cm-joma-p-f01-m03": { home: 0, away: 2 },
      "cm-joma-p-f01-m04": { home: 4, away: 3 },
      "cm-joma-p-f01-m05": { home: 2, away: 2 },
      "cm-joma-p-f01-m06": { home: 3, away: 3 },
      "cm-joma-p-f01-m07": { home: 1, away: 3 },
      "cm-joma-p-f01-m08": { home: 2, away: 1 },
      "cm-joma-p-f01-m09": { home: 0, away: 3 },
      "cm-joma-p-f01-m10": { home: 5, away: 3 },
    },
  },
];
