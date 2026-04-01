"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useCatalogueRevision } from "@/components/app/CatalogueRefreshContext";
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
      return "bg-slate-50 text-slate-900 ring-slate-200/80";
    case "pendiente":
      return "bg-amber-50/90 text-amber-950 ring-amber-200/70";
    case "en_juego":
    default:
      return "bg-app-bg text-app-text ring-app-border";
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
    return null;
  }

  return (
    <section className={cn("space-y-2", className)}>
      <SectionHeader title="Mis prodes" />
      <p className="text-[10px] leading-snug text-app-muted">
        Estado, puntos y posición por competencia.
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
                    "ring-1 ring-amber-200/80 border-amber-200/40 bg-amber-50/25",
                  row.status.kind === "en_juego" &&
                    "border-app-border bg-app-surface",
                  row.status.kind === "completado" &&
                    "border-app-border bg-app-bg/60",
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
                    <p className="text-[10px] font-medium uppercase text-app-muted">
                      N.º
                    </p>
                  : null}
                  {row.rank !== null ?
                    <p className="text-[18px] font-semibold tabular-nums leading-none text-app-text">
                      {row.rank}
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
