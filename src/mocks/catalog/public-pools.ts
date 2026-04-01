import type { Matchday, PublicPool, PublicPoolStatus } from "@/domain";

function poolStatusFromMatchday(
  md: Matchday,
): PublicPoolStatus {
  if (md.status === "completed") return "settled";
  if (md.status === "closed") return "closed";
  return "open";
}

/** AFA Primera A/B/C: prode gratuito, premios fijos en ARS (demo hasta scrapeo). */
const AFA_PREMIO_PRIZE_TOTAL_ARS = 60_000;
const AFA_PREMIO_PAYOUT_ARS = [30_000, 20_000, 10_000] as const;
const AFA_PREMIO_PAYOUT_PCT = [50, 33.33, 16.67] as const;

function isAfaPremioTournament(tournamentId: string): boolean {
  return (
    tournamentId === "afa-premio-a" ||
    tournamentId === "afa-premio-b" ||
    tournamentId === "afa-premio-c"
  );
}

/**
 * Un pool por fecha. AFA Premio A/B/C: gratis, pozo 60k repartido 30/20/10 mil.
 * Resto: gratis sin premio en efectivo (demo).
 */
export function buildPublicPoolsForMatchdays(
  tournamentId: string,
  matchdays: Matchday[],
): PublicPool[] {
  const afa = isAfaPremioTournament(tournamentId);

  return matchdays.map((md, i) => {
    if (afa) {
      return {
        id: `pool-${md.id}`,
        tournamentId,
        matchdayId: md.id,
        type: "public_free",
        entryFeeArs: 0,
        prizePoolArs: AFA_PREMIO_PRIZE_TOTAL_ARS,
        payoutTopN: 3,
        payoutPercents: AFA_PREMIO_PAYOUT_PCT,
        payoutFixedArs: AFA_PREMIO_PAYOUT_ARS,
        participantsCount: 0,
        status: poolStatusFromMatchday(md),
        closesAt: md.closesAt,
      };
    }

    const participants = 42 + ((i * 17) % 140);
    return {
      id: `pool-${md.id}`,
      tournamentId,
      matchdayId: md.id,
      type: "public_free",
      entryFeeArs: 0,
      prizePoolArs: 0,
      payoutTopN: 3,
      payoutPercents: [50, 30, 20] as const,
      participantsCount: participants,
      status: poolStatusFromMatchday(md),
      closesAt: md.closesAt,
    };
  });
}
