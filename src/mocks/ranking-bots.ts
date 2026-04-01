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
      "cm-afa-1": { home: 2, away: 1 },
      "cm-afa-2": { home: 1, away: 1 },
      "cm-afa-3": { home: 0, away: 2 },
      "cm-nu-1": { home: 2, away: 2 },
      "cm-nu-2": { home: 1, away: 0 },
      "cm-ba-1": { home: 2, away: 2 },
      "cm-ba-2": { home: 0, away: 3 },
      "cm-zn-1": { home: 2, away: 0 },
      "cm-zn-2": { home: 2, away: 1 },
      "cm-f8-1": { home: 4, away: 3 },
    },
  },
  {
    playerId: "bot-martin",
    displayName: "Martín Acosta",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { home: 1, away: 0 },
      "cm-afa-2": { home: 2, away: 2 },
      "cm-afa-3": { home: 1, away: 2 },
      "cm-nu-1": { home: 3, away: 2 },
      "cm-nu-2": { home: 0, away: 0 },
      "cm-ba-1": { home: 1, away: 1 },
      "cm-ba-2": { home: 1, away: 3 },
      "cm-zn-1": { home: 3, away: 1 },
      "cm-zn-2": { home: 1, away: 1 },
      "cm-f8-1": { home: 2, away: 3 },
    },
  },
  {
    playerId: "bot-sofi",
    displayName: "Sofi R.",
    friendsScope: true,
    ligaScope: false,
    predictions: {
      "cm-afa-1": { home: 3, away: 1 },
      "cm-afa-2": { home: 1, away: 1 },
      "cm-afa-3": { home: 0, away: 1 },
      "cm-nu-1": { home: 3, away: 2 },
      "cm-nu-2": { home: 2, away: 0 },
      "cm-ba-1": { home: 2, away: 2 },
      "cm-ba-2": { home: 2, away: 3 },
      "cm-zn-1": { home: 1, away: 0 },
      "cm-zn-2": { home: 0, away: 0 },
      "cm-f8-1": { home: 4, away: 2 },
    },
  },
  {
    playerId: "bot-nacho",
    displayName: "Nacho Pérez",
    friendsScope: true,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { home: 2, away: 0 },
      "cm-afa-2": { home: 0, away: 0 },
      "cm-afa-3": { home: 0, away: 2 },
      "cm-nu-1": { home: 4, away: 2 },
      "cm-nu-2": { home: 1, away: 0 },
      "cm-ba-1": { home: 3, away: 3 },
      "cm-ba-2": { home: 1, away: 2 },
      "cm-zn-1": { home: 2, away: 0 },
      "cm-zn-2": { home: 1, away: 2 },
      "cm-f8-1": { home: 3, away: 3 },
    },
  },
  {
    playerId: "bot-cami",
    displayName: "Cami López",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { home: 1, away: 1 },
      "cm-afa-2": { home: 1, away: 1 },
      "cm-afa-3": { home: 0, away: 3 },
      "cm-nu-1": { home: 2, away: 2 },
      "cm-nu-2": { home: 1, away: 0 },
      "cm-ba-1": { home: 2, away: 2 },
      "cm-ba-2": { home: 1, away: 3 },
      "cm-zn-1": { home: 2, away: 1 },
      "cm-zn-2": { home: 1, away: 1 },
      "cm-f8-1": { home: 5, away: 3 },
    },
  },
  {
    playerId: "bot-tomi",
    displayName: "Tomi G.",
    friendsScope: false,
    ligaScope: true,
    predictions: {
      "cm-afa-1": { home: 2, away: 1 },
      "cm-afa-2": { home: 2, away: 2 },
      "cm-afa-3": { home: 1, away: 2 },
      "cm-nu-1": { home: 3, away: 1 },
      "cm-nu-2": { home: 1, away: 1 },
      "cm-ba-1": { home: 1, away: 1 },
      "cm-ba-2": { home: 0, away: 3 },
      "cm-zn-1": { home: 2, away: 0 },
      "cm-zn-2": { home: 1, away: 1 },
      "cm-f8-1": { home: 4, away: 4 },
    },
  },
  {
    playerId: "bot-juli",
    displayName: "Juli Martínez",
    friendsScope: false,
    ligaScope: false,
    predictions: {
      "cm-afa-1": { home: 0, away: 1 },
      "cm-afa-2": { home: 1, away: 1 },
      "cm-afa-3": { home: 0, away: 2 },
      "cm-nu-1": { home: 3, away: 2 },
      "cm-nu-2": { home: 1, away: 0 },
      "cm-ba-1": { home: 2, away: 2 },
      "cm-ba-2": { home: 1, away: 3 },
      "cm-zn-1": { home: 2, away: 0 },
      "cm-zn-2": { home: 2, away: 2 },
      "cm-f8-1": { home: 3, away: 3 },
    },
  },
];
