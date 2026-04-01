"use client";

import { ArrowRight, Clock, Flame, Trophy } from "lucide-react";
import Link from "next/link";

import { btnPrimaryFull, cardSurface } from "@/lib/ui-styles";
import { getProdeUrgency, urgencyStripClass } from "@/lib/prode-urgency";
import type { OfficialProdeListItem } from "@/mocks/official-prodes.mock";
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
      return "En juego";
    case "finished":
      return "Finalizado";
    default:
      return s;
  }
}

function statusBadgeClass(s: OfficialProdeListItem["status"]): string {
  switch (s) {
    case "open":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
    case "live":
      return "bg-[#DCFCE7] text-emerald-900 ring-emerald-300/70";
    case "closed":
      return "bg-slate-100 text-slate-800 ring-slate-200/80";
    case "finished":
      return "bg-slate-100 text-slate-600 ring-slate-200/80";
    default:
      return "bg-app-bg text-app-muted ring-app-border";
  }
}

const AVATAR_TINTS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-violet-500",
  "bg-rose-400",
];

function AvatarStack({ seed, className }: { seed: number; className?: string }) {
  const n = 4;
  return (
    <div className={cn("flex shrink-0 -space-x-2", className)} aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-7 w-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5",
            AVATAR_TINTS[(seed + i) % AVATAR_TINTS.length],
          )}
        />
      ))}
    </div>
  );
}

type OfficialProdeCardProps = {
  prode: OfficialProdeListItem;
  variant: "featured" | "compact";
};

export function OfficialProdeCard({ prode, variant }: OfficialProdeCardProps) {
  const isOpen = prode.status === "open" || prode.status === "live";
  const urgency = isOpen ? getProdeUrgency(prode.closesAt) : null;
  const seed = prode.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const tournamentUpper = prode.tournamentName.toUpperCase();
  const fechaUpper = prode.matchdayLabel.toUpperCase();
  const showSocial = prode.participants >= 120;

  const prizeBlock = (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
      <span
        className={cn(
          "select-none leading-none",
          variant === "featured" ? "text-[22px]" : "text-[17px]",
        )}
        aria-hidden
      >
        💰
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-extrabold tracking-tight text-app-text",
            variant === "featured" ? "text-[26px] leading-[1.1]" : "text-[18px] leading-tight",
          )}
        >
          ${formatArs(prode.prizeArs)}
        </p>
        <p
          className={cn(
            "font-semibold text-app-muted",
            variant === "featured" ? "text-[11px]" : "text-[10px]",
          )}
        >
          en premios
        </p>
      </div>
    </div>
  );

  const metaRow = (
    <div className="flex flex-wrap items-center gap-2">
      <AvatarStack seed={seed} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold tabular-nums text-app-text">
          {prode.participants.toLocaleString("es-AR")} jugadores
        </p>
        {showSocial ? (
          <p className="text-[10px] font-medium text-app-muted">
            Muchos jugadores activos
          </p>
        ) : (
          <p className="text-[10px] text-app-muted">Competencia oficial</p>
        )}
      </div>
    </div>
  );

  const urgencyBlock =
    urgency && isOpen ?
      <div
        suppressHydrationWarning
        className={cn(
          "flex items-start gap-2 rounded-lg border px-2.5 py-2",
          urgencyStripClass(urgency.variant),
        )}
      >
        <Flame
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0",
            urgency.variant === "critical" ? "text-amber-700" : "text-current",
          )}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide">
            {urgency.headline}
          </p>
          <p className="text-[11px] font-medium leading-snug opacity-95">
            {urgency.subline}
          </p>
        </div>
      </div>
    : !isOpen ?
      <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-bg px-2.5 py-2 text-[11px] text-app-muted">
        <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span>Pronósticos no disponibles</span>
      </div>
    : null;

  const scarcity =
    prode.scarcityHint && isOpen ?
      <span className="inline-flex items-center rounded-md border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
        Quedan pocos lugares
      </span>
    : null;

  const statusBadge = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
        statusBadgeClass(prode.status),
      )}
    >
      {statusLabel(prode.status)}
    </span>
  );

  const cta = (
    <span
      className={cn(
        btnPrimaryFull(),
        "min-h-[46px] gap-2 text-[13px] font-bold shadow-md shadow-blue-900/10",
        variant === "featured" && "text-[14px]",
      )}
    >
      Jugar ahora
      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
    </span>
  );

  if (variant === "featured") {
    return (
      <Link
        href={`/prodes/${encodeURIComponent(prode.id)}`}
        className={cn(
          cardSurface,
          "group block overflow-hidden ring-2 ring-app-primary/20 transition",
          "hover:ring-app-primary/35 hover:shadow-md active:scale-[0.995]",
        )}
      >
        <div className="border-b border-app-border-subtle bg-gradient-to-br from-blue-50/95 via-white to-app-surface px-4 pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-app-primary ring-1 ring-blue-100">
              <Trophy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Destacado
            </span>
            <div className="flex flex-col items-end gap-1.5">
              {statusBadge}
              {scarcity}
            </div>
          </div>

          <p className="mt-3 text-[11px] font-extrabold leading-snug tracking-wide text-app-text">
            <span>{tournamentUpper}</span>
            <span className="font-normal text-app-border"> — </span>
            <span className="text-[#16A34A]">{fechaUpper}</span>
          </p>

          <div className="mt-3">{prizeBlock}</div>

          <div className="mt-4">{metaRow}</div>

          {urgencyBlock ? <div className="mt-3">{urgencyBlock}</div> : null}
        </div>

        <div className="px-4 py-3.5">{cta}</div>
      </Link>
    );
  }

  return (
    <Link
      href={`/prodes/${encodeURIComponent(prode.id)}`}
      className={cn(
        cardSurface,
        "group flex flex-col gap-2.5 overflow-hidden p-3 transition",
        "hover:ring-1 hover:ring-app-primary/25 hover:shadow-sm active:scale-[0.995]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[10px] font-extrabold leading-snug tracking-wide text-app-text">
          <span className="block text-app-muted">{tournamentUpper}</span>
          <span className="mt-0.5 block text-[12px] text-app-text">
            <span className="text-app-border">— </span>
            <span className="text-[#16A34A]">{fechaUpper}</span>
          </span>
        </p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {statusBadge}
          {scarcity}
        </div>
      </div>

      <div className="min-w-0">{prizeBlock}</div>

      <div className="flex items-center gap-2 border-t border-app-border-subtle pt-2.5">
        <AvatarStack seed={seed} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tabular-nums text-app-text">
            {prode.participants.toLocaleString("es-AR")} jugadores
          </p>
          {showSocial ?
            <p className="text-[9px] font-medium text-app-muted">
              Activos ahora
            </p>
          : (
            <p className="text-[9px] text-app-muted">Competencia oficial</p>
          )}
        </div>
      </div>

      {urgencyBlock ? <div className="mt-1">{urgencyBlock}</div> : null}

      <div className="pt-1">{cta}</div>
    </Link>
  );
}
