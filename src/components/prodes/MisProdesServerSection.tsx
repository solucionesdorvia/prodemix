"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  groupMisProdeRowsByPhase,
  type MisProdePhase,
} from "@/lib/group-mis-prodes";
import type { MisProdeServerKind } from "@/lib/mis-prode-server-status";
import { cardSurface } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type MeProdeRow = {
  prode: {
    id: string;
    slug: string;
    title: string;
  };
  tournamentLabel: string;
  stats: {
    matchCount: number;
    predictionCount: number;
    pendingCount: number;
    points: number;
    rank: number | null;
    plenos: number;
  };
  status: { kind: MisProdeServerKind; label: string };
};

type MisProdesServerSectionProps = {
  className?: string;
  /** En inicio/perfil: enlace a la pantalla dedicada `/mis-prodes`. */
  showViewAllLink?: boolean;
  /** En `/mis-prodes` el título va en la página; oculta el encabezado duplicado. */
  omitSectionHeader?: boolean;
  /** Texto más corto arriba (inicio / perfil). */
  compactHint?: boolean;
};

const PHASE_COPY: Record<
  MisProdePhase,
  { title: string; hint: string }
> = {
  upcoming: {
    title: "Próximos",
    hint: "Todavía podés cargar o ajustar pronósticos (hasta el cierre del prode).",
  },
  live: {
    title: "En juego",
    hint: "Ya cerró la carga. Los puntos y el ranking siguen la base de datos (marcadores oficiales).",
  },
  done: {
    title: "Finalizados",
    hint: "Prode cerrado en el sistema (FINALIZED o CANCELLED).",
  },
};

const PHASE_ORDER: MisProdePhase[] = ["upcoming", "live", "done"];

function statusPillClass(kind: MisProdeServerKind): string {
  switch (kind) {
    case "finalizado":
      return "bg-slate-100 text-slate-800 ring-slate-200/90";
    case "completado":
      return "bg-slate-50 text-slate-900 ring-slate-200/80";
    case "pendiente":
      return "bg-amber-50/90 text-amber-950 ring-amber-200/70";
    case "cerrado":
      return "bg-slate-50 text-slate-700 ring-slate-200/80";
    case "en_juego":
    default:
      return "bg-app-bg text-app-text ring-app-border";
  }
}

export function MisProdesServerSection({
  className,
  showViewAllLink = false,
  omitSectionHeader = false,
  compactHint = false,
}: MisProdesServerSectionProps) {
  const { hydrated, loggedIn } = useAuth();
  const [rows, setRows] = useState<MeProdeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const misProdesHeader =
    omitSectionHeader ? null : (
      <SectionHeader
        title="Mis prodes"
        action={
          showViewAllLink ?
            <Link href="/mis-prodes" className="font-semibold hover:underline">
              Ver todos
            </Link>
          : undefined
        }
      />
    );

  const load = useCallback(async () => {
    if (!loggedIn) return;
    setError(null);
    try {
      const res = await fetch("/api/me/prodes", { credentials: "include" });
      const data = (await res.json()) as {
        prodes?: MeProdeRow[];
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "No se pudo cargar Mis prodes.");
        setRows([]);
        return;
      }
      setRows(data.prodes ?? []);
    } catch {
      setError("No se pudo cargar Mis prodes.");
      setRows([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    void load();
  }, [hydrated, loggedIn, load]);

  if (!hydrated || !loggedIn) {
    return null;
  }

  if (rows === null) {
    return (
      <section className={cn("space-y-2", className)}>
        {misProdesHeader}
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-4",
            cardSurface,
          )}
        >
          <div
            className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-app-border border-t-app-primary"
            aria-hidden
          />
          <p className="text-[11px] text-app-muted">Cargando tus prodes…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn("space-y-2", className)}>
        {misProdesHeader}
        <p className="rounded-lg border border-app-border bg-app-bg/80 px-3 py-2 text-[11px] text-app-muted">
          {error}{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold text-app-primary underline"
          >
            Reintentar
          </button>
        </p>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className={cn("space-y-2", className)}>
        {misProdesHeader}
        <p className="text-[10px] leading-snug text-app-muted">
          Entrá a un prode desde la lista o con un enlace; tus pronósticos se
          guardan en tu cuenta.
        </p>
        <p className="rounded-lg border border-dashed border-app-border bg-app-bg/70 px-3 py-2.5 text-[11px] leading-snug text-app-muted">
          Todavía no estás en ningún prode con esta cuenta.
        </p>
      </section>
    );
  }

  const grouped = groupMisProdeRowsByPhase(rows);

  return (
    <section className={cn("space-y-5", className)}>
      {misProdesHeader}
      <p className="text-[10px] leading-snug text-app-muted">
        {compactHint ?
          "Agrupados por estado (datos reales). Tocá un prode para ranking y partidos."
        : "Datos de tu cuenta en el servidor. Tocá un prode para ver cada partido (marcador oficial cuando está cargado), tu puntaje y el ranking."}
      </p>
      {PHASE_ORDER.map((phase) => {
        const bucket = grouped[phase];
        const { title, hint } = PHASE_COPY[phase];
        if (bucket.length === 0) return null;

        return (
          <div key={phase} className="space-y-2">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                {title}
              </h3>
              <p className="mt-0.5 text-[10px] leading-snug text-app-muted">
                {hint}
              </p>
            </div>
            <ul className="space-y-2">
              {bucket.map((row) => {
                const href = `/prodes/${encodeURIComponent(row.prode.slug || row.prode.id)}`;
                const unfinished = row.stats.pendingCount > 0;
                const matchCount = row.stats.matchCount;

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
                        row.status.kind === "cerrado" &&
                          "border-app-border bg-app-bg/50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-tight text-app-text">
                          {row.prode.title}
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
                          {unfinished && matchCount > 0 ?
                            <span className="text-[9px] font-semibold text-amber-800">
                              Faltan {row.stats.pendingCount}/{matchCount}
                            </span>
                          : !unfinished && matchCount > 0 ?
                            <span className="text-[9px] font-semibold text-app-muted">
                              Pronósticos completos
                            </span>
                          : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 text-right">
                        {row.stats.rank !== null ?
                          <p className="text-[10px] font-medium uppercase text-app-muted">
                            N.º
                          </p>
                        : null}
                        {row.stats.rank !== null ?
                          <p className="text-[18px] font-semibold tabular-nums leading-none text-app-text">
                            {row.stats.rank}
                          </p>
                        : (
                          <p className="text-[10px] text-app-muted">—</p>
                        )}
                        <p className="text-[14px] font-bold tabular-nums text-app-sport">
                          {row.stats.points}{" "}
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
          </div>
        );
      })}
    </section>
  );
}
