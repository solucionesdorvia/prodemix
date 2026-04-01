"use client";

import { ArrowRight, Flame, Sparkles, Trophy, Users } from "lucide-react";
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

/** Badge principal de estado / urgencia (abierto vs cierra hoy / últimas horas). */
function openStatusHeadline(
  prode: OfficialProdeListItem,
  urgency: ReturnType<typeof getProdeUrgency> | null,
): string {
  const open = prode.status === "open" || prode.status === "live";
  if (!open) return statusLabel(prode.status);
  if (!urgency) return "Abierto";
  if (urgency.variant === "critical") return "Últimas horas";
  if (urgency.variant === "today") return "Cierra hoy";
  if (urgency.variant === "soon") return urgency.headline;
  return "Abierto";
}

function openStatusChipClass(
  prode: OfficialProdeListItem,
  urgency: ReturnType<typeof getProdeUrgency> | null,
): string {
  const open = prode.status === "open" || prode.status === "live";
  if (!open) return statusBadgeClass(prode.status);
  if (!urgency) return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
  if (urgency.variant === "critical") {
    return "bg-amber-50 text-amber-950 ring-amber-200/90";
  }
  if (urgency.variant === "today" || urgency.variant === "soon") {
    return "bg-amber-50/95 text-amber-950 ring-amber-200/80";
  }
  return "bg-emerald-50 text-emerald-900 ring-emerald-200/80";
}

const AVATAR_TINTS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-violet-500",
];

function AvatarStack({ seed, className }: { seed: number; className?: string }) {
  return (
    <div className={cn("flex shrink-0 -space-x-2", className)} aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-6 w-6 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5",
            AVATAR_TINTS[(seed + i) % AVATAR_TINTS.length],
          )}
        />
      ))}
    </div>
  );
}

function PrizeLines({ prode }: { prode: OfficialProdeListItem }) {
  const { first, second, third } = prode.prizes;
  return (
    <ul className="space-y-0.5 text-[11px] font-semibold tabular-nums text-app-text">
      <li className="flex justify-between gap-2">
        <span className="text-app-muted">1°</span>
        <span>${formatArs(first)}</span>
      </li>
      <li className="flex justify-between gap-2">
        <span className="text-app-muted">2°</span>
        <span>${formatArs(second)}</span>
      </li>
      <li className="flex justify-between gap-2">
        <span className="text-app-muted">3°</span>
        <span>${formatArs(third)}</span>
      </li>
    </ul>
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
  const showSocial = prode.participants >= 40;
  const isElite = prode.category === "elite";
  const statusHeadline = openStatusHeadline(prode, urgency);
  const statusChipClass = openStatusChipClass(prode, urgency);

  const scarcity =
    prode.scarcityHint && isOpen ?
      <span className="inline-flex rounded-md border border-amber-300/50 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
        Cupos limitados
      </span>
    : null;

  const categoryBadge =
    isElite ?
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white ring-1 ring-slate-700/30">
        <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
        Prode Élite
      </span>
    : (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 ring-1 ring-emerald-200/80">
        Gratis
      </span>
    );

  const headlinePrize =
    isElite ?
      <p className="text-[11px] font-bold leading-tight text-app-sport">
        Ganá hasta ${formatArs(prode.headlinePrizeArs)}
      </p>
    : (
      <p className="text-[11px] font-bold leading-tight text-app-sport">
        Premios ${formatArs(prode.prizes.first)} / ${formatArs(prode.prizes.second)} / ${formatArs(prode.prizes.third)}
      </p>
    );

  const entryBlock =
    isElite ?
      <div className="rounded-xl border border-app-border bg-app-bg/80 px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
          Ingreso
        </p>
        <p className="mt-0.5 text-[18px] font-extrabold tabular-nums text-app-text">
          ${formatArs(prode.entryFeeArs)}
        </p>
      </div>
    : null;

  const urgencyDetail =
    urgency && isOpen && (urgency.variant !== "calm" || urgency.subline) ?
      <div
        suppressHydrationWarning
        className={cn(
          "flex items-start gap-2 rounded-lg border px-2 py-1.5",
          urgencyStripClass(urgency.variant),
        )}
      >
        <Flame
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700/90"
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0 text-[10px] leading-snug">
          <p className="font-bold uppercase tracking-wide">{urgency.headline}</p>
          <p className="font-medium opacity-95">{urgency.subline}</p>
        </div>
      </div>
    : null;

  const socialRow = (
    <div className="flex items-center gap-2">
      <AvatarStack seed={seed} />
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[11px] font-bold tabular-nums text-app-text">
          <Users className="h-3.5 w-3.5 shrink-0 text-app-muted" strokeWidth={2} aria-hidden />
          {prode.participants.toLocaleString("es-AR")} jugadores
        </p>
        {showSocial ?
          <p className="text-[9px] font-medium text-app-muted">
            compitiendo ahora
          </p>
        : null}
      </div>
    </div>
  );

  const ctaGratis = (
    <span
      className={cn(
        "inline-flex min-h-[46px] w-full items-center justify-center gap-1.5 rounded-[10px] px-4 text-[13px] font-bold text-white shadow-sm transition",
        "bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.995]",
      )}
    >
      Jugar gratis
      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
    </span>
  );

  const ctaElite = (
    <span
      className={cn(
        btnPrimaryFull(),
        "min-h-[46px] gap-2 text-[13px] font-bold shadow-md shadow-blue-900/10",
        variant === "featured" && "min-h-[48px] text-[14px]",
      )}
    >
      Ingresar ahora
      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
    </span>
  );

  const cta = isElite ? ctaElite : ctaGratis;

  if (variant === "featured" && isElite) {
    return (
      <Link
        href={`/prodes/${encodeURIComponent(prode.id)}`}
        className={cn(
          cardSurface,
          "group block overflow-hidden ring-2 ring-app-primary/25 shadow-[0_12px_40px_-16px_rgba(37,99,235,0.45)] transition",
          "hover:ring-app-primary/40 hover:shadow-lg active:scale-[0.995]",
        )}
      >
        <div className="border-b border-app-border-subtle bg-gradient-to-br from-slate-900/[0.03] via-white to-blue-50/40 px-4 pb-3 pt-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-app-primary px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm">
              <Trophy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Destacado
            </span>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {categoryBadge}
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ring-1",
                  statusChipClass,
                )}
              >
                {statusHeadline}
              </span>
              {scarcity}
            </div>
          </div>

          <p className="mt-3 text-[11px] font-extrabold leading-snug tracking-wide text-app-text">
            <span>{tournamentUpper}</span>
            <span className="font-normal text-app-border"> — </span>
            <span className="text-[#16A34A]">{fechaUpper}</span>
          </p>

          <p className="mt-2 text-[15px] font-extrabold leading-tight text-app-text">
            Ganá hasta ${formatArs(prode.headlinePrizeArs)}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-app-border bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                Ingreso
              </p>
              <p className="mt-0.5 text-[22px] font-black tabular-nums text-app-text">
                ${formatArs(prode.entryFeeArs)}
              </p>
            </div>
            <div className="rounded-xl border border-app-border bg-white px-3 py-2.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
                Podio
              </p>
              <div className="mt-1 text-[12px] font-bold tabular-nums">
                <PrizeLines prode={prode} />
              </div>
            </div>
          </div>

          <div className="mt-3">{socialRow}</div>
          {urgencyDetail ? <div className="mt-3">{urgencyDetail}</div> : null}
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
        "group flex flex-col gap-2 overflow-hidden p-3 transition",
        isElite ?
          "border-slate-200/90 hover:ring-1 hover:ring-slate-300/80 hover:shadow-md"
        : "hover:ring-1 hover:ring-emerald-200/80 hover:shadow-sm",
        "active:scale-[0.995]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {categoryBadge}
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ring-1",
              statusChipClass,
            )}
          >
            {statusHeadline}
          </span>
          {scarcity}
        </div>
      </div>

      <p className="text-[10px] font-extrabold leading-snug tracking-wide text-app-text">
        <span className="text-app-muted">{tournamentUpper}</span>
        <span className="text-app-border"> — </span>
        <span className="text-[#16A34A]">{fechaUpper}</span>
      </p>

      {isElite ?
        <>
          {headlinePrize}
          {entryBlock}
          <div className="rounded-lg border border-app-border-subtle bg-app-bg/50 px-2 py-1.5">
            <PrizeLines prode={prode} />
          </div>
        </>
      : (
        <>
          {headlinePrize}
          <div className="rounded-lg border border-app-border-subtle bg-app-bg/50 px-2 py-1.5">
            <PrizeLines prode={prode} />
          </div>
        </>
      )}

      <div className="border-t border-app-border-subtle pt-2">{socialRow}</div>

      {urgencyDetail ? <div>{urgencyDetail}</div> : null}

      <div className="pt-0.5">{cta}</div>
    </Link>
  );
}
