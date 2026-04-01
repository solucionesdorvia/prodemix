"use client";

import { ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useCatalogueRevision } from "@/components/app/CatalogueRefreshContext";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  countPendingProdePredictions,
  getMisProdeStatus,
  getProdeTournamentLabel,
} from "@/lib/mis-prode-status";
import { cardSurface } from "@/lib/ui-styles";
import {
  buildProdeRankingEntries,
  computePointsBreakdownForProde,
  getPredictionsForProde,
} from "@/state/selectors";
import type { PersistedAppState, StoredProde } from "@/state/types";
import { cn } from "@/lib/utils";

type MisProdesSectionProps = {
  prodes: StoredProde[];
  userId: string;
  displayName: string;
  state: PersistedAppState;
  className?: string;
};

function statusPillClass(kind: ReturnType<typeof getMisProdeStatus>["kind"]): string {
  switch (kind) {
    case "finalizado":
      return "bg-slate-100 text-slate-800 ring-slate-200/90";
    case "completado":
      return "bg-emerald-50 text-emerald-950 ring-emerald-200/80";
    case "pendiente":
      return "bg-amber-50 text-amber-950 ring-amber-200/80";
    case "en_juego":
    default:
      return "bg-sky-50 text-sky-950 ring-sky-200/80";
  }
}

export function MisProdesSection({
  prodes,
  userId,
  displayName,
  state,
  className,
}: MisProdesSectionProps) {
  const catRev = useCatalogueRevision();

  const rows = useMemo(() => {
    void catRev;
    return prodes.map((prode) => {
      const preds = getPredictionsForProde(userId, prode.id, state.predictionMap);
      const breakdown = computePointsBreakdownForProde(preds, prode.matchIds);
      const ranking = buildProdeRankingEntries(
        prode,
        userId,
        displayName,
        state,
      );
      const me = ranking.find((r) => r.playerId === userId);
      const status = getMisProdeStatus(prode, userId, state);
      const pending = countPendingProdePredictions(prode, userId, state);
      const tournamentLabel = getProdeTournamentLabel(prode);
      const unfinished = pending > 0;

      return {
        prode,
        points: breakdown.points,
        rank: me?.rank ?? null,
        status,
        tournamentLabel,
        unfinished,
        pending,
        matchCount: prode.matchIds.length,
      };
    });
  }, [prodes, userId, displayName, state, catRev]);

  if (prodes.length === 0) {
    return (
      <section className={cn("space-y-2", className)}>
        <SectionHeader title="Mis prodes" />
        <EmptyState
          variant="soft"
          layout="stack"
          icon={LayoutGrid}
          title="Todavía no tenés prodes"
          description="Creá un grupo o uníte con un código para ver tus competencias acá."
        >
          <EmptyStateButtonLink href="/crear">Crear prode</EmptyStateButtonLink>
        </EmptyState>
      </section>
    );
  }

  return (
    <section className={cn("space-y-2", className)}>
      <SectionHeader
        title="Mis prodes"
        action={
          <Link href="/crear" className="font-semibold hover:underline">
            Crear
          </Link>
        }
      />
      <p className="text-[10px] leading-snug text-app-muted">
        Torneos en los que participás: estado, puntos y puesto en la tabla.
      </p>
      <ul className="space-y-2">
        {rows.map((row) => {
          const href = `/prodes/${encodeURIComponent(row.prode.id)}`;
          return (
            <li key={row.prode.id}>
              <Link
                href={href}
                className={cn(
                  "flex items-stretch gap-2 px-3 py-2.5 text-left transition active:scale-[0.995]",
                  cardSurface,
                  "hover:border-app-muted hover:shadow-card-hover",
                  row.status.kind === "pendiente" &&
                    "ring-1 ring-amber-200/90 border-amber-200/50 bg-amber-50/35",
                  row.status.kind === "en_juego" &&
                    "ring-1 ring-sky-200/80 border-sky-200/50 bg-sky-50/30",
                  row.status.kind === "completado" &&
                    "ring-1 ring-emerald-200/60 bg-emerald-50/25",
                  row.status.kind === "finalizado" &&
                    "opacity-[0.98]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold leading-tight text-app-text">
                    {row.prode.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-app-muted">
                    {row.tournamentLabel}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                        statusPillClass(row.status.kind),
                      )}
                    >
                      {row.status.label}
                    </span>
                    {row.unfinished ?
                      <span className="text-[9px] font-semibold text-amber-800">
                        Faltan {row.pending}/{row.matchCount}
                      </span>
                    : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right">
                  {row.rank !== null ?
                    <p className="text-[10px] font-semibold uppercase text-app-muted">
                      Puesto
                    </p>
                  : null}
                  {row.rank !== null ?
                    <p className="text-[18px] font-bold tabular-nums leading-none text-app-text">
                      {row.rank}°
                    </p>
                  : (
                    <p className="text-[10px] text-app-muted">—</p>
                  )}
                  <p className="text-[14px] font-bold tabular-nums text-app-sport">
                    {row.points}{" "}
                    <span className="text-[9px] font-semibold text-app-muted">
                      pts
                    </span>
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 self-center text-app-muted/80"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
