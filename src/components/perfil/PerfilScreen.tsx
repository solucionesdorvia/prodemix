"use client";

import Link from "next/link";
import { ChevronRight, Settings2, Star, Trophy } from "lucide-react";
import { useMemo } from "react";

import type { PublicPool } from "@/domain";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import { pageEyebrow, pageHeader, pageTitle, statLabel } from "@/lib/ui-styles";
import { initialsFromDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import {
  formatPublicPoolLabel,
  getPublicPoolById,
} from "@/mocks/catalog/primera-catalog";
import { getTorneoBrowseItems } from "@/mocks/services/torneos-browse.mock";
import {
  aggregateUserPredictionsByMatch,
  computePointsBreakdown,
} from "@/state/selectors";
import { useAppState, useOwnedProdes } from "@/state/app-state";

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex min-h-[3.25rem] flex-col justify-center bg-app-surface px-2 py-2 text-center">
      <p className={statLabel}>{label}</p>
      <p className="mt-1 text-[17px] font-bold tabular-nums leading-none text-app-text">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[9px] font-medium text-app-muted">{sub}</p>
      ) : null}
    </div>
  );
}

export function PerfilScreen() {
  const ingestionTick = useIngestionTick();
  const { user, state } = useAppState();
  const owned = useOwnedProdes();

  const { totalPoints, exactHits } = useMemo(() => {
    const preds = aggregateUserPredictionsByMatch(user.id, state);
    const { points, exactScores } = computePointsBreakdown(preds);
    return { totalPoints: points, exactHits: exactScores };
  }, [user.id, state]);

  const followedLabels = useMemo(() => {
    void ingestionTick;
    const items = getTorneoBrowseItems();
    const byId = new Map(items.map((t) => [t.id, t]));
    return state.followedTournamentIds
      .map((id) => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [state.followedTournamentIds, ingestionTick]);

  const joinedPools = useMemo((): PublicPool[] => {
    return state.joinedPublicPoolIds
      .map((id) => getPublicPoolById(id))
      .filter((p): p is PublicPool => Boolean(p));
  }, [state.joinedPublicPoolIds]);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Perfil</h1>
        <p className="mt-1 text-[11px] font-medium leading-snug text-app-muted">
          Futsal Argentina · prodes oficiales
        </p>
      </header>

      <section className="mt-4 flex gap-3">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-app-text text-lg font-bold text-app-surface shadow-sm"
          aria-hidden
        >
          {initialsFromDisplayName(user.displayName)}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-[17px] font-semibold leading-tight text-app-text">
            {user.displayName}
          </h2>
          <p className="mt-0.5 text-[13px] font-medium text-app-primary">
            @{user.username}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-app-muted">
            Temporada 2026 · CABA y alrededores
          </p>
        </div>
      </section>

      <section className="mt-3 space-y-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Resumen
        </h3>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-app-border bg-app-border-subtle shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <StatCell
            label="Pts totales"
            value={totalPoints}
            sub="vs tabla demo"
          />
          <StatCell
            label="Plenos"
            value={exactHits}
            sub="marcadores exactos"
          />
          <StatCell
            label="Fechas"
            value={joinedPools.length}
            sub="pools públicos"
          />
        </div>
        <p className="mt-2 text-[10px] leading-snug text-app-muted">
          Prodes extra (demo local):{" "}
          <span className="font-semibold text-app-text">{owned.length}</span>
        </p>
      </section>

      <section className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Pools por fecha
          </h3>
          <Link
            href="/prodes"
            className="text-[11px] font-semibold text-app-primary hover:underline"
          >
            Prodes
          </Link>
        </div>
        {joinedPools.length === 0 ? (
          <p className="rounded-lg border border-dashed border-app-border bg-app-bg/70 px-3 py-2.5 text-[11px] leading-snug text-app-muted">
            Todavía no entraste a ningún pool público. Unite desde{" "}
            <Link href="/prodes" className="font-semibold text-app-primary">
              Prodes
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-1.5">
            {joinedPools.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/torneos/${encodeURIComponent(p.tournamentId)}/fechas/${encodeURIComponent(p.matchdayId)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-left shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg active:scale-[0.995]"
                >
                  <span className="min-w-0 truncate text-[12px] font-semibold text-app-text">
                    {formatPublicPoolLabel(p)}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-app-muted"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Torneos que seguís
          </h3>
          <Link
            href="/prodes"
            className="text-[11px] font-semibold text-app-primary hover:underline"
          >
            Prodes
          </Link>
        </div>
        {followedLabels.length === 0 ? (
          <EmptyState
            variant="soft"
            layout="horizontal"
            icon={Star}
            title="Sin torneos seguidos"
            description="Explorá competiciones y tocá seguir para tenerlas a mano."
          >
            <EmptyStateButtonLink href="/prodes">Ver prodes</EmptyStateButtonLink>
          </EmptyState>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {followedLabels.map((t) => (
              <span
                key={t.id}
                className="inline-flex max-w-full items-center rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-[11px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)]"
              >
                {t.name.split("·")[0]?.trim() ?? t.name}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] leading-snug text-app-muted">
          Tus seguimientos se guardan en este dispositivo (demo local).
        </p>
      </section>

      <section className="mt-3 space-y-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Actividad
        </h3>
        <Link
          href="/ranking"
          className="flex items-center justify-between gap-2 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-app-bg active:scale-[0.995]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-primary">
              <Trophy className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-app-text">
                Ver ranking
              </span>
              <span className="mt-0.5 block text-[10px] text-app-muted">
                Global, fecha y torneo
              </span>
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-app-muted"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </section>

      <section className="mt-3 space-y-2">
        <Link
          href="#configuracion"
          className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-app-border bg-app-surface px-3 py-2.5 text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:bg-app-bg active:scale-[0.995]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-primary">
              <Settings2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-app-text">
                Configuración
              </span>
              <span className="mt-0.5 block text-[10px] text-app-muted">
                Cuenta, notificaciones y privacidad
              </span>
            </span>
          </span>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-app-muted"
            strokeWidth={2}
            aria-hidden
          />
        </Link>

        <div
          id="configuracion"
          className="scroll-mt-4 rounded-lg border border-dashed border-app-border bg-app-bg/70 px-3 py-2.5 text-[10px] leading-snug text-app-muted"
          tabIndex={-1}
        >
          Próximamente: edición de perfil, alertas de partidos y cierre de
          sesión.
        </div>
      </section>
    </div>
  );
}
