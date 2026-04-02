import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { formatPoolCloseLabel } from "@/lib/datetime";
import { formatPrizeLine } from "@/lib/pool-cta";
import { btnCompact, cardSurface } from "@/lib/ui-styles";
import type { PoolExploreEntry } from "@/lib/torneos-explore";
import { cn } from "@/lib/utils";

type TorneosExplorePoolCardProps = {
  entry: PoolExploreEntry;
};

export function TorneosExplorePoolCard({ entry }: TorneosExplorePoolCardProps) {
  const { pool, href, tournamentShortName, matchdayName } = entry;
  const hasPrize = pool.prizePoolArs > 0;

  return (
    <article className={cn("overflow-hidden", cardSurface)}>
      <div className="px-3 py-2.5">
        <h3 className="text-[13px] font-semibold leading-snug text-app-text">
          {tournamentShortName} — {matchdayName}
        </h3>
        {hasPrize ?
          <p className="mt-1 text-[19px] font-bold tabular-nums leading-none tracking-tight text-app-text">
            {formatPrizeLine(pool)}
          </p>
        : null}
        <p className="mt-1.5 text-[11px] font-medium leading-snug text-app-muted">
          {formatPoolCloseLabel(pool.closesAt)}
        </p>
        <Link
          href={href}
          className={cn(
            btnCompact(),
            "mt-2.5 min-h-[40px] w-full justify-center gap-1 border border-app-border bg-app-bg px-2 text-[13px] font-semibold text-app-text shadow-sm hover:border-app-primary/40 hover:bg-app-surface",
          )}
        >
          Jugar
          <ChevronRight className="h-3.5 w-3.5 opacity-80" strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}
