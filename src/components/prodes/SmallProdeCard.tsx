import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { ProdeSummary } from "@/domain";
import { cardSurface } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type SmallProdeCardProps = {
  prode: ProdeSummary;
  className?: string;
  /** Defaults to opening the prode detail (predictions). */
  href?: string;
};

export function SmallProdeCard({
  prode,
  className,
  href = `/prodes/${prode.id}`,
}: SmallProdeCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-left transition active:scale-[0.99]",
        cardSurface,
        "hover:border-app-muted hover:shadow-card-hover",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight text-app-text">
          {prode.name}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
          {prode.matchCount} partidos · {prode.nextDeadline}
        </p>
        <p className="mt-1 inline-flex text-[10px] font-semibold text-app-sport">
          {prode.progressLabel}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-app-muted/80"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  );
}
