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
 * Predicciones sobre AFA Premio A · fecha 4 (partidos `afa-premio-a-m4-*`).
 */
export const RANKING_BOTS: RankingBot[] = [
  {
    playerId: "bot-lucia",
    displayName: "Lucía Fernández",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "afa-premio-a-m4-0": { home: 2, away: 1 },
      "afa-premio-a-m4-1": { home: 1, away: 1 },
      "afa-premio-a-m4-2": { home: 0, away: 2 },
      "afa-premio-a-m4-3": { home: 3, away: 3 },
      "afa-premio-a-m4-4": { home: 2, away: 2 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 1, away: 2 },
      "afa-premio-a-m4-7": { home: 2, away: 1 },
      "afa-premio-a-m4-8": { home: 0, away: 2 },
    },
  },
  {
    playerId: "bot-martin",
    displayName: "Martín Acosta",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "afa-premio-a-m4-0": { home: 1, away: 0 },
      "afa-premio-a-m4-1": { home: 2, away: 2 },
      "afa-premio-a-m4-2": { home: 1, away: 2 },
      "afa-premio-a-m4-3": { home: 4, away: 3 },
      "afa-premio-a-m4-4": { home: 1, away: 1 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 2, away: 3 },
      "afa-premio-a-m4-7": { home: 2, away: 0 },
      "afa-premio-a-m4-8": { home: 1, away: 2 },
    },
  },
  {
    playerId: "bot-sofi",
    displayName: "Sofi R.",
    friendsScope: true,
    ligaScope: false,
    predictions: {
      "afa-premio-a-m4-0": { home: 3, away: 1 },
      "afa-premio-a-m4-1": { home: 1, away: 1 },
      "afa-premio-a-m4-2": { home: 0, away: 1 },
      "afa-premio-a-m4-3": { home: 5, away: 2 },
      "afa-premio-a-m4-4": { home: 2, away: 3 },
      "afa-premio-a-m4-5": { home: 2, away: 2 },
      "afa-premio-a-m4-6": { home: 1, away: 3 },
      "afa-premio-a-m4-7": { home: 3, away: 0 },
      "afa-premio-a-m4-8": { home: 0, away: 4 },
    },
  },
  {
    playerId: "bot-nacho",
    displayName: "Nacho Pérez",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "afa-premio-a-m4-0": { home: 2, away: 0 },
      "afa-premio-a-m4-1": { home: 0, away: 0 },
      "afa-premio-a-m4-2": { home: 0, away: 2 },
      "afa-premio-a-m4-3": { home: 4, away: 2 },
      "afa-premio-a-m4-4": { home: 3, away: 3 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 2, away: 3 },
      "afa-premio-a-m4-7": { home: 1, away: 1 },
      "afa-premio-a-m4-8": { home: 0, away: 3 },
    },
  },
  {
    playerId: "bot-cami",
    displayName: "Cami López",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "afa-premio-a-m4-0": { home: 1, away: 1 },
      "afa-premio-a-m4-1": { home: 1, away: 1 },
      "afa-premio-a-m4-2": { home: 0, away: 3 },
      "afa-premio-a-m4-3": { home: 4, away: 3 },
      "afa-premio-a-m4-4": { home: 2, away: 2 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 1, away: 4 },
      "afa-premio-a-m4-7": { home: 2, away: 1 },
      "afa-premio-a-m4-8": { home: 1, away: 2 },
    },
  },
  {
    playerId: "bot-tomi",
    displayName: "Tomi G.",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "afa-premio-a-m4-0": { home: 2, away: 1 },
      "afa-premio-a-m4-1": { home: 2, away: 2 },
      "afa-premio-a-m4-2": { home: 1, away: 2 },
      "afa-premio-a-m4-3": { home: 3, away: 1 },
      "afa-premio-a-m4-4": { home: 1, away: 1 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 2, away: 2 },
      "afa-premio-a-m4-7": { home: 3, away: 0 },
      "afa-premio-a-m4-8": { home: 0, away: 4 },
    },
  },
  {
    playerId: "bot-juli",
    displayName: "Juli Martínez",
    friendsScope: false,
    ligaScope: false,
    predictions: {
      "afa-premio-a-m4-0": { home: 0, away: 1 },
      "afa-premio-a-m4-1": { home: 1, away: 1 },
      "afa-premio-a-m4-2": { home: 0, away: 2 },
      "afa-premio-a-m4-3": { home: 4, away: 3 },
      "afa-premio-a-m4-4": { home: 2, away: 2 },
      "afa-premio-a-m4-5": { home: 3, away: 3 },
      "afa-premio-a-m4-6": { home: 1, away: 3 },
      "afa-premio-a-m4-7": { home: 2, away: 1 },
      "afa-premio-a-m4-8": { home: 0, away: 3 },
    },
  },
];
