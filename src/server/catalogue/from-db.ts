/**
 * Maps Prisma rows to existing domain DTOs so the UI can switch off mocks progressively.
 * Use from Server Components or route handlers (not in client bundles without an API).
 */
import type { Match, Matchday, TournamentCatalogueEntry } from "@/domain";

import { getPrisma } from "@/lib/prisma";
import type {
  Match as PrismaMatch,
  Matchday as PrismaMatchday,
  MatchStatus,
  MatchdayStatus,
  Team,
  Tournament,
} from "@/generated/prisma/client";

function matchdayStatusToDomain(s: MatchdayStatus): Matchday["status"] {
  if (s === "COMPLETED") return "completed";
  if (s === "CLOSED") return "closed";
  return "open";
}

function matchPlayStatus(s: MatchStatus): NonNullable<Match["matchStatus"]> {
  if (s === "LIVE") return "live";
  if (s === "FINISHED") return "finished";
  return "scheduled";
}

function mapMatchday(md: PrismaMatchday): Matchday {
  return {
    id: md.externalKey,
    tournamentId: md.tournamentId,
    name: md.name,
    roundNumber: md.roundNumber,
    startsAt: md.startsAt.toISOString(),
    closesAt: md.closesAt.toISOString(),
    status: matchdayStatusToDomain(md.status),
  };
}

function mapMatch(
  m: PrismaMatch & { homeTeam: Team; awayTeam: Team; matchday: PrismaMatchday },
  tournamentName: string,
): Match {
  const base: Match = {
    id: m.id,
    tournamentId: m.tournamentId,
    matchdayId: m.matchday.externalKey,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    startsAt: m.startsAt.toISOString(),
    tournamentLabel: tournamentName,
  };
  if (m.homeScore != null && m.awayScore != null) {
    base.result = {
      homeGoals: m.homeScore,
      awayGoals: m.awayScore,
    };
  }
  base.matchStatus = matchPlayStatus(m.status);
  return base;
}

function mapTournamentRow(
  t: Tournament & {
    matchdays: PrismaMatchday[];
    matches: (PrismaMatch & {
      homeTeam: Team;
      awayTeam: Team;
      matchday: PrismaMatchday;
    })[];
  },
): TournamentCatalogueEntry {
  const matchdays = t.matchdays.map((md) => mapMatchday(md));
  const matches = t.matches.map((m) => mapMatch(m, t.name));
  const shortName =
    t.slug.includes("afa-premio") ?
      `AFA Futsal ${t.slug.endsWith("-a") ? "A" : t.slug.endsWith("-b") ? "B" : "C"}`
    : t.name;

  return {
    id: t.id,
    name: t.name,
    shortName,
    division: "primera",
    matchdays,
    matches,
  };
}

/** Full AFA Premio catalogue as stored in Postgres (seed). */
export async function getTournamentCatalogueFromDb(): Promise<
  TournamentCatalogueEntry[]
> {
  const prisma = getPrisma();
  const rows = await prisma.tournament.findMany({
    where: {
      slug: { in: ["afa-premio-a", "afa-premio-b", "afa-premio-c"] },
    },
    orderBy: { slug: "asc" },
    include: {
      matchdays: { orderBy: { roundNumber: "asc" } },
      matches: {
        orderBy: { startsAt: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          matchday: true,
        },
      },
    },
  });
  return rows.map(mapTournamentRow);
}
