"use client";

import {
  ArrowLeft,
  CalendarOff,
  Lock,
  SearchX,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Match } from "@/domain";
import { MatchCard } from "@/components/matches/MatchCard";
import { EmptyState, EmptyStateButtonLink } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { findCatalogueMatchById } from "@/lib/catalogue-matches";
import { pointsForPrediction } from "@/lib/scoring";
import { pageEyebrow, pageHeader, pageTitle, statLabel } from "@/lib/ui-styles";
import {
  getOfficialProdeListItemById,
  getStoredProdeFromOfficialOrNull,
} from "@/mocks/official-prodes.mock";
import { getMockProdeActivity, getMockParticipantCount } from "@/mocks/prode-hub.mock";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import {
  buildProdeRankingEntries,
  computePointsBreakdownForProde,
  getPredictionsForProde,
  predictionStorageKey,
} from "@/state/selectors";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

import { RankingDeltaBadge } from "@/components/ranking/RankingDeltaBadge";
import { RankingStatsLine } from "@/components/ranking/RankingStatsLine";
import { persistScopeRanks } from "@/state/ranking-snapshot";

import { ProdeInviteShare } from "./ProdeInviteShare";

type ProdesDetailClientProps = {
  prodeId: string;
};

export function ProdesDetailClient({ prodeId }: ProdesDetailClientProps) {
  const { user, state, setPrediction } = useAppState();
  const [shareUrl, setShareUrl] = useState("");

  const prode = useMemo(() => {
    return (
      getStoredProdeFromOfficialOrNull(prodeId) ??
      state.prodes.find((p) => p.id === prodeId) ??
      null
    );
  }, [state.prodes, prodeId]);

  const officialMeta = getOfficialProdeListItemById(prodeId);
  const isOfficial = prode?.ownerId === "platform";

  const matches = useMemo((): Match[] => {
    if (!prode) return [];
    const out: Match[] = [];
    for (const mid of prode.matchIds) {
      const m = findCatalogueMatchById(mid);
      if (m) out.push(m);
    }
    return out;
  }, [prode]);

  const tournamentLabels = useMemo(() => {
    if (!prode) return [];
    return prode.tournamentIds.map((tid) => {
      const t = getTournamentCatalogueEntryById(tid);
      return { id: tid, shortName: t?.shortName ?? tid, name: t?.name ?? tid };
    });
  }, [prode]);

  const userPreds = useMemo(() => {
    if (!prode) return {};
    return getPredictionsForProde(user.id, prode.id, state.predictionMap);
  }, [prode, user.id, state.predictionMap]);

  const breakdown = useMemo(() => {
    if (!prode) {
      return {
        points: 0,
        exactScores: 0,
        partialHits: 0,
        predictionsOnScored: 0,
      };
    }
    return computePointsBreakdownForProde(userPreds, prode.matchIds);
  }, [prode, userPreds]);

  const prodeRanking = useMemo(() => {
    if (!prode) return [];
    return buildProdeRankingEntries(
      prode,
      user.id,
      user.displayName,
      state,
    );
  }, [prode, user.id, user.displayName, state]);

  const rankingPreview = useMemo(
    () => prodeRanking.slice(0, 5),
    [prodeRanking],
  );

  const userRank = useMemo(
    () => prodeRanking.find((r) => r.playerId === user.id)?.rank ?? null,
    [prodeRanking, user.id],
  );

  const pendingCount = useMemo(() => {
    if (!prode) return 0;
    let n = 0;
    for (const mid of prode.matchIds) {
      const key = predictionStorageKey(user.id, prode.id, mid);
      if (!state.predictionMap[key]) n += 1;
    }
    return n;
  }, [prode, user.id, state.predictionMap]);

  const participantCount = prode
    ? (officialMeta?.participants ?? getMockParticipantCount(prode.id))
    : 0;
  const activityLines = prode ? getMockProdeActivity(prode.name) : [];

  useEffect(() => {
    if (!prode) return;
    queueMicrotask(() => {
      setShareUrl(
        `${window.location.origin}/prodes/${encodeURIComponent(prode.id)}`,
      );
    });
  }, [prode]);

  useEffect(() => {
    if (!prode || prodeRanking.length === 0) return;
    persistScopeRanks(`prode:${prode.id}`, prodeRanking);
  }, [prode, prodeRanking]);

  if (!prode) {
    return (
      <div className="pb-4">
        <Link
          href={officialMeta ? "/prodes" : "/"}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {officialMeta ? "Prodes" : "Inicio"}
        </Link>
        <EmptyState
          className="mt-4"
          variant="soft"
          layout="horizontal"
          icon={SearchX}
          title="No encontramos este prode"
          description="El link puede estar incompleto o ese prode no existe en esta demo."
        >
          <EmptyStateButtonLink href={officialMeta ? "/prodes" : "/"}>
            {officialMeta ? "Ver prodes" : "Ir al inicio"}
          </EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  const visibilityLabel = prode.visibility === "public" ? "Público" : "Privado";

  return (
    <div className="pb-2">
      <Link
        href={isOfficial ? "/prodes" : "/"}
        className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {isOfficial ? "Prodes" : "Inicio"}
      </Link>

      <header className={pageHeader}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={pageEyebrow}>
              {isOfficial ? "Prode oficial" : "Prode"}
            </p>
            <h1 className={cn(pageTitle, "mt-0.5")}>{prode.name}</h1>
          </div>
          <span className="shrink-0 rounded-md border border-app-border bg-app-bg px-1.5 py-0.5 text-[10px] font-semibold text-app-muted">
            {isOfficial ? "Oficial" : visibilityLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-app-muted">
          <span className="inline-flex items-center gap-0.5 font-medium text-app-text">
            <Users className="h-3 w-3 opacity-80" strokeWidth={2} aria-hidden />
            {participantCount} participantes
          </span>
          <span className="text-app-border">·</span>
          <span>
            Marcadores:{" "}
            <span className="font-semibold tabular-nums text-app-text">
              {prode.matchIds.length - pendingCount}/{prode.matchIds.length}
            </span>
          </span>
          {userRank !== null ? (
            <>
              <span className="text-app-border">·</span>
              <span className="inline-flex items-center gap-0.5 text-app-sport">
                <Trophy className="h-3 w-3" strokeWidth={2} aria-hidden />
                Tu puesto: #{userRank}
              </span>
            </>
          ) : null}
        </div>
      </header>

      {isOfficial ? null : (
        <ProdeInviteShare
          className="mt-2"
          prodeName={prode.name}
          inviteCode={prode.inviteCode}
          prodeUrl={shareUrl || `/prodes/${encodeURIComponent(prode.id)}`}
        />
      )}

      {isOfficial ? null : (
        <div className="mt-2">
          <button
            type="button"
            disabled
            className="inline-flex h-9 w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg border border-dashed border-app-border bg-app-bg/60 text-[12px] font-semibold text-app-muted opacity-80"
            title="Próximamente"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Ajustes del prode
          </button>
        </div>
      )}

      <section className="mt-3 space-y-1.5">
        <SectionHeader title="Competencia" />
        {tournamentLabels.length === 0 ? (
          <p className="text-[11px] text-app-muted">Sin datos de torneo.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tournamentLabels.map((t) => (
              <span
                key={t.id}
                className="inline-flex max-w-full truncate rounded-full border border-app-border bg-app-surface px-2 py-0.5 text-[10px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              >
                {t.shortName}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-3">
        <SectionHeader title="Tu rendimiento" />
        <div className="mt-1 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-app-border bg-app-border-subtle shadow-[0_1px_0_rgba(15,23,42,0.04)] sm:grid-cols-4">
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Pts</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-app-text">
              {breakdown.points}
            </p>
          </div>
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Plenos</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-app-sport">
              {breakdown.exactScores}
            </p>
          </div>
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Sin pleno</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-app-text">
              {breakdown.partialHits}
            </p>
          </div>
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Pronósticos</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-app-text">
              {breakdown.predictionsOnScored}
            </p>
            <p className="mt-0.5 text-[8px] leading-tight text-app-muted">
              sobre partidos jugados
            </p>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-app-muted">
          3 pts marcador exacto · 1 pt si acertás ganador o empate (sin pleno) ·
          solo partidos con resultado cargado.
        </p>
      </section>

      <section className="mt-3 space-y-1.5">
        <SectionHeader
          title="Ranking del prode"
          action={
            <Link href="/ranking" className="font-semibold hover:underline">
              Global
            </Link>
          }
        />
        {rankingPreview.length > 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <ul className="divide-y divide-app-border-subtle">
              {rankingPreview.map((row) => {
                const isSelf = row.playerId === user.id;
                return (
                  <li
                    key={row.playerId}
                    className={cn(
                      "px-2.5 py-2",
                      isSelf &&
                        "bg-blue-50/90 ring-1 ring-app-primary/15",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-6 shrink-0 text-center text-[11px] font-bold tabular-nums text-app-muted">
                        {row.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-[12px] font-semibold leading-tight",
                              isSelf ? "text-app-primary" : "text-app-text",
                            )}
                          >
                            {row.displayName}
                            {isSelf ? (
                              <span className="ml-1 text-[10px] font-normal text-app-muted">
                                (vos)
                              </span>
                            ) : null}
                          </span>
                          <RankingDeltaBadge row={row} />
                        </div>
                        <RankingStatsLine row={row} />
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-bold tabular-nums text-app-text">
                          {row.points}
                        </p>
                        <p className="text-[9px] font-medium text-app-muted">
                          pts
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-app-border-subtle px-2.5 py-1.5 text-[9px] text-app-muted">
              Demo: mismos partidos del prode · flechas vs. última visita
            </p>
          </div>
        ) : (
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={Trophy}
            title="Todavía no hay tabla en este prode"
            description="Cuando haya partidos finalizados y pronósticos con marcador, se ordenan los puntos."
          />
        )}
      </section>

      {activityLines.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader title="Actividad reciente" />
          <ul className="space-y-1.5">
            {activityLines.map((a) => (
              <li
                key={a.id}
                className="rounded-[10px] border border-app-border bg-app-bg/60 px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold leading-snug text-app-text">
                    {a.title}
                  </p>
                  <span className="shrink-0 text-[9px] text-app-muted">
                    {a.timeLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-app-muted">
                  {a.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-3 space-y-1.5">
        <SectionHeader title="Partidos y pronósticos" />
        {matches.length === 0 ? (
          <EmptyState
            variant="soft"
            layout="horizontal"
            icon={CalendarOff}
            title="No hay partidos para mostrar"
            description="El fixture no está disponible o se perdió el vínculo con el catálogo en esta demo."
          />
        ) : (
          <ul className="space-y-1.5">
          {matches.map((match) => {
            const key = predictionStorageKey(user.id, prode.id, match.id);
            const stored = state.predictionMap[key];
            const finalResult = getMockResultForMatch(match.id);
            const pointsEarned =
              stored && finalResult ?
                pointsForPrediction(stored, finalResult)
              : null;
            const locked = !!finalResult;

            return (
              <li key={match.id}>
                <div className="relative">
                  {locked ? (
                    <span className="absolute right-2 top-2 z-[1] inline-flex items-center gap-0.5 rounded-md bg-app-bg/90 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-app-muted ring-1 ring-app-border">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                      Cerrado
                    </span>
                  ) : null}
                  <MatchCard
                    match={match}
                    initialScore={stored ?? null}
                    finalResult={finalResult ?? null}
                    pointsEarned={pointsEarned}
                    predictionLocked={locked}
                    onPredictionCommit={
                      locked ? undefined : (score) =>
                        setPrediction(prode.id, match.id, score)
                    }
                  />
                </div>
              </li>
            );
          })}
          </ul>
        )}
      </section>
    </div>
  );
}
