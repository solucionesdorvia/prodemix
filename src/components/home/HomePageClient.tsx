"use client";

import { ArrowRight, Banknote, Target } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { PublicPool } from "@/domain";
import { HomeFollowedStrip } from "@/components/home/HomeFollowedStrip";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomePendingSection } from "@/components/home/HomePendingSection";
import { HomeQuickStats } from "@/components/home/HomeQuickStats";
import { useAuth } from "@/components/auth/AuthProvider";
import { MisProdesSection } from "@/components/prodes/MisProdesSection";
import { MisProdesServerSection } from "@/components/prodes/MisProdesServerSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatPoolCloseLabel } from "@/lib/datetime";
import { publicPoolEntryLabel } from "@/lib/prode-entry-label";
import { formatPrizeLine } from "@/lib/pool-cta";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import type { PersistedAppState } from "@/state/types";
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
  const { hydrated, loggedIn } = useAuth();
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
        userName={
          user.username.trim().length > 0 ?
            user.username
          : (user.displayName.split(" ")[0] ?? user.displayName)
        }
      />

      <div className="mt-4 space-y-5">
      <HomeQuickStats stats={stats} />

      {heroPool && heroPoolHref ? (
        <section className="space-y-2">
          <SectionHeader
            title="Fecha abierta"
            action={
              <Link href="/torneos" className="font-semibold hover:underline">
                Torneos
              </Link>
            }
          />
          <Link
            href={heroPoolHref}
            className={cn(
              cardSurface,
              "block overflow-hidden transition hover:border-app-muted active:scale-[0.995]",
            )}
          >
            <div className="border-b border-app-border-subtle px-3 py-3">
              <p className="text-[12px] font-semibold leading-snug text-app-text">
                {formatPublicPoolLabel(heroPool)}
              </p>
              <p className="mt-2 text-[22px] font-bold tabular-nums leading-none text-app-text">
                {formatPrizeLine(heroPool)}
              </p>
              <p className="mt-1 text-[11px] font-medium text-app-muted">
                {publicPoolEntryLabel(heroPool)}
              </p>
              <p className="mt-1.5 text-[12px] font-medium text-app-muted">
                {formatPoolCloseLabel(heroPool.closesAt)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-app-muted">
                <Banknote className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Top {heroPool.payoutTopN} posiciones
              </span>
              <span className={cn(btnPrimaryFull(), "w-auto px-3 py-1.5 text-[12px]")}>
                Jugar
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
                  className="block rounded-lg border border-app-border bg-app-surface px-2.5 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition hover:bg-app-bg active:scale-[0.995]"
                >
                  <p className="text-[12px] font-semibold leading-snug text-app-text">
                    {formatPublicPoolLabel(p)}
                  </p>
                  <p className="mt-1 text-[16px] font-bold tabular-nums text-app-text">
                    {formatPrizeLine(p)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-app-muted">
                    {formatPoolCloseLabel(p.closesAt)}
                  </p>
                  <p className="mt-2 text-right text-[12px] font-semibold text-app-primary">
                    Jugar →
                  </p>
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
            Elegí una fecha en Torneos y entrá al prode. Tus pronósticos quedan
            listados acá.
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
          title="Sin pronósticos cargados"
          description={
            <>
              Desde{" "}
              <Link href="/torneos" className="font-semibold text-app-primary">
                Torneos
              </Link>{" "}
              cargá el marcador exacto por partido.
            </>
          }
        />
      ) : null}

        <HomePendingSection items={pendingMatches} />

        <HomeFollowedStrip items={followedTournaments} />

        {hydrated && loggedIn ?
          <MisProdesServerSection showViewAllLink />
        : (
          <MisProdesSection
            prodes={owned}
            userId={user.id}
            displayName={user.displayName}
            state={state}
          />
        )}

        <p className="border-t border-app-border-subtle pt-4 text-center text-[11px] text-app-muted">
          <Link href="/torneos" className="font-semibold text-app-primary hover:underline">
            Torneos
          </Link>
        </p>
      </div>
    </>
  );
}
