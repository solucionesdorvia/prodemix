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
    tournamentId: "tournament-liga-nunez",
    homeTeam: "Deportivo Núñez",
    awayTeam: "Atlético Colegiales",
    tournamentLabel: "Liga Núñez · Clausura",
    startsAt: "2026-03-30T21:00:00-03:00",
    tags: ["all", "nunez"],
  },
  {
    id: "m3",
    tournamentId: "tournament-barrial-caballito",
    homeTeam: "Unión Caballito",
    awayTeam: "San Lorenzo del Barrio",
    tournamentLabel: "Torneo Barrial Caballito",
    startsAt: "2026-03-31T20:15:00-03:00",
    tags: ["all", "barrial"],
  },
  {
    id: "m4",
    tournamentId: "tournament-copa-zona-norte",
    homeTeam: "Villa Martelli FC",
    awayTeam: "Tigre Norte",
    tournamentLabel: "Copa Zona Norte · Fase 2",
    startsAt: "2026-04-01T18:45:00-03:00",
    tags: ["all", "zona-norte"],
  },
];
