import { config } from "dotenv";
import { resolve } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env") });
if (!process.env.PRODEMIX_SKIP_ENV_LOCAL) {
  config({ path: resolve(process.cwd(), ".env.local"), override: true });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for seeding");
  }

  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const userCreator = await prisma.user.upsert({
    where: { email: "creador@prodemix.demo" },
    update: {},
    create: {
      id: "seed_user_creator",
      name: "Creador Demo",
      email: "creador@prodemix.demo",
    },
  });

  const userPlayer = await prisma.user.upsert({
    where: { email: "jugador@prodemix.demo" },
    update: {},
    create: {
      id: "seed_user_player",
      name: "Jugador Demo",
      email: "jugador@prodemix.demo",
    },
  });

  const tA = await prisma.tournament.upsert({
    where: { id: "seed_tournament_a" },
    update: {},
    create: {
      id: "seed_tournament_a",
      name: "AFA Futsal A",
      category: "A",
      sport: "futsal",
      isActive: true,
    },
  });

  const tB = await prisma.tournament.upsert({
    where: { id: "seed_tournament_b" },
    update: {},
    create: {
      id: "seed_tournament_b",
      name: "AFA Futsal B",
      category: "B",
      sport: "futsal",
      isActive: true,
    },
  });

  const tC = await prisma.tournament.upsert({
    where: { id: "seed_tournament_c" },
    update: {},
    create: {
      id: "seed_tournament_c",
      name: "AFA Futsal C",
      category: "C",
      sport: "futsal",
      isActive: true,
    },
  });

  const teamsData: { id: string; name: string; tournamentId: string }[] = [
    { id: "seed_team_a1", name: "Boca Juniors FS", tournamentId: tA.id },
    { id: "seed_team_a2", name: "River Plate FS", tournamentId: tA.id },
    { id: "seed_team_b1", name: "Racing FS", tournamentId: tB.id },
    { id: "seed_team_b2", name: "San Lorenzo FS", tournamentId: tB.id },
    { id: "seed_team_c1", name: "All Boys FS", tournamentId: tC.id },
    { id: "seed_team_c2", name: "Ferro FS", tournamentId: tC.id },
  ];

  for (const t of teamsData) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  const future = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const matchesData = [
    {
      id: "seed_match_1",
      tournamentId: tA.id,
      homeTeamId: "seed_team_a1",
      awayTeamId: "seed_team_a2",
      matchDate: future(3),
    },
    {
      id: "seed_match_2",
      tournamentId: tB.id,
      homeTeamId: "seed_team_b1",
      awayTeamId: "seed_team_b2",
      matchDate: future(4),
    },
    {
      id: "seed_match_3",
      tournamentId: tC.id,
      homeTeamId: "seed_team_c1",
      awayTeamId: "seed_team_c2",
      matchDate: future(5),
    },
  ];

  for (const m of matchesData) {
    await prisma.match.upsert({
      where: { id: m.id },
      update: {},
      create: {
        ...m,
        status: "scheduled",
      },
    });
  }

  const prode = await prisma.prode.upsert({
    where: { id: "seed_prode_demo" },
    update: {},
    create: {
      id: "seed_prode_demo",
      name: "Prode demo — multi-torneo",
      isPublic: true,
      entryPrice: 0,
      prizePool: 100_000,
      createdByUserId: userCreator.id,
    },
  });

  for (const mid of ["seed_match_1", "seed_match_2", "seed_match_3"]) {
    await prisma.prodeMatch.upsert({
      where: {
        prodeId_matchId: { prodeId: prode.id, matchId: mid },
      },
      update: {},
      create: { prodeId: prode.id, matchId: mid },
    });
  }

  await prisma.prodeParticipant.upsert({
    where: {
      prodeId_userId: { prodeId: prode.id, userId: userCreator.id },
    },
    update: {},
    create: { prodeId: prode.id, userId: userCreator.id },
  });

  await prisma.prodeParticipant.upsert({
    where: {
      prodeId_userId: { prodeId: prode.id, userId: userPlayer.id },
    },
    update: {},
    create: { prodeId: prode.id, userId: userPlayer.id },
  });

  await prisma.score.upsert({
    where: {
      userId_prodeId: { userId: userCreator.id, prodeId: prode.id },
    },
    update: {},
    create: { userId: userCreator.id, prodeId: prode.id, points: 0 },
  });

  await prisma.score.upsert({
    where: {
      userId_prodeId: { userId: userPlayer.id, prodeId: prode.id },
    },
    update: {},
    create: { userId: userPlayer.id, prodeId: prode.id, points: 0 },
  });

  console.log("Seed OK:", {
    users: [userCreator.email, userPlayer.email],
    tournaments: [tA.name, tB.name, tC.name],
    prodeId: prode.id,
    matchIds: matchesData.map((m) => m.id),
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
