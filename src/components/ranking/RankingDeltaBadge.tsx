"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { RankingEntry } from "@/domain";

export function RankingDeltaBadge({ row }: { row: RankingEntry }) {
  const d = row.rankDelta;
  if (d === undefined || d === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-app-muted">
        <Minus className="h-3 w-3" strokeWidth={2} />
        —
      </span>
    );
  }
  if (d > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
        <TrendingUp className="h-3 w-3" strokeWidth={2.5} />+{d}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600">
      <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
      {d}
    </span>
  );
}
