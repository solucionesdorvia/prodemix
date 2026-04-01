"use client";

import { ArrowRight, Banknote, Calendar, Target } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { ActivityEntry, PublicPool } from "@/domain";
import { ActivityItem } from "@/components/activity/ActivityItem";
import {
  activityLogToEntry,
  sortActivityByCreatedDesc,
} from "@/lib/activity-feed";
import { HomeFollowedStrip } from "@/components/home/HomeFollowedStrip";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomePendingSection } from "@/components/home/HomePendingSection";
import { HomeQuickStats } from "@/components/home/HomeQuickStats";
import { MisProdesSection } from "@/components/prodes/MisProdesSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatTimeUntilFuture } from "@/lib/datetime";
import { getRecentActivity } from "@/mocks/services/activity.mock";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import type { PersistedAppState } from "@/state/types";
import { countUnreadActivity } from "@/state/activity-unread";
import {
  buildHomePendingPredictions,
  buildHomeStats,
  getFollowedTournamentsForHome,
  predictionStorageKey,
} from "@/state/selectors";
import {
  formatPublicPoolLabel,
  getMatchIdsForMatchday,
  getPublicPoolById,
  PRIMERA_PUBLIC_POOLS,
} from "@/mocks/catalog/primera-catalog";
import { btnPrimaryFull, cardSurface } from "@/lib/ui-styles";
import { useAppState, useOwnedProdes } from "@/state/app-state";
import { cn } from "@/lib/utils";

function formatArs(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function poolHref(pool: PublicPool): string {
  return `/torneos/${encodeURIComponent(pool.tournamentId)}/fechas/${encodeURIComponent(pool.matchdayId)}`;
}

function countPoolPending(
  userId: string,
  pool: PublicPool,
  state: PersistedAppState,
): { pending: number; total: number } {
  const ids = getMatchIdsForMatchday(pool.tournamentId, pool.matchdayId);
  let pending = 0;
  for (const mid of ids) {
    const key = predictionStorageKey(userId, pool.id, mid);
    if (!state.publicPoolPredictionMap[key]) pending += 1;
  }
  return { pending, total: ids.length };
}

export function HomePageClient() {
  const { user, state } = useAppState();
  const owned = useOwnedProdes();
  const ingestionTick = useIngestionTick();

  const stats = useMemo(
    () => buildHomeStats(user.id, user.displayName, state),
    [user.id, user.displayName, state],
  );

  const pendingMatches = useMemo(() => {
    void ingestionTick;
    return buildHomePendingPredictions(user.id, state, { limit: 5 });
  }, [user.id, state, ingestionTick]);

  const followedTournaments = useMemo(() => {
    void ingestionTick;
    return getFollowedTournamentsForHome(state);
  }, [state, ingestionTick]);

  const unreadCount = useMemo(
    () => countUnreadActivity(state),
    [state],
  );

  const activity = useMemo((): ActivityEntry[] => {
    const persisted = sortActivityByCreatedDesc(state.activity);
    if (persisted.length === 0) {
      return getRecentActivity().slice(0, 3);
    }
    return persisted.slice(0, 8).map(activityLogToEntry);
  }, [state.activity]);

  const activityPreview = useMemo(() => activity.slice(0, 3), [activity]);

  const userPredictionCount = useMemo(() => {
    const prefix = `${user.id}::`;
    const a = Object.keys(state.predictionMap).filter((k) =>
      k.startsWith(prefix),
    ).length;
    const b = Object.keys(state.publicPoolPredictionMap).filter((k) =>
      k.startsWith(prefix),
    ).length;
    return a + b;
  }, [user.id, state.predictionMap, state.publicPoolPredictionMap]);

  const heroPool = useMemo(() => {
    return (
      PRIMERA_PUBLIC_POOLS.find((p) => p.status === "open") ??
      PRIMERA_PUBLIC_POOLS[0] ??
      null
    );
  }, []);

  const heroPoolHref = heroPool ? poolHref(heroPool) : null;

  const openPools = useMemo(() => {
    return PRIMERA_PUBLIC_POOLS.filter((p) => p.status === "open").sort(
      (a, b) =>
        new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
    );
  }, []);

  const otherOpenPools = useMemo(() => {
    if (!heroPool) return openPools.slice(0, 6);
    return openPools.filter((p) => p.id !== heroPool.id).slice(0, 5);
  }, [openPools, heroPool]);

  const joinedPools = useMemo(() => {
    return state.joinedPublicPoolIds
      .map((id) => getPublicPoolById(id))
      .filter((p): p is PublicPool => Boolean(p));
  }, [state.joinedPublicPoolIds]);

  return (
    <>
      <HomeHeader
        userName={user.displayName.split(" ")[0] ?? user.displayName}
        activityUnreadCount={unreadCount}
      />

      <div className="mt-4 space-y-5">
      <HomeQuickStats stats={stats} />

      {heroPool && heroPoolHref ? (
        <section className="space-y-2">
          <SectionHeader
            title="Pool destacado"
            action={
              <Link href="/torneos" className="font-semibold hover:underline">
                Más fechas
              </Link>
            }
          />
          <Link
            href={heroPoolHref}
            className={cn(
              cardSurface,
              "block overflow-hidden transition hover:ring-1 hover:ring-app-primary/25 active:scale-[0.995]",
            )}
          >
            <div className="border-b border-app-border-subtle bg-gradient-to-br from-blue-50/90 to-app-surface px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-app-primary">
                Jugá por pozo · Primera
              </p>
              <p className="mt-1 text-[15px] font-bold leading-tight text-app-text">
                {formatPublicPoolLabel(heroPool)}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px]">
                {heroPool.type === "public_paid" ? (
                  <span className="font-semibold text-app-text">
                    Inscripción ${formatArs(heroPool.entryFeeArs)}
                  </span>
                ) : (
                  <span className="font-semibold text-app-text">Gratis</span>
                )}
                {heroPool.prizePoolArs > 0 ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <Banknote className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Pozo ${formatArs(heroPool.prizePoolArs)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[10px] font-medium leading-snug text-app-muted">
                <span className="font-semibold text-app-text">
                  {formatTimeUntilFuture(heroPool.closesAt)}
                </span>
                <span className="text-app-border"> · </span>
                Premios top {heroPool.payoutTopN}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-app-text">
                Unirte y cargar marcadores
              </span>
              <span className={cn(btnPrimaryFull(), "w-auto px-3 py-2 text-[12px]")}>
                Entrar al pool
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {otherOpenPools.length > 0 ? (
        <section className="space-y-2">
          <SectionHeader
            title="Próximas fechas"
            action={
              <Link href="/torneos" className="font-semibold hover:underline">
                Torneos
              </Link>
            }
          />
          <ul className="space-y-1.5">
            {otherOpenPools.map((p) => (
              <li key={p.id}>
                <Link
                  href={poolHref(p)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg active:scale-[0.995]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-app-text">
                      {formatPublicPoolLabel(p)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-app-muted">
                      {formatTimeUntilFuture(p.closesAt)}
                      {p.prizePoolArs > 0 ?
                        ` · Pozo $${formatArs(p.prizePoolArs)}`
                      : null}
                    </p>
                  </div>
                  <Calendar
                    className="h-4 w-4 shrink-0 text-app-primary"
                    strokeWidth={2}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <SectionHeader
          title="Mis fechas activas"
          action={
            joinedPools.length > 0 ?
              <Link href="/ranking" className="font-semibold hover:underline">
                Ranking
              </Link>
            : null
          }
        />
        {joinedPools.length === 0 ? (
          <p className="rounded-lg border border-dashed border-app-border bg-app-bg/70 px-3 py-2.5 text-[11px] leading-snug text-app-muted">
            Unite a un pool público desde un torneo o el destacado arriba. Tus
            pronósticos y el pozo quedan acá.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {joinedPools.map((p) => {
              const { pending, total } = countPoolPending(user.id, p, state);
              const complete = pending === 0 && total > 0;
              return (
                <li key={p.id}>
                  <Link
                    href={poolHref(p)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg active:scale-[0.995]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-app-text">
                        {formatPublicPoolLabel(p)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-app-muted">
                        {complete ?
                          "Pronósticos listos"
                        : `Faltan ${pending} de ${total} marcadores`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        complete ?
                          "bg-emerald-50 text-emerald-900"
                        : "bg-amber-50 text-amber-900",
                      )}
                    >
                      {complete ? "Listo" : "Pendiente"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {owned.length > 0 && userPredictionCount === 0 ? (
        <EmptyState
          className="mt-0"
          variant="minimal"
          layout="horizontal"
          icon={Target}
          eyebrow="Pronósticos"
          title="Todavía no cargaste ningún marcador"
          description={
            <>
              Entrá a un{" "}
              <Link href="/torneos" className="font-semibold text-app-primary">
                pool por fecha
              </Link>{" "}
              o a un{" "}
              <Link href="/perfil">prode propio</Link>, cargá marcadores exactos
              y sumá puntos.
            </>
          }
        />
      ) : null}

        <HomePendingSection items={pendingMatches} />

        <HomeFollowedStrip items={followedTournaments} />

        <MisProdesSection
          prodes={owned}
          userId={user.id}
          displayName={user.displayName}
          state={state}
        />

        <section className="space-y-2">
          <SectionHeader
            title="Actividad reciente"
            action={
              <Link
                href="/actividad"
                className="relative inline-flex items-center font-semibold hover:underline"
              >
                Centro
                {unreadCount > 0 ? (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-app-primary px-1 text-[9px] font-bold leading-none text-white"
                    aria-hidden
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            }
          />
          {activityPreview.length === 0 ? (
            <EmptyState
              variant="minimal"
              layout="stack"
              title="Sin movimientos todavía"
              description="Pools, prodes propios y ranking: cuando pase algo en la demo, aparece acá."
            />
          ) : (
            <div className={cn("overflow-hidden", cardSurface)}>
              {activityPreview.map((a, i) => (
                <ActivityItem
                  key={a.id}
                  entry={a}
                  className={i > 0 ? "border-t border-app-border-subtle" : ""}
                />
              ))}
            </div>
          )}
          <Link
            href="/actividad"
            className="block text-center text-[11px] font-semibold text-app-muted hover:text-app-primary hover:underline"
          >
            Ver toda la actividad
          </Link>
        </section>

        <p className="border-t border-app-border-subtle pt-4 text-center text-[11px] text-app-muted">
          <Link href="/torneos" className="font-semibold text-app-primary hover:underline">
            Explorar torneos
          </Link>
          <span className="text-app-border"> · </span>
          <Link href="/crear" className="font-semibold text-app-muted hover:text-app-text hover:underline">
            Prode propio
          </Link>
          <span className="block pt-0.5 text-[10px] font-normal text-app-muted/90">
            Secundario · grupos privados
          </span>
        </p>
      </div>
    </>
  );
}
