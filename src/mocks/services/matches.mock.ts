import type { Match } from "@/domain";

/** Home “próximos partidos” feed — would be `GET /matches?scope=upcoming` */
export function getHomeUpcomingMatches(): Match[] {
  return [...HOME_UPCOMING_MATCHES_FIXTURE];
}

const HOME_UPCOMING_MATCHES_FIXTURE: Match[] = [
  {
    id: "m1",
    tournamentId: "afa-premio-a",
    homeTeam: "Boca Juniors",
    awayTeam: "Racing Club",
    tournamentLabel: "AFA Futsal · Primera A · Premio",
    startsAt: "2026-03-30T19:30:00-03:00",
    tags: ["all", "futsal"],
  },
  {
    id: "m2",
    tournamentId: "joma-honor-a-primera",
    homeTeam: "Boca Juniors",
    awayTeam: "River Plate",
    tournamentLabel: "Torneo Joma · Liga Honor A · Primera",
    startsAt: "2026-03-30T21:00:00-03:00",
    tags: ["all", "futsal"],
  },
  {
    id: "m3",
    tournamentId: "argenliga-zona-1",
    homeTeam: "All Boys",
    awayTeam: "Nueva Chicago",
    tournamentLabel: "Argenliga · Zona 1",
    startsAt: "2026-03-31T20:15:00-03:00",
    tags: ["all", "futsal"],
  },
  {
    id: "m4",
    tournamentId: "afa-premio-b",
    homeTeam: "Argentinos Juniors",
    awayTeam: "Vélez Sarsfield",
    tournamentLabel: "AFA Futsal · Primera B · Premio",
    startsAt: "2026-04-01T18:45:00-03:00",
    tags: ["all", "futsal"],
  },
];
