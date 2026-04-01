"use client";

import {
  ArrowLeft,
  CalendarOff,
  ChevronRight,
  Lock,
  SearchX,
  Settings,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Match } from "@/domain";
import { useCatalogueRevision } from "@/components/app/CatalogueRefreshContext";
import { MatchCard } from "@/components/matches/MatchCard";
import { EmptyState, EmptyStateButtonLink } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isAdminProdePredictionsLocked } from "@/lib/admin-prode-guard";
import { isPredictionDeadlineOpen } from "@/lib/datetime";
import { findCatalogueMatchById } from "@/lib/catalogue-matches";
import { pointsForPrediction } from "@/lib/scoring";
import { pageEyebrow, pageHeader, pageTitle, statLabel } from "@/lib/ui-styles";
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

import { persistScopeRanks } from "@/state/ranking-snapshot";

import { ProdeInviteShare } from "./ProdeInviteShare";

type ProdesDetailClientProps = {
  prodeId: string;
};

export function ProdesDetailClient({ prodeId }: ProdesDetailClientProps) {
  const { user, state, setPrediction, flushPersist } = useAppState();
  const catRev = useCatalogueRevision();
  const [shareUrl, setShareUrl] = useState("");
  /** Re-evalúa cierre por kickoff sin recargar la página. */
  const [kickoffClock, setKickoffClock] = useState(0);

  const prode = useMemo(
    () => state.prodes.find((p) => p.id === prodeId),
    [state.prodes, prodeId],
  );

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
    void catRev;
    if (!prode) {
      return {
        points: 0,
        exactScores: 0,
        signHits: 0,
        predictionsOnScored: 0,
        lastPredictionSavedAtMs: Number.MAX_SAFE_INTEGER,
      };
    }
    return computePointsBreakdownForProde(userPreds, prode.matchIds);
  }, [prode, userPreds, catRev]);

  const prodeRanking = useMemo(() => {
    void catRev;
    if (!prode) return [];
    return buildProdeRankingEntries(
      prode,
      user.id,
      user.displayName,
      state,
    );
  }, [prode, user.id, user.displayName, state, catRev]);

  const rankingTop10 = useMemo(
    () => prodeRanking.slice(0, 10),
    [prodeRanking],
  );

  const userRankingRow = useMemo(
    () => prodeRanking.find((r) => r.playerId === user.id),
    [prodeRanking, user.id],
  );

  const userInTop10 = useMemo(
    () => rankingTop10.some((r) => r.playerId === user.id),
    [rankingTop10, user.id],
  );

  const userRank = userRankingRow?.rank ?? null;

  const pendingCount = useMemo(() => {
    if (!prode) return 0;
    let n = 0;
    for (const mid of prode.matchIds) {
      const key = predictionStorageKey(user.id, prode.id, mid);
      if (!state.predictionMap[key]) n += 1;
    }
    return n;
  }, [prode, user.id, state.predictionMap]);

  useEffect(() => {
    if (!prode) return;
    queueMicrotask(() => {
      setShareUrl(
        `${window.location.origin}/prodes/${encodeURIComponent(prode.id)}`,
      );
    });
  }, [prode]);

  useEffect(() => {
    const id = window.setInterval(() => setKickoffClock((c) => c + 1), 20_000);
    return () => window.clearInterval(id);
  }, []);
  void kickoffClock;

  useEffect(() => {
    if (!prode || prodeRanking.length === 0) return;
    persistScopeRanks(`prode:${prode.id}`, prodeRanking);
  }, [prode, prodeRanking]);

  if (!prode) {
    return (
      <div className="pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Inicio
        </Link>
        <EmptyState
          className="mt-4"
          variant="soft"
          layout="horizontal"
          icon={SearchX}
          title="No encontramos este prode"
          description="El link puede estar incompleto o ese prode no existe en este dispositivo (demo local)."
        >
          <EmptyStateButtonLink href="/">Ir al inicio</EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  const visibilityLabel = prode.visibility === "public" ? "Público" : "Privado";

  return (
    <div className="pb-2">
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Inicio
      </Link>

      <header className={pageHeader}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={pageEyebrow}>Prode</p>
            <h1 className={cn(pageTitle, "mt-0.5")}>{prode.name}</h1>
          </div>
          <span className="shrink-0 rounded-md border border-app-border bg-app-bg px-1.5 py-0.5 text-[10px] font-semibold text-app-muted">
            {visibilityLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-app-muted">
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

      <ProdeInviteShare
        className="mt-2"
        prodeName={prode.name}
        inviteCode={prode.inviteCode}
        prodeUrl={shareUrl || `/prodes/${encodeURIComponent(prode.id)}`}
      />

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

      <section className="mt-3 space-y-1.5">
        <SectionHeader title="Torneos en este prode" />
        {tournamentLabels.length === 0 ? (
          <p className="text-[11px] text-app-muted">Sin torneos vinculados.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tournamentLabels.map((t) => (
              <Link
                key={t.id}
                href={`/torneos/${encodeURIComponent(t.id)}`}
                className="inline-flex max-w-full truncate rounded-full border border-app-border bg-app-surface px-2 py-0.5 text-[10px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:border-app-muted"
              >
                {t.shortName}
              </Link>
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
            <p className={statLabel}>Signo</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-app-text">
              {breakdown.signHits}
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
          Solo cuentan partidos ya jugados con resultado cargado.
        </p>
      </section>

      <section className="mt-3 space-y-1.5">
        <details className="group rounded-[10px] border border-app-border-subtle bg-app-bg/70">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-left [&::-webkit-details-marker]:hidden">
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-app-muted transition-transform duration-200 group-open:rotate-90"
              strokeWidth={2}
              aria-hidden
            />
            <span className="text-[11px] font-semibold leading-tight text-app-text">
              Cómo funciona
            </span>
          </summary>
          <div className="border-t border-app-border-subtle px-2.5 pb-2.5 pt-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-app-muted">
              Puntuación
            </p>
            <ul className="mt-1 space-y-0.5 text-[10px] leading-snug text-app-muted">
              <li>
                <span className="font-semibold text-app-text">Pleno:</span> 3 pts
              </li>
              <li>
                <span className="font-semibold text-app-text">
                  Acierto de signo:
                </span>{" "}
                1 pt
              </li>
              <li>
                <span className="font-semibold text-app-text">Error:</span> 0 pts
              </li>
            </ul>
            <p className="mt-2.5 text-[9px] font-bold uppercase tracking-wide text-app-muted">
              Desempate
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px] leading-snug text-app-muted">
              <li>Más plenos</li>
              <li>Más aciertos de signo</li>
              <li>Quien guardó antes</li>
            </ul>
          </div>
        </details>

        <div className="flex items-end justify-between gap-2">
          <div>
            <SectionHeader
              title="Ranking"
              action={
                <Link href="/ranking" className="font-semibold hover:underline">
                  Global
                </Link>
              }
            />
            <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
              Top 10
            </p>
          </div>
        </div>
        {rankingTop10.length > 0 ? (
          <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <ul className="divide-y divide-app-border-subtle">
              {rankingTop10.map((row) => {
                const isSelf = row.playerId === user.id;
                return (
                  <li
                    key={row.playerId}
                    className={cn(
                      "grid grid-cols-[2rem_1fr_auto_auto] items-center gap-1.5 px-2.5 py-2",
                      isSelf && "bg-blue-50/90 ring-1 ring-inset ring-app-primary/12",
                    )}
                  >
                    <span className="text-center text-[12px] font-bold tabular-nums text-app-muted">
                      {row.rank}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 truncate text-[12px] font-semibold leading-tight",
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
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-app-muted">
                      {row.exactScores} pl.
                    </span>
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] font-bold tabular-nums leading-none text-app-text">
                        {row.points}
                      </p>
                      <p className="text-[8px] font-medium uppercase text-app-muted">
                        pts
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {userRankingRow && !userInTop10 ?
              <div className="border-t border-app-border-subtle bg-gradient-to-r from-blue-50/80 to-app-surface px-2.5 py-2.5">
                <p className="text-[11px] font-semibold leading-snug text-app-text">
                  <span className="text-app-muted">Tu posición:</span>{" "}
                  <span className="tabular-nums text-app-primary">
                    #{userRankingRow.rank}
                  </span>
                  <span className="text-app-border"> — </span>
                  <span className="tabular-nums">{userRankingRow.points} pts</span>
                  <span className="block pt-0.5 text-[9px] font-normal text-app-muted">
                    {userRankingRow.exactScores} plenos
                  </span>
                </p>
              </div>
            : null}
          </div>
        ) : (
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={Trophy}
            title="Todavía no hay tabla en este prode"
            description="Cuando haya partidos con resultado y pronósticos, se ordenan los puntos."
          />
        )}
      </section>

      <section className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionHeader title="Partidos y pronósticos" className="min-w-0 flex-1" />
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="text-[9px] font-medium leading-tight text-app-muted">
              Se guardan solos en este dispositivo
            </p>
            <button
              type="button"
              className="rounded-lg border border-app-border bg-app-surface px-2.5 py-1 text-[10px] font-semibold text-app-text shadow-card transition hover:border-app-primary/40 active:scale-[0.98]"
              onClick={() => flushPersist()}
            >
              Guardar ahora
            </button>
          </div>
        </div>
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
            const beforeKickoff = isPredictionDeadlineOpen(match.startsAt);
            const adminLocked = isAdminProdePredictionsLocked(prode.id);
            const locked =
              adminLocked || !!finalResult || !beforeKickoff;
            const badgeLabel =
              finalResult || adminLocked ? "Cerrado" : "Plazo vencido";

            return (
              <li key={match.id}>
                <div className="relative">
                  {locked ? (
                    <span className="absolute right-2 top-2 z-[1] inline-flex items-center gap-0.5 rounded-md bg-app-bg/90 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-app-muted ring-1 ring-app-border">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                      {badgeLabel}
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
