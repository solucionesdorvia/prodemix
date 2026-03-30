"use client";

import {
  ArrowLeft,
  Calendar,
  CalendarOff,
  ChevronRight,
  History,
  MapPin,
  SearchX,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { TeamCrest } from "@/components/team/TeamCrest";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import { formatMatchKickoffFull } from "@/lib/datetime";
import { btnCompact, cardSurface, statLabel } from "@/lib/ui-styles";
import { getTournamentDetailById } from "@/mocks/services/tournament-detail.mock";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

import { accentByCategory, pillByCategory } from "./torneo-styles";

type TournamentDetailClientProps = {
  tournamentId: string;
};

export function TournamentDetailClient({
  tournamentId,
}: TournamentDetailClientProps) {
  const ingestionTick = useIngestionTick();
  const { state, toggleFollowTournament } = useAppState();
  const detail = useMemo(() => {
    void ingestionTick;
    return getTournamentDetailById(tournamentId);
  }, [tournamentId, ingestionTick]);

  const following = state.followedTournamentIds.includes(tournamentId);

  if (!detail) {
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
          layout="horizontal"
          icon={SearchX}
          title="No encontramos este torneo"
          description="El ID no coincide con la demo o el torneo fue quitado del catálogo."
        >
          <EmptyStateButtonLink href="/torneos">Ver todos los torneos</EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  const { browse, jornadaLabel, stats, nextMatches, recentResults, standingsPreview, featuredTeams, activityNotes } =
    detail;
  const teamsLine =
    browse.teamsCount > 0
      ? `${browse.teamsCount} equipos`
      : "Plantel en definición";

  return (
    <div className="pb-2">
      <Link
        href="/torneos"
        className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Torneos
      </Link>

      <article
        className={cn(
          "overflow-hidden border-l-[3px]",
          cardSurface,
          accentByCategory(browse.categoryId),
        )}
      >
        <div className="border-b border-app-border-subtle px-2.5 py-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                pillByCategory(browse.categoryId),
              )}
            >
              {browse.categoryLabel}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                browse.statusLabel === "Finalizado"
                  ? "bg-app-bg text-app-muted"
                  : "bg-app-bg text-app-text",
              )}
            >
              {browse.statusLabel}
            </span>
          </div>
          <h1 className="mt-1.5 text-[15px] font-semibold leading-tight tracking-tight text-app-text">
            {browse.name}
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-app-muted">
            {browse.subtitle}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-app-muted">
            <span className="inline-flex items-center gap-0.5 font-medium text-app-text/90">
              <MapPin className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} />
              {browse.region}
            </span>
            <span className="text-app-border">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Calendar className="h-3 w-3 opacity-70" strokeWidth={2} aria-hidden />
              <span className="font-medium text-app-sport">{jornadaLabel}</span>
            </span>
            <span className="text-app-border">·</span>
            <span className="tabular-nums">{teamsLine}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px border-b border-app-border-subtle bg-app-border-subtle">
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Partidos</p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-app-text">
              {stats.totalMatches}
            </p>
          </div>
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Jugados</p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-app-text">
              {stats.playedMatches}
            </p>
          </div>
          <div className="bg-app-surface px-1.5 py-2 text-center">
            <p className={statLabel}>Próximos</p>
            <p className="mt-0.5 text-[15px] font-bold tabular-nums text-app-text">
              {stats.upcomingMatches}
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-2.5">
          <button
            type="button"
            onClick={() => toggleFollowTournament(tournamentId)}
            className={cn(
              btnCompact(),
              "min-h-[40px] flex-1 border text-[12px]",
              following
                ? "border-app-primary bg-blue-50 text-app-primary"
                : "border-app-border bg-app-bg text-app-text shadow-sm",
            )}
          >
            {following ? "Siguiendo" : "Seguir"}
          </button>
          <Link
            href={`/crear?torneo=${encodeURIComponent(tournamentId)}`}
            className={cn(
              btnCompact(),
              "min-h-[40px] flex-[1.15] gap-0.5 bg-app-primary px-2 text-white shadow-sm hover:bg-blue-700",
            )}
          >
            Usar en prode
            <ChevronRight className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
          </Link>
        </div>
      </article>

      {nextMatches.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader title="Próximos partidos" />
          <ul className="space-y-1.5">
            {nextMatches.map((m) => (
              <li
                key={m.id}
                className="rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
              >
                <p className="text-[10px] font-medium text-app-muted">
                  {formatMatchKickoffFull(m.startsAt)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold leading-snug text-app-text">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <TeamCrest teamName={m.homeTeam} size={26} />
                    <span className="truncate">{m.homeTeam}</span>
                  </span>
                  <span className="font-normal text-app-muted">vs</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{m.awayTeam}</span>
                    <TeamCrest teamName={m.awayTeam} size={26} />
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-3 space-y-1.5">
          <SectionHeader title="Próximos partidos" />
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={CalendarOff}
            title="Sin partidos próximos"
            description="En esta demo no quedan fechas pendientes o la competición ya cerró la fase regular."
          />
        </section>
      )}

      {recentResults.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader title="Últimos resultados" />
          <ul className="space-y-1.5">
            {recentResults.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold leading-snug text-app-text">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <TeamCrest teamName={r.homeTeam} size={26} />
                      <span className="truncate">{r.homeTeam}</span>
                    </span>
                    <span className="font-normal text-app-muted">vs</span>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{r.awayTeam}</span>
                      <TeamCrest teamName={r.awayTeam} size={26} />
                    </span>
                  </p>
                </div>
                <p className="shrink-0 text-[13px] font-bold tabular-nums text-app-text">
                  {r.homeGoals}-{r.awayGoals}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-3 space-y-1.5">
          <SectionHeader title="Últimos resultados" />
          <EmptyState
            variant="minimal"
            layout="horizontal"
            icon={History}
            title="Sin resultados recientes"
            description="Cuando el fixture tenga partidos jugados en esta demo, los vas a ver acá."
          />
        </section>
      )}

      {standingsPreview.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader
            title="Tabla"
            action={<span className="text-app-muted">Top {standingsPreview.length}</span>}
          />
          <div className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <ul className="divide-y divide-app-border-subtle">
              {standingsPreview.map((row) => (
                <li
                  key={row.team}
                  className="flex items-center gap-2 px-2.5 py-1.5"
                >
                  <span className="w-5 text-center text-[11px] font-bold tabular-nums text-app-muted">
                    {row.rank}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <TeamCrest teamName={row.team} size={22} />
                    <span className="truncate text-[12px] font-semibold text-app-text">
                      {row.team}
                    </span>
                  </span>
                  <span className="text-[10px] tabular-nums text-app-muted">
                    PJ {row.pj}
                  </span>
                  <span className="w-7 text-right text-[12px] font-bold tabular-nums text-app-text">
                    {row.pts}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-app-border-subtle px-2.5 py-1.5 text-[9px] leading-snug text-app-muted">
              Vista previa · posiciones demo según fixture cargado.
            </p>
          </div>
        </section>
      ) : null}

      {featuredTeams.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader
            title={
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-app-muted" strokeWidth={2} />
                Equipos destacados
              </span>
            }
          />
          <div className="flex flex-wrap gap-1">
            {featuredTeams.map((t) => (
              <span
                key={t}
                className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-app-border bg-app-bg py-0.5 pl-1 pr-2 text-[10px] font-semibold text-app-text"
              >
                <TeamCrest teamName={t} size={20} />
                <span className="truncate">{t}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {activityNotes.length > 0 ? (
        <section className="mt-3 space-y-1.5">
          <SectionHeader
            title={
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-app-muted" strokeWidth={2} />
                Actividad
              </span>
            }
          />
          <ul className="space-y-1.5">
            {activityNotes.map((a) => (
              <li
                key={a.id}
                className="rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold leading-snug text-app-text">
                    {a.title}
                  </p>
                  <span className="shrink-0 text-[9px] font-medium text-app-muted">
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
    </div>
  );
}
