import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { HomeStatsSnapshot } from "@/domain";
import { statLabel } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type HomeQuickStatsProps = {
  stats: HomeStatsSnapshot;
  className?: string;
};

function Cell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[3rem] flex-col justify-center bg-app-surface px-1.5 py-1.5 text-center",
        className,
      )}
    >
      <p className={statLabel}>{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function HomeQuickStats({ stats, className }: HomeQuickStatsProps) {
  return (
    <div className={cn(className)}>
      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-app-border bg-app-border-subtle shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <Cell label="Pts">
          <p className="text-[16px] font-bold tabular-nums leading-none text-app-text">
            {stats.weekPoints}
          </p>
        </Cell>
        <Cell label="Plenos">
          <p className="text-[16px] font-bold tabular-nums leading-none text-app-text">
            {stats.exactScores}
          </p>
        </Cell>
        <Cell label="Rank" className="px-0.5">
          <Link
            href="/ranking"
            className="inline-flex items-center justify-center gap-0.5 rounded-md py-0.5 text-[14px] font-bold tabular-nums text-app-primary transition hover:bg-blue-50/80 active:scale-[0.98]"
          >
            #{stats.weekRank}
            <ChevronRight className="h-3.5 w-3.5 opacity-80" strokeWidth={2} />
          </Link>
        </Cell>
        <Cell label="Pend.">
          <p className="text-[16px] font-bold tabular-nums leading-none text-app-text">
            {stats.pendingMarkers}
          </p>
        </Cell>
      </div>
    </div>
  );
}
