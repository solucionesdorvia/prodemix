import type { Matchday, PublicPool, PublicPoolStatus } from "@/domain";

function poolStatusFromMatchday(
  md: Matchday,
): PublicPoolStatus {
  if (md.status === "completed") return "settled";
  if (md.status === "closed") return "closed";
  return "open";
}

/**
 * One public pool per fecha — deterministic demo numbers (monetization prototype).
 */
export function buildPublicPoolsForMatchdays(
  tournamentId: string,
  matchdays: Matchday[],
): PublicPool[] {
  return matchdays.map((md, i) => {
    const paid = i % 4 === 1;
    const participants = 42 + ((i * 17) % 140);
    const entry = paid ? 3000 : 0;
    const prize = paid ? Math.round(participants * entry * 0.88) : 0;
    return {
      id: `pool-${md.id}`,
      tournamentId,
      matchdayId: md.id,
      type: paid ? "public_paid" : "public_free",
      entryFeeArs: entry,
      prizePoolArs: prize,
      payoutTopN: 3,
      payoutPercents: [50, 30, 20] as const,
      participantsCount: participants,
      status: poolStatusFromMatchday(md),
      closesAt: md.closesAt,
    };
  });
}
