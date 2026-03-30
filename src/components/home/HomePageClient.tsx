"use client";

import { ArrowRight, Target, Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { ActivityEntry } from "@/domain";
import { ActivityItem } from "@/components/activity/ActivityItem";
import {
  activityLogToEntry,
  sortActivityByCreatedDesc,
} from "@/lib/activity-feed";
import { HomeFollowedStrip } from "@/components/home/HomeFollowedStrip";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomePendingSection } from "@/components/home/HomePendingSection";
import { HomeQuickStats } from "@/components/home/HomeQuickStats";
import { SmallProdeCard } from "@/components/prodes/SmallProdeCard";
import {
  EmptyState,
  EmptyStateButtonLink,
} from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getRecentActivity } from "@/mocks/services/activity.mock";
import { useIngestionTick } from "@/hooks/useIngestionTick";
import { countUnreadActivity } from "@/state/activity-unread";
import {
  buildHomePendingPredictions,
  buildHomeStats,
  buildProdeSummary,
  getFollowedTournamentsForHome,
} from "@/state/selectors";
import { btnPrimaryFull, cardSurface } from "@/lib/ui-styles";
import { useAppState, useOwnedProdes } from "@/state/app-state";
import { cn } from "@/lib/utils";

export function HomePageClient() {
  const { user, state } = useAppState();
  const owned = useOwnedProdes();
  const ingestionTick = useIngestionTick();

  const stats = useMemo(
    () => buildHomeStats(user.id, user.displayName, state),
    [user.id, user.displayName, state],
  );

  const prodeSummaries = useMemo(
    () =>
      owned.map((p) => buildProdeSummary(p, user.id, state)),
    [owned, user.id, state],
  );

  const prodePreview = useMemo(() => prodeSummaries.slice(0, 3), [prodeSummaries]);

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
    return Object.keys(state.predictionMap).filter((k) =>
      k.startsWith(prefix),
    ).length;
  }, [user.id, state.predictionMap]);

  return (
    <>
      <HomeHeader
        userName={user.displayName.split(" ")[0] ?? user.displayName}
        activityUnreadCount={unreadCount}
      />

      <HomeQuickStats stats={stats} className="mt-3" />

      <Link href="/crear" className={cn(btnPrimaryFull(), "mt-3")}>
        Nuevo prode
        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      </Link>

      {owned.length > 0 && userPredictionCount === 0 ? (
        <EmptyState
          className="mt-3"
          variant="minimal"
          layout="horizontal"
          icon={Target}
          eyebrow="Pronósticos"
          title="Todavía no cargaste ningún marcador"
          description={
            <>
              Entrá a un{" "}
              <Link href="/perfil">prode</Link>, elegí partido y guardá el
              resultado exacto. Ahí empezás a sumar.
            </>
          }
        />
      ) : null}

      <div className="mt-4 space-y-4 pb-1">
        <HomePendingSection items={pendingMatches} />

        <HomeFollowedStrip items={followedTournaments} />

        <section className="space-y-2">
          <SectionHeader
            title="Mis prodes"
            action={
              <Link href="/perfil" className="font-semibold hover:underline">
                Perfil
              </Link>
            }
          />
          {prodeSummaries.length === 0 ? (
            <EmptyState
              variant="soft"
              layout="stack"
              icon={Users}
              title="Todavía no tenés prodes"
              description="Armá uno con los torneos que quieras y compartí el código con tu grupo."
            >
              <EmptyStateButtonLink href="/crear">Crear prode</EmptyStateButtonLink>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {prodePreview.map((p) => (
                <li key={p.id}>
                  <SmallProdeCard prode={p} />
                </li>
              ))}
            </ul>
          )}
          {prodeSummaries.length > 3 ? (
            <Link
              href="/perfil"
              className="block text-center text-[11px] font-semibold text-app-muted hover:text-app-primary hover:underline"
            >
              Ver los {prodeSummaries.length} prodes
            </Link>
          ) : null}
        </section>

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
              description="Cuando cargues pronósticos o pase algo en tus prodes, lo vas a ver acá."
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
      </div>
    </>
  );
}
