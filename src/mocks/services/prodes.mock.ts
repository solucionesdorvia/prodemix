import type { ProdeSummary } from "@/domain";

export function getProdeSummaries(): ProdeSummary[] {
  return [...PRODE_SUMMARIES_FIXTURE];
}

const PRODE_SUMMARIES_FIXTURE: ProdeSummary[] = [
  {
    id: "p1",
    name: "Mix futsal + barrial",
    matchCount: 8,
    nextDeadline: "Mañana · 18:00",
    progressLabel: "5/8 marcadores",
  },
  {
    id: "p2",
    name: "Liga Núñez express",
    matchCount: 4,
    nextDeadline: "Hoy · 21:00",
    progressLabel: "2/4 marcadores",
  },
];
