"use client";

import type { ActivityKind, ProdeVisibility, ScorePrediction } from "@/domain";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { findCatalogueMatchById } from "@/lib/catalogue-matches";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";
import { getMockCurrentUser } from "@/mocks/services/user.mock";

import {
  computePointActivityEntries,
  formatActivityTimeLabel,
} from "./activity-log";
import { collectInviteCodes, generateInviteCode } from "./invite-code";
import { loadPersistedState, savePersistedState } from "./persistence";
import { predictionStorageKey } from "./selectors";
import type { PublicPoolPredictionMap } from "./types";
import {
  DEFAULT_APP_STATE,
  type ActivityLogEntry,
  type PersistedAppState,
  type StoredProde,
} from "./types";

function newProdeId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ?
      `prode-${crypto.randomUUID()}`
    : `prode-${Date.now()}`;
}

function newActivityId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ?
      `act-${crypto.randomUUID()}`
    : `act-${Date.now()}`;
}

type CreateProdeInput = {
  name: string;
  visibility: ProdeVisibility;
  tournamentIds: string[];
  matchIds: string[];
};

type RecordActivityInput = {
  title: string;
  detail: string;
  kind: ActivityKind;
  dedupeKey?: string;
};

type AppStateValue = {
  hydrated: boolean;
  user: ReturnType<typeof getMockCurrentUser>;
  state: PersistedAppState;
  toggleFollowTournament: (tournamentId: string) => void;
  createProde: (input: CreateProdeInput) => string;
  setPrediction: (
    prodeId: string,
    matchId: string,
    score: ScorePrediction | null,
  ) => void;
  joinPublicPool: (poolId: string) => void;
  setPublicPoolPrediction: (
    poolId: string,
    matchId: string,
    score: ScorePrediction | null,
  ) => void;
  recordActivity: (input: RecordActivityInput) => void;
  markActivitySeen: () => void;
  /** Marks onboarding done (skip or finish). Persists. */
  completeOnboarding: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(DEFAULT_APP_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setState(loadPersistedState());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePersistedState(state);
  }, [state, hydrated]);

  const user = useMemo(() => getMockCurrentUser(), []);

  const recordActivity = useCallback((input: RecordActivityInput) => {
    setState((s) => {
      if (input.dedupeKey && s.activityDedupeKeys.includes(input.dedupeKey)) {
        return s;
      }
      const createdAt = new Date().toISOString();
      const entry: ActivityLogEntry = {
        id: newActivityId(),
        title: input.title,
        detail: input.detail,
        timeLabel: formatActivityTimeLabel(createdAt),
        kind: input.kind,
        createdAt,
      };
      const nextDedupe =
        input.dedupeKey ?
          [...s.activityDedupeKeys, input.dedupeKey].slice(-80)
        : s.activityDedupeKeys;
      return {
        ...s,
        activity: [entry, ...s.activity].slice(0, 25),
        activityDedupeKeys: nextDedupe,
      };
    });
  }, []);

  const markActivitySeen = useCallback(() => {
    setState((s) => ({
      ...s,
      activityLastSeenAt: new Date().toISOString(),
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({
      ...s,
      onboardingCompletedAt: new Date().toISOString(),
    }));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    queueMicrotask(() => {
      setState((s) => {
        const additions = computePointActivityEntries(s, user.id, newActivityId);
        if (additions.length === 0) return s;
        const dedupeSet = new Set(s.activityDedupeKeys);
        const filtered = additions.filter((a) => !dedupeSet.has(a.dedupeKey));
        if (filtered.length === 0) return s;
        return {
          ...s,
          activity: [
            ...filtered.map((x) => x.entry),
            ...s.activity,
          ].slice(0, 25),
          activityDedupeKeys: [
            ...s.activityDedupeKeys,
            ...filtered.map((x) => x.dedupeKey),
          ].slice(-100),
        };
      });
    });
  }, [hydrated, user.id, state.predictionMap, state.prodes]);

  const toggleFollowTournament = useCallback((tournamentId: string) => {
    setState((s) => {
      const next = new Set(s.followedTournamentIds);
      const wasFollowing = next.has(tournamentId);
      if (wasFollowing) next.delete(tournamentId);
      else next.add(tournamentId);

      if (!wasFollowing) {
        const t = getTournamentCatalogueEntryById(tournamentId);
        const createdAt = new Date().toISOString();
        const entry: ActivityLogEntry = {
          id: newActivityId(),
          title: "Seguís un torneo",
          detail: t?.name ?? t?.shortName ?? tournamentId,
          timeLabel: formatActivityTimeLabel(createdAt),
          kind: "follow",
          createdAt,
        };
        return {
          ...s,
          followedTournamentIds: [...next],
          activity: [entry, ...s.activity].slice(0, 25),
        };
      }

      return { ...s, followedTournamentIds: [...next] };
    });
  }, []);

  const createProde = useCallback(
    (params: CreateProdeInput): string => {
      const id = newProdeId();
      const createdAt = new Date().toISOString();
      setState((s) => {
        const codes = collectInviteCodes(s.prodes);
        const inviteCode = generateInviteCode(codes);
        return {
          ...s,
          prodes: [
            ...s.prodes,
            {
              id,
              ownerId: user.id,
              name: params.name,
              visibility: params.visibility,
              createdAt,
              inviteCode,
              tournamentIds: [...params.tournamentIds],
              matchIds: [...params.matchIds],
            },
          ],
          activity: [
            {
              id: newActivityId(),
              title: `Creaste "${params.name}"`,
              detail: `${params.matchIds.length} partidos en el prode`,
              timeLabel: formatActivityTimeLabel(createdAt),
              kind: "prode" as const,
              createdAt,
            },
            ...s.activity,
          ].slice(0, 25),
        };
      });
      return id;
    },
    [user.id],
  );

  const setPrediction = useCallback(
    (prodeId: string, matchId: string, score: ScorePrediction | null) => {
      const key = predictionStorageKey(user.id, prodeId, matchId);
      setState((s) => {
        const nextMap = { ...s.predictionMap };
        if (score === null) delete nextMap[key];
        else nextMap[key] = score;

        const m = findCatalogueMatchById(matchId);
        const label =
          m ? `${m.homeTeam} vs ${m.awayTeam}` : "Partido";
        const prodeName =
          s.prodes.find((p) => p.id === prodeId)?.name ?? "Prode";
        const createdAt = new Date().toISOString();

        const activity =
          score !== null ?
            [
              {
                id: newActivityId(),
                title: "Pronóstico guardado",
                detail: `${label} · ${score.home}-${score.away} · ${prodeName}`,
                timeLabel: formatActivityTimeLabel(createdAt),
                kind: "prediction" as const,
                createdAt,
              },
              ...s.activity,
            ].slice(0, 25)
          : [
              {
                id: newActivityId(),
                title: "Pronóstico borrado",
                detail: `${label} · ${prodeName}`,
                timeLabel: formatActivityTimeLabel(createdAt),
                kind: "prediction" as const,
                createdAt,
              },
              ...s.activity,
            ].slice(0, 25);

        return { ...s, predictionMap: nextMap, activity };
      });
    },
    [user.id],
  );

  const joinPublicPool = useCallback((poolId: string) => {
    setState((s) => {
      if (s.joinedPublicPoolIds.includes(poolId)) return s;
      return {
        ...s,
        joinedPublicPoolIds: [...s.joinedPublicPoolIds, poolId],
      };
    });
  }, []);

  const setPublicPoolPrediction = useCallback(
    (poolId: string, matchId: string, score: ScorePrediction | null) => {
      const key = predictionStorageKey(user.id, poolId, matchId);
      setState((s) => {
        const nextMap: PublicPoolPredictionMap = {
          ...s.publicPoolPredictionMap,
        };
        if (score === null) delete nextMap[key];
        else nextMap[key] = score;

        const m = findCatalogueMatchById(matchId);
        const label =
          m ? `${m.homeTeam} vs ${m.awayTeam}` : "Partido";
        const createdAt = new Date().toISOString();
        const activity =
          score !== null ?
            [
              {
                id: newActivityId(),
                title: "Pronóstico guardado",
                detail: `${label} · ${score.home}-${score.away} · Pool público`,
                timeLabel: formatActivityTimeLabel(createdAt),
                kind: "prediction" as const,
                createdAt,
              },
              ...s.activity,
            ].slice(0, 25)
          : s.activity;

        return { ...s, publicPoolPredictionMap: nextMap, activity };
      });
    },
    [user.id],
  );

  const value = useMemo(
    () => ({
      hydrated,
      user,
      state,
      toggleFollowTournament,
      createProde,
      setPrediction,
      joinPublicPool,
      setPublicPoolPrediction,
      recordActivity,
      markActivitySeen,
      completeOnboarding,
    }),
    [
      hydrated,
      user,
      state,
      toggleFollowTournament,
      createProde,
      setPrediction,
      joinPublicPool,
      setPublicPoolPrediction,
      recordActivity,
      markActivitySeen,
      completeOnboarding,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export function useOwnedProdes(): StoredProde[] {
  const { user, state } = useAppState();
  return useMemo(
    () => state.prodes.filter((p) => p.ownerId === user.id),
    [state.prodes, user.id],
  );
}
