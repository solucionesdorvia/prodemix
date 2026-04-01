import type { MatchId, ScorePrediction } from "@/domain";

export type RankingBot = {
  playerId: string;
  displayName: string;
  /** Included in “Amigos” tab */
  friendsScope: boolean;
  /** Included in “Liga” tab */
  ligaScope: boolean;
  /** One prediction per scored catalogue match */
  predictions: Record<MatchId, ScorePrediction>;
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
      "cm-afa-1": { predictedHomeScore: 2, predictedAwayScore: 1 },
      "cm-afa-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-afa-3": { predictedHomeScore: 0, predictedAwayScore: 2 },
      "cm-nu-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-ba-2": { predictedHomeScore: 0, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-zn-2": { predictedHomeScore: 2, predictedAwayScore: 1 },
      "cm-f8-1": { predictedHomeScore: 4, predictedAwayScore: 3 },
    },
  },
  {
    playerId: "bot-martin",
    displayName: "Martín Acosta",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-afa-2": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-afa-3": { predictedHomeScore: 1, predictedAwayScore: 2 },
      "cm-nu-1": { predictedHomeScore: 3, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 0, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-ba-2": { predictedHomeScore: 1, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 3, predictedAwayScore: 1 },
      "cm-zn-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-f8-1": { predictedHomeScore: 2, predictedAwayScore: 3 },
    },
  },
  {
    playerId: "bot-sofi",
    displayName: "Sofi R.",
    friendsScope: true,
    ligaScope: false,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 3, predictedAwayScore: 1 },
      "cm-afa-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-afa-3": { predictedHomeScore: 0, predictedAwayScore: 1 },
      "cm-nu-1": { predictedHomeScore: 3, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-ba-2": { predictedHomeScore: 2, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-zn-2": { predictedHomeScore: 0, predictedAwayScore: 0 },
      "cm-f8-1": { predictedHomeScore: 4, predictedAwayScore: 2 },
    },
  },
  {
    playerId: "bot-nacho",
    displayName: "Nacho Pérez",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-afa-2": { predictedHomeScore: 0, predictedAwayScore: 0 },
      "cm-afa-3": { predictedHomeScore: 0, predictedAwayScore: 2 },
      "cm-nu-1": { predictedHomeScore: 4, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 3, predictedAwayScore: 3 },
      "cm-ba-2": { predictedHomeScore: 1, predictedAwayScore: 2 },
      "cm-zn-1": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-zn-2": { predictedHomeScore: 1, predictedAwayScore: 2 },
      "cm-f8-1": { predictedHomeScore: 3, predictedAwayScore: 3 },
    },
  },
  {
    playerId: "bot-cami",
    displayName: "Cami López",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-afa-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-afa-3": { predictedHomeScore: 0, predictedAwayScore: 3 },
      "cm-nu-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-ba-2": { predictedHomeScore: 1, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 2, predictedAwayScore: 1 },
      "cm-zn-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-f8-1": { predictedHomeScore: 5, predictedAwayScore: 3 },
    },
  },
  {
    playerId: "bot-tomi",
    displayName: "Tomi G.",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 2, predictedAwayScore: 1 },
      "cm-afa-2": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-afa-3": { predictedHomeScore: 1, predictedAwayScore: 2 },
      "cm-nu-1": { predictedHomeScore: 3, predictedAwayScore: 1 },
      "cm-nu-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-ba-1": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-ba-2": { predictedHomeScore: 0, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-zn-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-f8-1": { predictedHomeScore: 4, predictedAwayScore: 4 },
    },
  },
  {
    playerId: "bot-juli",
    displayName: "Juli Martínez",
    friendsScope: false,
    ligaScope: false,
    predictions: {
      "cm-afa-1": { predictedHomeScore: 0, predictedAwayScore: 1 },
      "cm-afa-2": { predictedHomeScore: 1, predictedAwayScore: 1 },
      "cm-afa-3": { predictedHomeScore: 0, predictedAwayScore: 2 },
      "cm-nu-1": { predictedHomeScore: 3, predictedAwayScore: 2 },
      "cm-nu-2": { predictedHomeScore: 1, predictedAwayScore: 0 },
      "cm-ba-1": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-ba-2": { predictedHomeScore: 1, predictedAwayScore: 3 },
      "cm-zn-1": { predictedHomeScore: 2, predictedAwayScore: 0 },
      "cm-zn-2": { predictedHomeScore: 2, predictedAwayScore: 2 },
      "cm-f8-1": { predictedHomeScore: 3, predictedAwayScore: 3 },
    },
  },
];
