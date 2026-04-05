"use client";

import {
  ArrowLeft,
  CalendarOff,
  ChevronRight,
  Cloud,
  Lock,
  Settings,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Match, ScorePrediction } from "@/domain";
import { MatchCard } from "@/components/matches/MatchCard";
import { EmptyState, EmptyStateButtonLink } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  fetchProdeApi,
  fetchProdePlayedPredictionsForUser,
  postJoinProde,
  postProdePredictions,
  type PlayedPredictionPublic,
} from "@/lib/api/prodes-fetch";
import { prodeEntryLabel } from "@/lib/prode-entry-label";
import { reportClientError } from "@/lib/observability/client-error";
import { clientCanEditPredictions } from "@/lib/prode-prediction-window";
import { isPredictionDeadlineOpen } from "@/lib/datetime";
import { pointsForPrediction } from "@/lib/scoring";
import { pageEyebrow, pageHeader, pageTitle, statLabel } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

import { ProdeInviteShare } from "./ProdeInviteShare";

type ApiProde = {
  id: string;
  slug: string;
  ownerId: string | null;
  title: string;
  type?: string;
  status: string;
  visibility: string;
  closesAt: string;
  inviteCode: string | null;
  entryFeeArs?: number;
  prizeFirstArs?: number | null;
  prizeSecondArs?: number | null;
  prizeThirdArs?: number | null;
};

type ApiMatchRow = {
  id: string;
  tournamentId: string;
  matchdayId: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

type ApiRankingRow = {
  rank: number | null;
  points: number;
  plenos: number;
  signHits: number;
  user: { id: string; name: string | null; username: string | null };
};

function prodeRankingDisplayName(row: ApiRankingRow): string {
  return row.user.username ?
      `@${row.user.username}`
    : row.user.name ?? "Usuario";
}

function toDomainMatch(m: ApiMatchRow, label: string): Match {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    matchdayId: m.matchdayId,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    startsAt: m.startsAt,
    tournamentLabel: label,
  };
}

function computeBreakdown(
  matches: ApiMatchRow[],
  preds: Record<string, ScorePrediction | undefined>,
) {
  let points = 0;
  let exactScores = 0;
  let signHits = 0;
  let predictionsOnScored = 0;
  for (const m of matches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const pred = preds[m.id];
    if (!pred) continue;
    predictionsOnScored += 1;
    const p = pointsForPrediction(pred, { home: m.homeScore, away: m.awayScore });
    points += p;
    if (p === 3) exactScores += 1;
    else if (p === 1) signHits += 1;
  }
  return { points, exactScores, signHits, predictionsOnScored };
}

type Props = { prodeId: string };

/** Server-backed prode (Postgres + API). */
export function ProdesDetailServerView({ prodeId }: Props) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id ?? "";

  const [loadError, setLoadError] = useState<string | null>(null);
  const [prode, setProde] = useState<ApiProde | null>(null);
  const [matches, setMatches] = useState<ApiMatchRow[]>([]);
  const [predMap, setPredMap] = useState<Record<string, ScorePrediction>>({});
  const [ranking, setRanking] = useState<ApiRankingRow[]>([]);
  const [shareUrl, setShareUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteNudge, setInviteNudge] = useState(false);
  const [pickerUser, setPickerUser] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [playedRows, setPlayedRows] = useState<PlayedPredictionPublic[] | null>(
    null,
  );
  const [playedLoading, setPlayedLoading] = useState(false);
  const [playedError, setPlayedError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    setFeedback(null);
    try {
      const [detail, mRes, rRes] = await Promise.all([
        fetchProdeApi<{ prode: ApiProde }>(
          `/api/prodes/${encodeURIComponent(prodeId)}`,
        ),
        fetchProdeApi<{ matches: ApiMatchRow[] }>(
          `/api/prodes/${encodeURIComponent(prodeId)}/matches`,
        ),
        fetchProdeApi<{
          ranking: ApiRankingRow[];
          rankingLocked?: boolean;
        }>(`/api/prodes/${encodeURIComponent(prodeId)}/ranking`),
      ]);
      setProde(detail.prode);
      setMatches(mRes.matches);
      setRanking(rRes.ranking ?? []);
      setPredMap({});

      try {
        const pRes = await fetchProdeApi<{
          predictions: {
            matchId: string;
            home: number;
            away: number;
            savedAt: string;
          }[];
        }>(`/api/prodes/${encodeURIComponent(prodeId)}/predictions`);
        const next: Record<string, ScorePrediction> = {};
        for (const p of pRes.predictions) {
          next[p.matchId] = {
            home: p.home,
            away: p.away,
            savedAt: p.savedAt,
          };
        }
        setPredMap(next);
      } catch {
        setPredMap({});
        setFeedback(
          "No se pudieron cargar tus pronósticos guardados. Reintentá o actualizá la página.",
        );
      }
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "No se pudo cargar el prode.",
      );
    }
  }, [prodeId]);

  useEffect(() => {
    if (!pickerUser || !prode) {
      setPlayedRows(null);
      setPlayedLoading(false);
      setPlayedError(null);
      return;
    }
    let cancelled = false;
    setPlayedLoading(true);
    setPlayedError(null);
    setPlayedRows(null);
    void fetchProdePlayedPredictionsForUser(prode.id, pickerUser.id)
      .then((res) => {
        if (!cancelled) setPlayedRows(res.predictions);
      })
      .catch((e) => {
        if (!cancelled) {
          setPlayedError(
            e instanceof Error ? e.message : "No se pudieron cargar los pronósticos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPlayedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickerUser, prode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await postJoinProde(prodeId).catch(() => {});
        if (cancelled) return;
        await reload();
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "No se pudo cargar el prode.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prodeId, reload]);

  useEffect(() => {
    queueMicrotask(() => {
      setShareUrl(
        `${typeof window !== "undefined" ? window.location.origin : ""}/prodes/${encodeURIComponent(prodeId)}`,
      );
    });
  }, [prodeId]);

  /** Marcadores y ranking desde servidor: poll solo con la pestaña visible. */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void reload();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [reload]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [reload]);

  const globalOpen = prode ?
    clientCanEditPredictions({
      status: prode.status,
      closesAt: prode.closesAt,
    })
  : false;

  const tournamentLabel = prode?.title ?? "Prode";

  const domainMatches = useMemo(
    () => matches.map((m) => toDomainMatch(m, tournamentLabel)),
    [matches, tournamentLabel],
  );

  const matchById = useMemo(
    () => new Map(matches.map((m) => [m.id, m])),
    [matches],
  );

  const breakdown = useMemo(
    () => computeBreakdown(matches, predMap),
    [matches, predMap],
  );

  const pendingCount = useMemo(() => {
    if (matches.length === 0) return 0;
    let n = 0;
    for (const m of matches) {
      if (!predMap[m.id]) n += 1;
    }
    return n;
  }, [matches, predMap]);

  const rankingTop5 = useMemo(() => ranking.slice(0, 5), [ranking]);

  const userRankingRow = useMemo(
    () => ranking.find((r) => r.user.id === userId),
    [ranking, userId],
  );

  const userInTop5 = useMemo(
    () => rankingTop5.some((r) => r.user.id === userId),
    [rankingTop5, userId],
  );

  const userRank = userRankingRow?.rank ?? null;

  const handleCommit = useCallback(
    async (matchId: string, score: ScorePrediction) => {
      if (!prode) return;
      setSaving(true);
      setFeedback(null);
      try {
        await postProdePredictions(prode.id, [
          {
            matchId,
            predictedHomeScore: score.home,
            predictedAwayScore: score.away,
          },
        ]);
        const savedAt = new Date().toISOString();
        setPredMap((prev) => ({
          ...prev,
          [matchId]: { ...score, savedAt },
        }));
        setFeedback("Guardado en tu cuenta");
        setInviteNudge(true);
        window.setTimeout(() => setFeedback(null), 2200);
        void fetchProdeApi<{
          ranking: ApiRankingRow[];
          rankingLocked?: boolean;
        }>(`/api/prodes/${encodeURIComponent(prode.id)}/ranking`).then((r) => {
          setRanking(r.ranking ?? []);
        });
      } catch (e) {
        reportClientError(e, { area: "prode.predictions.save" });
        setFeedback(
          e instanceof Error ? e.message : "No se pudo guardar. Reintentá.",
        );
      } finally {
        setSaving(false);
      }
    },
    [prode],
  );

  if (sessionStatus === "loading") {
    return (
      <p className="py-10 text-center text-[13px] text-app-muted">Cargando…</p>
    );
  }

  if (sessionStatus === "unauthenticated") {
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
          title="Iniciá sesión"
          description="Para participar y guardar pronósticos en este prode necesitás una cuenta."
        >
          <EmptyStateButtonLink href="/login">Iniciar sesión</EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  if (loadError || !prode) {
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
          title="No encontramos este prode"
          description={loadError ?? "Probá de nuevo más tarde."}
        >
          <EmptyStateButtonLink href="/">Ir al inicio</EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  const visibilityLabel = prode.visibility === "PUBLIC" ? "Público" : "Privado";
  const participacionLabel = prodeEntryLabel({
    entryFeeArs: prode.entryFeeArs ?? 0,
    prizeFirstArs: prode.prizeFirstArs,
    prizeSecondArs: prode.prizeSecondArs,
    prizeThirdArs: prode.prizeThirdArs,
  });

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
            <h1 className={cn(pageTitle, "mt-0.5")}>{prode.title}</h1>
          </div>
          <span className="shrink-0 rounded-md border border-app-border bg-app-bg px-1.5 py-0.5 text-[10px] font-semibold text-app-muted">
            {visibilityLabel}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-app-muted">
          <span className="rounded-md bg-app-bg px-1.5 py-0.5 font-semibold text-app-text ring-1 ring-app-border-subtle">
            {participacionLabel}
          </span>
          <span title="Cuántos partidos tenés pronosticados sobre el total del prode">
            Pronósticos:{" "}
            <span className="font-semibold tabular-nums text-app-text">
              {matches.length - pendingCount}/{matches.length}
            </span>
          </span>
          {userRank !== null ?
            <>
              <span className="text-app-border">·</span>
              <span className="text-app-text">
                Posición:{" "}
                <span className="font-semibold tabular-nums">{userRank}</span>
              </span>
            </>
          : null}
        </div>
      </header>

      <ProdeInviteShare
        className="mt-2"
        prodeName={prode.title}
        inviteCode={prode.inviteCode ?? ""}
        prodeUrl={shareUrl || `/prodes/${encodeURIComponent(prode.id)}`}
      />

      {prode.ownerId === userId ?
        <div className="mt-2">
          <Link
            href={`/prodes/${encodeURIComponent(prode.id)}/ajustes`}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-app-border bg-app-surface text-[12px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-app-bg active:scale-[0.99]"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Ajustes del prode
          </Link>
        </div>
      : null}

      <section className="mt-3 space-y-1.5">
        <SectionHeader title="Torneos en este prode" />
        <div className="flex flex-wrap gap-1">
          {matches[0]?.tournamentId ?
            <Link
              href={`/torneos/${encodeURIComponent(matches[0].tournamentId)}`}
              className="inline-flex max-w-full truncate rounded-full border border-app-border bg-app-surface px-2 py-0.5 text-[10px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:border-app-muted"
            >
              {tournamentLabel}
            </Link>
          : (
            <span className="text-[11px] text-app-muted">{tournamentLabel}</span>
          )}
        </div>
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
            <ul className="space-y-0.5 text-[10px] leading-snug text-app-muted">
              <li>
                <span className="font-semibold text-app-text">Pleno:</span> 3 pts
              </li>
              <li>
                <span className="font-semibold text-app-text">Signo:</span> 1 pt
              </li>
              <li>
                <span className="font-semibold text-app-text">Error:</span> 0 pts
              </li>
            </ul>
          </div>
        </details>

        <div>
          <SectionHeader title="Ranking" />
          <p className="mt-0.5 text-[10px] leading-snug text-app-muted">
            Tocá un nombre para ver sus pronósticos en partidos ya jugados.
          </p>
        </div>
        {ranking.length > 0 ?
          <div className="space-y-2">
            <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              <p className="border-b border-app-border-subtle px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                Primeros 5
              </p>
              <ul className="divide-y divide-app-border-subtle">
                {rankingTop5.map((row) => {
                  const isSelf = row.user.id === userId;
                  const label = prodeRankingDisplayName(row);
                  return (
                    <li
                      key={row.user.id}
                      className={cn(
                        "grid grid-cols-[2rem_1fr_auto_auto] items-center gap-1.5 px-2.5 py-2",
                        isSelf &&
                          "bg-blue-50/90 ring-1 ring-inset ring-app-primary/12",
                      )}
                    >
                      <span className="text-center text-[12px] font-bold tabular-nums text-app-muted">
                        {row.rank ?? "—"}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          "min-w-0 truncate text-left text-[12px] font-semibold leading-tight underline decoration-app-primary/35 decoration-1 underline-offset-2 hover:decoration-app-primary",
                          isSelf ? "text-app-primary" : "text-app-text",
                        )}
                        onClick={() =>
                          setPickerUser({ id: row.user.id, label })
                        }
                      >
                        {label}
                        {isSelf ?
                          <span className="ml-1 text-[10px] font-normal text-app-muted no-underline">
                            (vos)
                          </span>
                        : null}
                      </button>
                      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-app-muted">
                        {row.plenos} pl.
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
              {userRankingRow && !userInTop5 ?
                <div className="border-t border-app-border-subtle bg-gradient-to-r from-blue-50/80 to-app-surface px-2.5 py-2.5">
                  <button
                    type="button"
                    className="w-full text-left text-[11px] font-semibold leading-snug text-app-text underline decoration-app-primary/35 decoration-1 underline-offset-2 hover:decoration-app-primary"
                    onClick={() =>
                      setPickerUser({
                        id: userRankingRow.user.id,
                        label: prodeRankingDisplayName(userRankingRow),
                      })
                    }
                  >
                    <span className="text-app-muted">Tu posición:</span>{" "}
                    <span className="tabular-nums text-app-primary">
                      #{userRankingRow.rank ?? "—"}
                    </span>
                    <span className="text-app-border"> — </span>
                    <span className="tabular-nums">
                      {userRankingRow.points} pts
                    </span>
                    <span className="mt-0.5 block text-[9px] font-normal text-app-muted">
                      Ver tus pronósticos en jugados
                    </span>
                  </button>
                </div>
              : null}
            </div>

            {ranking.length > 5 ?
              <details className="group rounded-[10px] border border-app-border-subtle bg-app-bg/70">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-left [&::-webkit-details-marker]:hidden">
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-app-muted transition-transform duration-200 group-open:rotate-90"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-[11px] font-semibold leading-tight text-app-text">
                    Ver tabla completa ({ranking.length})
                  </span>
                </summary>
                <ul className="max-h-[min(60vh,28rem)] divide-y divide-app-border-subtle overflow-y-auto border-t border-app-border-subtle">
                  {ranking.map((row) => {
                    const isSelf = row.user.id === userId;
                    const label = prodeRankingDisplayName(row);
                    return (
                      <li
                        key={row.user.id}
                        className={cn(
                          "grid grid-cols-[2rem_1fr_auto_auto] items-center gap-1.5 px-2.5 py-2",
                          isSelf &&
                            "bg-blue-50/90 ring-1 ring-inset ring-app-primary/12",
                        )}
                      >
                        <span className="text-center text-[12px] font-bold tabular-nums text-app-muted">
                          {row.rank ?? "—"}
                        </span>
                        <button
                          type="button"
                          className={cn(
                            "min-w-0 truncate text-left text-[12px] font-semibold leading-tight underline decoration-app-primary/35 decoration-1 underline-offset-2 hover:decoration-app-primary",
                            isSelf ? "text-app-primary" : "text-app-text",
                          )}
                          onClick={() =>
                            setPickerUser({ id: row.user.id, label })
                          }
                        >
                          {label}
                          {isSelf ?
                            <span className="ml-1 text-[10px] font-normal text-app-muted no-underline">
                              (vos)
                            </span>
                          : null}
                        </button>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-app-muted">
                          {row.plenos} pl.
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
              </details>
            : null}
          </div>
        : (
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={Trophy}
            title="Todavía no hay tabla"
            description="Cuando haya participantes y puntos calculados, o después de cargar resultados y recalcular, verás el ranking acá."
          />
        )}

        {pickerUser ?
          <div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-3 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prode-pred-picker-title"
            onClick={() => setPickerUser(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPickerUser(null);
            }}
          >
            <div
              className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2 border-b border-app-border-subtle px-3 py-2.5">
                <div className="min-w-0">
                  <h2
                    id="prode-pred-picker-title"
                    className="text-[14px] font-bold leading-tight text-app-text"
                  >
                    Pronósticos jugados
                  </h2>
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-app-primary">
                    {pickerUser.label}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-app-muted">
                    Solo partidos con resultado oficial cargado.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-app-muted hover:bg-app-bg hover:text-app-text"
                  onClick={() => setPickerUser(null)}
                >
                  Cerrar
                </button>
              </div>
              <div className="max-h-[min(65vh,24rem)] overflow-y-auto px-3 py-2">
                {playedLoading ?
                  <p className="py-6 text-center text-[12px] text-app-muted">
                    Cargando…
                  </p>
                : playedError ?
                  <p className="py-4 text-[12px] text-red-700">{playedError}</p>
                : playedRows && playedRows.length === 0 ?
                  <p className="py-6 text-center text-[12px] text-app-muted">
                    Todavía no hay partidos jugados con pronóstico para mostrar.
                  </p>
                : (
                  <ul className="space-y-2.5 pb-2">
                    {playedRows?.map((p) => (
                      <li
                        key={p.matchId}
                        className="rounded-lg border border-app-border-subtle bg-app-bg/60 px-2.5 py-2"
                      >
                        <p className="text-[11px] font-semibold leading-snug text-app-text">
                          {p.homeTeamName}{" "}
                          <span className="font-normal text-app-muted">vs</span>{" "}
                          {p.awayTeamName}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px]">
                          <span className="text-app-muted">Pronóstico:</span>
                          <span className="font-bold tabular-nums text-app-text">
                            {p.predictedHome} – {p.predictedAway}
                          </span>
                          <span className="text-app-muted">Resultado:</span>
                          <span className="font-bold tabular-nums text-app-sport">
                            {p.officialHome} – {p.officialAway}
                          </span>
                          <span className="rounded bg-app-surface px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-app-text ring-1 ring-app-border">
                            +{p.pointsEarned} pts
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        : null}
      </section>

      <section className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionHeader title="Partidos y pronósticos" className="min-w-0 flex-1" />
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <p className="flex items-center justify-end gap-1 text-[9px] font-medium leading-tight text-app-muted">
              <Cloud className="h-3 w-3" strokeWidth={2} aria-hidden />
              Guardado en la nube
            </p>
            {feedback ?
              <p
                className={cn(
                  "text-[10px] font-semibold",
                  feedback.startsWith("Guardado") ?
                    "text-emerald-700"
                  : "text-red-700",
                )}
              >
                {feedback}
              </p>
            : null}
            {saving ?
              <p className="text-[10px] text-app-muted">Guardando…</p>
            : null}
          </div>
        </div>
        {inviteNudge ?
          <Link
            href="/invitar"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-app-primary/40 bg-app-primary/5 px-3 py-2 text-center text-[11px] font-semibold text-app-primary"
          >
            Invitá amigos y sumá progreso hacia entrada gratis
          </Link>
        : null}
        {!globalOpen && domainMatches.length > 0 ?
          <p className="text-[10px] leading-snug text-app-muted">
            El plazo de pronósticos del prode cerró: solo lectura.
          </p>
        : null}
        {domainMatches.length === 0 ?
          <EmptyState
            variant="soft"
            layout="horizontal"
            icon={CalendarOff}
            title="No hay partidos para mostrar"
            description="El fixture no está disponible."
          />
        : (
          <ul className="space-y-1.5">
            {domainMatches.map((match) => {
              const raw = matchById.get(match.id);
              if (!raw) return null;
              const stored = predMap[match.id];
              const finalResult =
                raw.homeScore != null && raw.awayScore != null ?
                  { home: raw.homeScore, away: raw.awayScore }
                : null;
              const pointsEarned =
                stored && finalResult ?
                  pointsForPrediction(stored, finalResult)
                : null;
              const beforeKickoff = isPredictionDeadlineOpen(match.startsAt);
              const locked =
                !globalOpen || !!finalResult || !beforeKickoff;
              const badgeLabel =
                !globalOpen || finalResult ? "Cerrado"
                : !beforeKickoff ? "Plazo vencido"
                : "Cerrado";

              return (
                <li key={match.id}>
                  <div className="relative">
                    {locked ?
                      <span className="absolute right-2 top-2 z-[1] inline-flex items-center gap-0.5 rounded-md bg-app-bg/90 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-app-muted ring-1 ring-app-border">
                        <Lock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                        {badgeLabel}
                      </span>
                    : null}
                    <MatchCard
                      match={match}
                      initialScore={stored ?? null}
                      finalResult={finalResult}
                      pointsEarned={pointsEarned}
                      predictionLocked={locked}
                      onPredictionCommit={
                        locked ? undefined : (score) => void handleCommit(match.id, score)
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
