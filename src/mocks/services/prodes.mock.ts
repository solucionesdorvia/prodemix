import type { ProdeSummary } from "@/domain";

export function getProdeSummaries(): ProdeSummary[] {
  return [...PRODE_SUMMARIES_FIXTURE];
}

const PRODE_SUMMARIES_FIXTURE: ProdeSummary[] = [
  {
    id: "p1",
    name: "Premio A · fecha 1",
    matchCount: 8,
    nextDeadline: "Mañana · 18:00",
    progressLabel: "5/8 marcadores",
  },
  {
    id: "p2",
    name: "Premio B · fecha 3",
    matchCount: 9,
    nextDeadline: "Sáb · 20:00",
    progressLabel: "3/9 marcadores",
  },
];
