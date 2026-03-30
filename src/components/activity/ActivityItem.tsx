import { BarChart3, Sparkles, Star, Trophy, Zap } from "lucide-react";

import type { ActivityEntry } from "@/domain";
import { cn } from "@/lib/utils";

const ICONS = {
  prediction: Sparkles,
  prode: Trophy,
  ranking: BarChart3,
  follow: Star,
  points: Zap,
} as const;

type ActivityItemProps = {
  entry: ActivityEntry;
  className?: string;
};

export function ActivityItem({ entry, className }: ActivityItemProps) {
  const Icon = ICONS[entry.kind];
  return (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-primary">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-snug text-app-text">
          {entry.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-app-muted">
          {entry.detail}
        </p>
      </div>
      <span className="shrink-0 pt-0.5 text-[10px] font-medium tabular-nums text-app-muted">
        {entry.timeLabel}
      </span>
    </div>
  );
}
