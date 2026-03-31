import Link from "next/link";
import { Calendar, ChevronRight, MapPin } from "lucide-react";

import type { TorneoBrowseItem } from "@/domain";
import { btnCompact, cardSurface } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

import { accentByCategory, pillByCategory } from "./torneo-styles";

type TorneoCardProps = {
  torneo: TorneoBrowseItem;
  following: boolean;
  onToggleFollow: () => void;
  variant?: "default" | "featured";
  /** Pool público de la fecha abierta (producto principal). */
  playFechaHref?: string | null;
};

export function TorneoCard({
  torneo,
  following,
  onToggleFollow,
  variant = "default",
  playFechaHref,
}: TorneoCardProps) {
  const teamsLine =
    torneo.teamsCount > 0
      ? `${torneo.teamsCount} equipos`
      : "Equipos por confirmar";

  return (
    <article
      className={cn(
        "overflow-hidden border-l-[3px]",
        cardSurface,
        accentByCategory(torneo.categoryId),
        variant === "featured" && "ring-1 ring-app-primary/12",
      )}
    >
      <div className={cn("px-2.5 py-2", variant === "featured" && "py-2.5")}>
        <div className="flex items-start justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1">
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                pillByCategory(torneo.categoryId),
              )}
            >
              {torneo.categoryLabel}
            </span>
            {torneo.promoBadge ? (
              <span className="inline-flex shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/35 dark:text-amber-200">
                {torneo.promoBadge}
              </span>
            ) : null}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
              torneo.statusLabel === "Finalizado"
                ? "bg-app-bg text-app-muted"
                : "bg-app-bg text-app-text",
            )}
          >
            {torneo.statusLabel}
          </span>
        </div>

        <h3
          className={cn(
            "mt-1.5 font-semibold leading-tight text-app-text",
            variant === "featured" ? "text-[14px]" : "text-[13px]",
          )}
        >
          {torneo.name}
        </h3>
        <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
          {torneo.subtitle}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-app-muted">
          <span className="inline-flex items-center gap-0.5 font-medium text-app-text/90">
            <MapPin className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} />
            {torneo.region}
          </span>
          <span className="text-app-border">·</span>
          <span className="tabular-nums">{teamsLine}</span>
        </div>
        <p className="mt-1 text-[10px] font-semibold leading-snug text-app-primary">
          {torneo.phaseLabel}
        </p>

        <div className="mt-2.5 flex flex-col gap-2">
          {playFechaHref ? (
            <Link
              href={playFechaHref}
              className={cn(
                btnCompact(),
                "min-h-[40px] w-full justify-center gap-1 bg-app-primary px-2 text-[12px] font-semibold text-white shadow-sm hover:bg-blue-700",
              )}
            >
              <Calendar className="h-3.5 w-3.5 opacity-95" strokeWidth={2} aria-hidden />
              Jugar fecha · pool
              <ChevronRight className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
            </Link>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleFollow}
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
              href={`/torneos/${encodeURIComponent(torneo.id)}`}
              className={cn(
                btnCompact(),
                "min-h-[40px] flex-1 gap-0.5 border border-app-border bg-app-surface px-2 text-[12px] text-app-text shadow-sm hover:bg-app-bg",
              )}
            >
              Torneo
              <ChevronRight className="h-3.5 w-3.5 opacity-90" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
