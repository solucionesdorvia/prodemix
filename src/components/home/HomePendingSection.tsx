"use client";

import { ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";

import { TeamCrest } from "@/components/team/TeamCrest";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMatchKickoffPending } from "@/lib/datetime";
import type { HomePendingMatch } from "@/state/selectors";
import { cn } from "@/lib/utils";

type HomePendingSectionProps = {
  items: HomePendingMatch[];
  className?: string;
};

export function HomePendingSection({ items, className }: HomePendingSectionProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold leading-none tracking-tight text-app-text">
          Pendientes
          {items.length > 0 ? (
            <span className="ml-1 font-normal text-[11px] text-app-muted">
              ({items.length})
            </span>
          ) : null}
        </h2>
      </div>
      <p className="text-[10px] leading-snug text-app-muted">
        Próximos partidos en tus prodes sin marcador cargado.
      </p>

      {items.length === 0 ? (
        <EmptyState
          variant="soft"
          layout="horizontal"
          icon={ClipboardList}
          title="Nada pendiente por acá"
          description={
            <>
              Si tenés prodes con partidos por jugar, van a aparecer acá cuando
              falte el marcador.{" "}
              <Link href="/crear">Creá un prode</Link> o entrá a{" "}
              <Link href="/perfil">tus prodes</Link> desde el perfil.
            </>
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {items.map(({ match, prodeId, prodeName }) => (
            <li key={`${prodeId}-${match.id}`}>
              <Link
                href={`/prodes/${encodeURIComponent(prodeId)}`}
                className="flex items-center gap-2 rounded-[10px] border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-app-primary/35 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-app-primary">
                    {prodeName}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-semibold leading-tight text-app-text">
                    <span className="inline-flex items-center gap-1">
                      <TeamCrest teamName={match.homeTeam} size={24} />
                      <span className="truncate">{match.homeTeam}</span>
                    </span>
                    <span className="font-normal text-app-muted">vs</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="truncate">{match.awayTeam}</span>
                      <TeamCrest teamName={match.awayTeam} size={24} />
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-app-muted">
                    {formatMatchKickoffPending(match.startsAt)}
                    {match.tournamentLabel ? (
                      <span className="text-app-border"> · </span>
                    ) : null}
                    {match.tournamentLabel ? (
                      <span className="truncate">{match.tournamentLabel}</span>
                    ) : null}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-app-primary">
                  Cargar
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
