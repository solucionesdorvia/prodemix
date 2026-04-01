"use client";

import { ArrowRight, ChevronRight, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { HomeHeader } from "@/components/home/HomeHeader";
import { MatchCard } from "@/components/matches/MatchCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getAllCatalogueMatchesWithLabels } from "@/lib/catalogue-matches";
import { cardSurface, btnPrimaryFull } from "@/lib/ui-styles";
import type { OfficialProdeListItem } from "@/mocks/official-prodes.mock";
import {
  getOfficialProdeMatchIds,
  getOfficialProdesList,
} from "@/mocks/official-prodes.mock";
import { getProdeUrgency } from "@/lib/prode-urgency";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { countUnreadActivity } from "@/state/activity-unread";
import { buildHomeStats } from "@/state/selectors";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

/** Prode Élite AFA A — fixture y pronósticos rápidos arriba del feed. */
const QUICK_PRODE_ID = "official-elite-afa-premio-a-f1";

function pickHomeSpotlightProdes(): OfficialProdeListItem[] {
  const open = getOfficialProdesList().filter(
    (p) => p.status === "open" || p.status === "live",
  );
  const eliteFeatured = open.find((p) => p.featured && p.category === "elite");
  const others = open.filter((p) => p.id !== eliteFeatured?.id);
  const gratis = others.filter((p) => p.category === "gratis");
  const eliteOther = others.filter((p) => p.category === "elite");
  const out: OfficialProdeListItem[] = [];
  if (eliteFeatured) out.push(eliteFeatured);
  for (const p of [...gratis, ...eliteOther]) {
    if (out.length >= 3) break;
    out.push(p);
  }
  return out.slice(0, 3);
}

function formatArs(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function HomePageClient() {
  const { user, state, setPrediction } = useAppState();

  const stats = useMemo(
    () => buildHomeStats(user.id, user.displayName, state),
    [user.id, user.displayName, state],
  );

  const unreadCount = useMemo(
    () => countUnreadActivity(state),
    [state],
  );

  const quickMatchIds = useMemo(
    () => new Set(getOfficialProdeMatchIds(QUICK_PRODE_ID)),
    [],
  );

  const spotlightProdes = useMemo(() => pickHomeSpotlightProdes(), []);

  const todayMatches = useMemo(() => {
    const all = getAllCatalogueMatchesWithLabels().filter((m) =>
      quickMatchIds.has(m.id),
    );
    const now = new Date();
    const today = all.filter((m) => sameDay(new Date(m.startsAt), now));
    if (today.length > 0) return today.slice(0, 4);
    return [...all]
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      .slice(0, 4);
  }, [quickMatchIds]);

  return (
    <>
      <HomeHeader
        userName={user.displayName.split(" ")[0] ?? user.displayName}
        activityUnreadCount={unreadCount}
        tagline="Futsal Argentina · prodes oficiales"
      />

      <div className="mt-3 space-y-4">
        <section className="space-y-2">
          <SectionHeader
            title="Jugá ahora"
            action={
              <Link
                href="/prodes"
                className="text-[11px] font-semibold text-app-primary hover:underline"
              >
                Ver todos
              </Link>
            }
          />
          {spotlightProdes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-app-border bg-app-bg/80 px-3 py-2 text-[11px] text-app-muted">
              No hay prodes abiertos en este momento.
            </p>
          ) : (
            <ul className="space-y-2">
              {spotlightProdes.map((p) => {
                const isElite = p.category === "elite";
                const urgency =
                  p.status === "open" || p.status === "live"
                    ? getProdeUrgency(p.closesAt)
                    : null;
                const prizeLine = isElite
                  ? `Ganá hasta $${formatArs(p.headlinePrizeArs)} · Ingreso $${formatArs(p.entryFeeArs)}`
                  : `1° $${formatArs(p.prizes.first)} · 2° $${formatArs(p.prizes.second)} · 3° $${formatArs(p.prizes.third)}`;
                const ctaLabel = isElite ? "Ingresar" : "Jugar";
                const ctaClass = isElite
                  ? cn(
                      btnPrimaryFull(),
                      "w-auto shrink-0 px-3 py-2 text-[11px] font-bold shadow-sm",
                    )
                  : cn(
                      "inline-flex min-h-[38px] items-center justify-center rounded-[10px] px-3 py-2 text-[11px] font-bold text-white shadow-sm transition",
                      "bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.995]",
                    );
                return (
                  <li key={p.id}>
                    <Link
                      href={`/prodes/${encodeURIComponent(p.id)}`}
                      className={cn(
                        cardSurface,
                        "flex items-stretch justify-between gap-2 px-3 py-2 transition active:scale-[0.995]",
                        isElite && p.featured
                          ? "ring-2 ring-app-primary/20 shadow-[0_8px_28px_-14px_rgba(37,99,235,0.45)] hover:ring-app-primary/30"
                          : "hover:ring-1 hover:ring-app-border",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide",
                              isElite
                                ? "bg-slate-900 text-white"
                                : "bg-[#DCFCE7] text-emerald-900",
                            )}
                          >
                            {isElite ? "Élite" : "Gratis"}
                          </span>
                          {p.featured && isElite ?
                            <span className="rounded-full bg-app-primary/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-app-primary">
                              Destacado
                            </span>
                          : null}
                        </div>
                        <p className="mt-1 truncate text-[12px] font-bold leading-tight text-app-text">
                          {p.tournamentName} · {p.matchdayLabel}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold text-app-sport">
                          {prizeLine}
                        </p>
                        <p className="mt-0.5 text-[10px] text-app-muted">
                          {p.participants.toLocaleString("es-AR")} jugadores
                          compitiendo
                          {urgency?.subline ?
                            <>
                              {" "}
                              · {urgency.subline}
                            </>
                          : null}
                        </p>
                      </div>
                      <span className={ctaClass}>{ctaLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <SectionHeader title="Partidos de hoy" />
          {todayMatches.length === 0 ? (
            <p className="text-[11px] text-app-muted">Sin partidos en el fixture.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayMatches.map((m) => {
                const key = `${user.id}::${QUICK_PRODE_ID}::${m.id}`;
                const stored = state.predictionMap[key];
                const finalResult = getMockResultForMatch(m.id);
                const locked = !!finalResult;
                return (
                  <li key={m.id}>
                    <MatchCard
                      match={m}
                      compact
                      initialScore={stored ?? null}
                      finalResult={finalResult ?? null}
                      pointsEarned={null}
                      predictionLocked={locked}
                      onPredictionCommit={
                        locked
                          ? undefined
                          : (score) =>
                              setPrediction(QUICK_PRODE_ID, m.id, score)
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={`/prodes/${encodeURIComponent(QUICK_PRODE_ID)}`}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold text-app-primary hover:underline"
          >
            Ver prode completo
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        </section>

        <section className="space-y-2">
          <SectionHeader
            title="Tu progreso"
            action={
              <Link
                href="/ranking"
                className="text-[11px] font-semibold text-app-primary hover:underline"
              >
                Ranking
              </Link>
            }
          />
          <div
            className={cn(
              cardSurface,
              "grid grid-cols-3 gap-px overflow-hidden bg-app-border-subtle p-0",
            )}
          >
            <div className="bg-app-surface px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-app-muted">
                Puntos
              </p>
              <p className="mt-0.5 text-[18px] font-bold tabular-nums text-app-text">
                {stats.weekPoints}
              </p>
            </div>
            <div className="bg-app-surface px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-app-muted">
                Plenos
              </p>
              <p className="mt-0.5 text-[18px] font-bold tabular-nums text-app-sport">
                {stats.exactScores}
              </p>
            </div>
            <div className="bg-app-surface px-2 py-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-app-muted">
                Ranking
              </p>
              <p className="mt-0.5 text-[18px] font-bold tabular-nums text-app-text">
                #{stats.weekRank}
              </p>
            </div>
          </div>
          <Link
            href="/ranking"
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-[12px] font-semibold text-app-text shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-app-primary" strokeWidth={2} aria-hidden />
              Ver tabla global
            </span>
            <ArrowRight className="h-4 w-4 text-app-muted" strokeWidth={2} aria-hidden />
          </Link>
        </section>

        <section className="rounded-lg border border-app-border bg-gradient-to-br from-blue-50/50 to-app-surface px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-app-primary" strokeWidth={2} aria-hidden />
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-app-text">
                Competencias oficiales
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
                Solo prodes curados por la plataforma. Elegí uno, cargá el
                marcador y competí por ranking.
              </p>
              <Link
                href="/prodes"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-app-primary hover:underline"
              >
                Ir a Prodes
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
