"use client";

import type { RankingEntry } from "@/domain";

/** Compact secondary line: plenos · signo · pronósticos (partidos jugados). */
export function RankingStatsLine({ row }: { row: RankingEntry }) {
  const n = row.predictionsOnScored ?? 0;
  const signHits = row.signHits ?? 0;
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[10px] text-app-muted">
      <span className="font-semibold text-app-sport">{row.exactScores} plenos</span>
      <span>·</span>
      <span>
        {signHits} acierto{signHits === 1 ? "" : "s"} de signo
      </span>
      <span>·</span>
      <span className="tabular-nums">{n} pron.</span>
    </p>
  );
}
