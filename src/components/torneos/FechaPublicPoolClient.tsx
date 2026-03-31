"use client";

import {
  ArrowLeft,
  Award,
  Clock,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { Match } from "@/domain";
import { MatchCard } from "@/components/matches/MatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatMatchKickoffFull,
  formatTimeUntilFuture,
} from "@/lib/datetime";
import { getPublicPoolForMatchday } from "@/mocks/catalog/primera-catalog";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { pointsForPrediction } from "@/lib/scoring";
import {
  btnPrimaryFull,
  cardSurface,
  pageEyebrow,
  statLabel,
} from "@/lib/ui-styles";
import {
  buildPublicPoolRankingEntries,
  getPredictionsForPublicPool,
  predictionStorageKey,
} from "@/state/selectors";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

type FechaPublicPoolClientProps = {
  tournamentId: string;
  fechaId: string;
};

function formatArs(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function PayoutBars({
  percents,
  topN,
}: {
  percents: readonly number[];
  topN: number;
}) {
  const max = Math.max(...percents.slice(0, topN), 1);
  return (
    <div className="space-y-2">
      <p className={statLabel}>Distribución entre los mejores</p>
      <ul className="space-y-1.5">
        {percents.slice(0, topN).map((pct, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-7 shrink-0 text-[11px] font-bold tabular-nums text-app-muted">
              {i + 1}°
            </span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/90">
              <div
                className="h-full rounded-full bg-slate-700/90"
                style={{ width: `${(pct / max) * 100}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-app-text">
              {pct}%
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] leading-snug text-app-muted">
        Competencia por pronósticos; sin cuotas ni probabilidades fijas.
      </p>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "upcoming" | "open" | "closed" | "completed";
}) {
  const config = {
    upcoming: {
      label: "Próxima",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    },
    open: {
      label: "Predicciones abiertas",
      className: "border-emerald-200/90 bg-emerald-50/95 text-emerald-950",
    },
    closed: {
      label: "Cierre de pronósticos",
      className: "border-amber-200/90 bg-amber-50/95 text-amber-950",
    },
    completed: {
      label: "Fecha disputada",
      className: "border-slate-200 bg-slate-100/90 text-slate-800",
    },
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

export function FechaPublicPoolClient({
  tournamentId,
  fechaId,
}: FechaPublicPoolClientProps) {
  const { user, state, joinPublicPool, setPublicPoolPrediction } = useAppState();

  const cat = useMemo(
    () => getTournamentCatalogueEntryById(tournamentId),
    [tournamentId],
  );

  const matchday = useMemo(
    () => cat?.matchdays.find((m) => m.id === fechaId),
    [cat, fechaId],
  );

  const pool = useMemo(
    () => getPublicPoolForMatchday(tournamentId, fechaId),
    [tournamentId, fechaId],
  );

  const matches = useMemo((): Match[] => {
    if (!cat) return [];
    return cat.matches.filter((m) => m.matchdayId === fechaId);
  }, [cat, fechaId]);

  const joined = pool ? state.joinedPublicPoolIds.includes(pool.id) : false;

  const userPreds = useMemo(() => {
    if (!pool) return {};
    return getPredictionsForPublicPool(
      user.id,
      pool.id,
      state.publicPoolPredictionMap,
    );
  }, [pool, user.id, state.publicPoolPredictionMap]);

  const rankingPreview = useMemo(() => {
    if (!pool) return [];
    return buildPublicPoolRankingEntries(
      pool.id,
      user.id,
      user.displayName,
      state,
    ).slice(0, 5);
  }, [pool, user.id, user.displayName, state]);

  const pendingCount = useMemo(() => {
    if (!pool) return 0;
    let n = 0;
    for (const m of matches) {
      const key = predictionStorageKey(user.id, pool.id, m.id);
      if (!state.publicPoolPredictionMap[key]) n += 1;
    }
    return n;
  }, [pool, matches, user.id, state.publicPoolPredictionMap]);

  const totalMatches = matches.length;
  const progressPct =
    totalMatches > 0 ?
      Math.round(((totalMatches - pendingCount) / totalMatches) * 100)
    : 0;

  const meRank = useMemo(() => {
    if (!pool) return null;
    const rows = buildPublicPoolRankingEntries(
      pool.id,
      user.id,
      user.displayName,
      state,
    );
    return rows.find((r) => r.playerId === user.id) ?? null;
  }, [pool, user.id, user.displayName, state]);

  if (!cat || !matchday || !pool) {
    return (
      <div className="pb-4">
        <Link
          href="/torneos"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Torneos
        </Link>
        <EmptyState
          className="mt-4"
          variant="soft"
          title="No encontramos esta fecha"
          description="Verificá el enlace o elegí otra fecha desde el torneo."
        />
      </div>
    );
  }

  const paid = pool.type === "public_paid";
  const poolAcceptsEntries = pool.status === "open";
  const predictionsFrozen =
    !joined ||
    !poolAcceptsEntries ||
    matchday.status === "completed" ||
    matchday.status === "closed";

  return (
    <div className="relative pb-3">
      <Link
        href={`/torneos/${encodeURIComponent(tournamentId)}`}
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Volver a {cat.shortName}
      </Link>

      {/* Hero: identity + skill framing */}
      <header
        className={cn(
          "relative overflow-hidden rounded-[12px] border border-slate-200/90",
          "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800",
          "px-3.5 pb-3.5 pt-3.5 text-white shadow-[0_8px_30px_rgba(15,23,42,0.12)]",
        )}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/15 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-40 rounded-full bg-white/5 blur-xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/85">
                <Sparkles className="h-3 w-3 text-amber-200/90" strokeWidth={2} />
                Pool competitivo
              </span>
              <StatusPill status={matchday.status} />
            </p>
            <p className={cn(pageEyebrow, "mt-2 text-[10px] text-white/55")}>
              {cat.name}
            </p>
            <h1 className="mt-0.5 text-[22px] font-bold leading-[1.15] tracking-tight text-white">
              {matchday.name}
            </h1>
            <p className="mt-1.5 max-w-[20rem] text-[12px] leading-snug text-white/70">
              Pronosticá el marcador exacto de cada partido. 3 pts pleno · 1 pt
              resultado correcto.
            </p>
          </div>
        </div>

        {/* Prize + stats strip */}
        <div className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/55">
              {paid ? "Inscripción" : "Acceso"}
            </p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-white">
              {paid ? `$${formatArs(pool.entryFeeArs)}` : "Gratis"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/55">
              {paid ? "Premios acumulados" : "En juego"}
            </p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-amber-100">
              {paid ? `$${formatArs(pool.prizePoolArs)}` : "Ranking"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/55">
              Competidores
            </p>
            <p className="mt-0.5 flex items-baseline gap-1 text-[15px] font-bold tabular-nums text-white">
              <Users className="h-3.5 w-3.5 opacity-70" strokeWidth={2} />
              {pool.participantsCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-wide text-white/55">
              Tiempo
            </p>
            <p className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-tight text-white/95">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" strokeWidth={2} />
              {formatTimeUntilFuture(pool.closesAt)}
            </p>
          </div>
        </div>
      </header>

      {/* Conversion CTA — full width, above fold */}
      {!joined && poolAcceptsEntries ? (
        <div className="mt-3">
          <button
            type="button"
            className={cn(
              btnPrimaryFull(),
              "min-h-[48px] text-[14px] shadow-[0_4px_14px_rgba(37,99,235,0.35)]",
            )}
            onClick={() => joinPublicPool(pool.id)}
          >
            <Target className="h-4 w-4 shrink-0 opacity-95" strokeWidth={2} />
            Entrar al pool y cargar pronósticos
          </button>
          <p className="mt-2 text-center text-[10px] leading-snug text-app-muted">
            Unite para guardar marcadores y figurar en el ranking de esta fecha.
          </p>
        </div>
      ) : null}

      {!joined && !poolAcceptsEntries ? (
        <div className="mt-3 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 text-center">
          <p className="text-[12px] font-semibold text-app-text">
            {pool.status === "closed" ?
              "Las predicciones para este pool están cerradas."
            : "Este pool ya fue liquidado."}
          </p>
          <p className="mt-1 text-[10px] text-app-muted">
            Podés ver partidos y el ranking de referencia.
          </p>
        </div>
      ) : null}

      {joined && poolAcceptsEntries ? (
        <div
          className={cn(
            "mt-3 rounded-[10px] border border-app-primary/25 bg-blue-50/90 px-3 py-2.5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-app-text">
                {pendingCount === 0 ?
                  "Pronósticos completos"
                : `${totalMatches - pendingCount}/${totalMatches} partidos listos`}
              </p>
              <p className="mt-0.5 text-[10px] text-app-muted">
                {pendingCount === 0 ?
                  "Podés ajustar hasta el cierre."
                : "Completá el marcador exacto en cada partido."}
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-bold tabular-nums text-app-primary">
              {progressPct}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-app-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Payout + rules — light card, not “odds” */}
      <div className={cn("mt-3", cardSurface)}>
        {paid ? (
          <div className="border-b border-app-border-subtle px-3 py-3">
            <PayoutBars percents={pool.payoutPercents} topN={pool.payoutTopN} />
          </div>
        ) : (
          <div className="border-b border-app-border-subtle px-3 py-2.5">
            <p className="text-[11px] leading-snug text-app-muted">
              <span className="font-semibold text-app-text">Pool gratuito.</span>{" "}
              Competís por puntos y posición en el ranking de esta fecha.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 text-[10px] text-app-muted">
          <span className="inline-flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-app-muted" strokeWidth={2} />
            Top {pool.payoutTopN} {paid ? "al reparto" : "del ranking"}
          </span>
          <span className="text-app-border">·</span>
          <span>Cierre pronósticos: {formatMatchKickoffFull(pool.closesAt)}</span>
        </div>
      </div>

      {/* Matches */}
      <section className="mt-4 space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-bold leading-none tracking-tight text-app-text">
              Partidos de la fecha
            </h2>
            <p className="mt-1 text-[10px] font-medium text-app-muted">
              Marcador exacto · el veredicto se infiere solo
            </p>
          </div>
          {!joined ? (
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
              Vista previa
            </span>
          ) : null}
        </div>
        <ul className="space-y-2.5">
          {matches.map((m, idx) => {
            const res = getMockResultForMatch(m.id);
            const pred = userPreds[m.id];
            const locked = !!res || predictionsFrozen;
            let pts: 0 | 1 | 3 | null = null;
            if (res && pred) {
              pts = pointsForPrediction(pred, res);
            }
            return (
              <li key={m.id} className="relative">
                <div className="mb-1 flex items-center justify-between gap-2 pl-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-medium text-app-muted">
                      {formatMatchKickoffFull(m.startsAt)}
                    </span>
                  </span>
                </div>
                <MatchCard
                  match={m}
                  initialScore={pred ?? null}
                  finalResult={res ?? null}
                  pointsEarned={pts}
                  predictionLocked={locked}
                  hideTournamentLabel
                  compact
                  onPredictionCommit={
                    joined && !locked ?
                      (score) => setPublicPoolPrediction(pool.id, m.id, score)
                    : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Ranking */}
      {rankingPreview.length > 0 ? (
        <section className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-app-text">
              <Trophy className="h-4 w-4 text-amber-600" strokeWidth={2} />
              Ranking · esta fecha
            </h2>
            {meRank ? (
              <span className="text-[11px] font-semibold text-app-muted">
                Vos:{" "}
                <span className="font-bold text-app-text">{meRank.rank}°</span>{" "}
                · {meRank.points} pts
              </span>
            ) : null}
          </div>
          {!joined ? (
            <p className="text-[10px] leading-snug text-app-muted">
              Vista previa con datos demo. Entrá al pool para fijar tu lugar con
              tus pronósticos.
            </p>
          ) : null}
          <ul
            className={cn(
              "overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-card",
              !joined && "opacity-95",
            )}
          >
            {rankingPreview.map((r, i) => (
              <li
                key={r.playerId}
                className={cn(
                  "flex items-center justify-between gap-2 border-app-border-subtle px-2.5 py-2 text-[12px]",
                  i > 0 && "border-t",
                  r.playerId === user.id &&
                    "bg-gradient-to-r from-blue-50/95 to-transparent",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
                      r.rank === 1 && "bg-amber-100 text-amber-950",
                      r.rank === 2 && "bg-slate-200/90 text-slate-800",
                      r.rank === 3 && "bg-orange-100 text-orange-950",
                      r.rank > 3 && "bg-app-bg text-app-muted",
                    )}
                  >
                    {r.rank}
                  </span>
                  <span className="min-w-0 truncate font-semibold text-app-text">
                    {r.displayName}
                    {r.playerId === user.id ? (
                      <span className="ml-1 text-[10px] font-normal text-app-primary">
                        vos
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-bold tabular-nums text-app-text">
                    {r.points}
                  </span>
                  <span className="ml-0.5 text-[10px] font-medium text-app-muted">
                    pts
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/ranking"
            className="block text-center text-[11px] font-semibold text-app-primary hover:underline"
          >
            Ver ranking completo
          </Link>
        </section>
      ) : null}
    </div>
  );
}
