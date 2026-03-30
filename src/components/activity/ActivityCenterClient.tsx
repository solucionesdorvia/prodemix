"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import { ActivityItem } from "@/components/activity/ActivityItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { mergeActivityEntries } from "@/lib/activity-feed";
import { cardSurface, pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import { getRecentActivity } from "@/mocks/services/activity.mock";
import { useAppState } from "@/state/app-state";

export function ActivityCenterClient() {
  const { state, markActivitySeen } = useAppState();

  useEffect(() => {
    queueMicrotask(() => markActivitySeen());
  }, [markActivitySeen]);

  const rows = useMemo(
    () => mergeActivityEntries(state.activity, getRecentActivity()),
    [state.activity],
  );

  return (
    <div className="pb-2">
      <header className={cn(pageHeader, "space-y-0")}>
        <Link
          href="/"
          className="inline-flex text-[12px] font-semibold text-app-primary hover:underline"
        >
          ← Inicio
        </Link>
        <p className={cn(pageEyebrow, "mt-3")}>Centro</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Actividad</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Novedades de tus prodes, pronósticos y ranking (demo local).
        </p>
      </header>

      <section className="mt-4 space-y-2">
        <SectionHeader title="Todo" />
        {rows.length === 0 ? (
          <EmptyState
            variant="soft"
            layout="stack"
            title="Todavía no hay nada en el feed"
            description="Cuando cargues pronósticos, sigas torneos o cambie el ranking, vas a ver el resumen acá."
          />
        ) : (
          <div className={cn("overflow-hidden", cardSurface)}>
            {rows.map((a, i) => (
              <ActivityItem
                key={a.id}
                entry={a}
                className={i > 0 ? "border-t border-app-border-subtle" : ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
