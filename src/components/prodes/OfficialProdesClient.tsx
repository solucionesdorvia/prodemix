"use client";

import { ArrowRight, Clock, Trophy, Users } from "lucide-react";
import Link from "next/link";

import {
  btnPrimaryFull,
  cardSurface,
  pageEyebrow,
  pageHeader,
  pageTitle,
} from "@/lib/ui-styles";
import { getOfficialProdesList, type OfficialProdeListItem } from "@/mocks/official-prodes.mock";
import { cn } from "@/lib/utils";

function formatArs(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function statusLabel(s: OfficialProdeListItem["status"]): string {
  switch (s) {
    case "open":
      return "Abierto";
    case "closed":
      return "Cerrado";
    case "live":
      return "En vivo";
    case "finished":
      return "Finalizado";
    default:
      return s;
  }
}

function statusClass(s: OfficialProdeListItem["status"]): string {
  switch (s) {
    case "open":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
    case "live":
      return "bg-amber-50 text-amber-900 ring-amber-200/80";
    case "closed":
      return "bg-slate-100 text-slate-800 ring-slate-200/80";
    case "finished":
      return "bg-slate-100 text-slate-600 ring-slate-200/80";
    default:
      return "bg-app-bg text-app-muted ring-app-border";
  }
}

export function OfficialProdesClient() {
  const all = getOfficialProdesList();
  const featured = all.find((p) => p.featured) ?? all[0];
  const rest = all.filter((p) => p.id !== featured?.id);

  return (
    <div className="pb-2">
      <header className={pageHeader}>
        <p className={pageEyebrow}>Competencias oficiales</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Prodes</h1>
        <p className="mt-1 text-[12px] leading-snug text-app-muted">
          Elegí un prode, cargá tus pronósticos y competí por el ranking.
        </p>
      </header>

      {featured ? (
        <section className="mt-3">
          <Link
            href={`/prodes/${encodeURIComponent(featured.id)}`}
            className={cn(
              cardSurface,
              "block overflow-hidden ring-1 ring-app-primary/15 transition hover:ring-app-primary/30 active:scale-[0.995]",
            )}
          >
            <div className="border-b border-app-border-subtle bg-gradient-to-br from-blue-50/90 to-app-surface px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-app-primary ring-1 ring-blue-100">
                  <Trophy className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Destacado
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                    statusClass(featured.status),
                  )}
                >
                  {statusLabel(featured.status)}
                </span>
              </div>
              <p className="mt-2 text-[16px] font-bold leading-tight text-app-text">
                {featured.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-muted">
                <span className="font-semibold text-app-text">
                  Pozo ${formatArs(featured.prizeArs)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {featured.participants} jugadores
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {featured.deadlineLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-app-text">
                Entrá y jugá ahora
              </span>
              <span className={cn(btnPrimaryFull(), "w-auto px-4 py-2 text-[12px]")}>
                Jugar
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="mt-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
          Todos los prodes
        </p>
        <ul className="space-y-2">
          {rest.map((p) => (
            <li key={p.id}>
              <Link
                href={`/prodes/${encodeURIComponent(p.id)}`}
                className={cn(
                  cardSurface,
                  "flex items-center justify-between gap-2 px-3 py-2.5 transition hover:ring-1 hover:ring-app-primary/20 active:scale-[0.995]",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold leading-tight text-app-text">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-app-muted">
                    Pozo ${formatArs(p.prizeArs)} · {p.participants} jug. ·{" "}
                    <span className={cn(statusClass(p.status), "rounded px-1 py-px")}>
                      {statusLabel(p.status)}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-app-primary">
                  Jugar →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
