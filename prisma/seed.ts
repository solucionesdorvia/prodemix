/**
 * Seed production-like data: AFA Primera A/B/C Premio (tournaments, teams, matchdays, matches, prodes).
 * Run: npx prisma db seed  (requires DATABASE_URL, e.g. Neon)
 */
import "dotenv/config";

import type { Match as DomainMatch, Matchday } from "../src/domain";
import { deriveMatchdaysFromMatches } from "../src/mocks/catalog/matchdays";
import { buildPlaPremioMatches } from "../src/mocks/fixtures/plp-afa-premio";
import { getPrisma } from "../src/lib/prisma";
import type {
  MatchdayStatus as PrismaMatchdayStatus,
  ProdeLifecycleStatus,
} from "../src/generated/prisma/client";

function slugify(name: string): string {
  const t = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return t || "equipo";
}

function mdStatusToPrisma(s: Matchday["status"]): PrismaMatchdayStatus {
  if (s === "closed") return "CLOSED";
  if (s === "completed") return "COMPLETED";
  return "OPEN";
}

function prodeLifecycleFromMatchday(
  s: Matchday["status"],
): ProdeLifecycleStatus {
  if (s === "completed") return "FINALIZED";
  if (s === "closed") return "CLOSED";
  return "OPEN";
}

const PRIZE = { first: 30_000, second: 20_000, third: 10_000 } as const;

const TOURNAMENTS = [
  {
    id: "afa-premio-a",
    name: "AFA Futsal · Primera A · Premio",
    division: "a" as const,
    label: "A",
  },
  {
    id: "afa-premio-b",
    name: "AFA Futsal · Primera B · Premio",
    division: "b" as const,
    label: "B",
  },
  {
    id: "afa-premio-c",
    name: "AFA Futsal · Primera C · Premio",
    division: "c" as const,
    label: "C",
  },
];

async function seedTournament(
  prisma: ReturnType<typeof getPrisma>,
  def: (typeof TOURNAMENTS)[number],
) {
  const matches: DomainMatch[] = buildPlaPremioMatches(def.division, def.id);
  const matchdays = deriveMatchdaysFromMatches(def.id, matches);

  await prisma.tournament.upsert({
    where: { id: def.id },
    create: {
      id: def.id,
      slug: def.id,
      name: def.name,
      category: "futsal",
      isActive: true,
    },
    update: {
      name: def.name,
      isActive: true,
    },
  });

  const teamNameToId = new Map<string, string>();
  const teamNames = new Set<string>();
  for (const m of matches) {
    teamNames.add(m.homeTeam);
    teamNames.add(m.awayTeam);
  }

  const usedSlugs = new Set<string>();
  for (const name of teamNames) {
    const base = slugify(name);
    let slug = base;
    let n = 0;
    while (usedSlugs.has(slug)) {
      n += 1;
      slug = `${base}-${n}`;
    }
    usedSlugs.add(slug);

    const team = await prisma.team.upsert({
      where: {
        tournamentId_slug: { tournamentId: def.id, slug },
      },
      create: {
        tournamentId: def.id,
        name,
        slug,
      },
      update: { name },
    });
    teamNameToId.set(name, team.id);
  }

  const mdExternalToRowId = new Map<string, string>();

  for (const md of matchdays) {
    const row = await prisma.matchday.upsert({
      where: { externalKey: md.id },
      create: {
        tournamentId: def.id,
        externalKey: md.id,
        name: md.name,
        roundNumber: md.roundNumber,
        startsAt: new Date(md.startsAt),
        closesAt: new Date(md.closesAt),
        status: mdStatusToPrisma(md.status),
      },
      update: {
        name: md.name,
        roundNumber: md.roundNumber,
        startsAt: new Date(md.startsAt),
        closesAt: new Date(md.closesAt),
        status: mdStatusToPrisma(md.status),
      },
    });
    mdExternalToRowId.set(md.id, row.id);
  }

  for (const m of matches) {
    const mdKey = m.matchdayId;
    if (!mdKey) continue;
    const matchdayId = mdExternalToRowId.get(mdKey);
    if (!matchdayId) continue;

    await prisma.match.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        tournamentId: def.id,
        matchdayId,
        homeTeamId: teamNameToId.get(m.homeTeam)!,
        awayTeamId: teamNameToId.get(m.awayTeam)!,
        startsAt: new Date(m.startsAt),
        status: "SCHEDULED",
      },
      update: {
        startsAt: new Date(m.startsAt),
        homeTeamId: teamNameToId.get(m.homeTeam)!,
        awayTeamId: teamNameToId.get(m.awayTeam)!,
      },
    });
  }

  for (const md of matchdays) {
    const prodeId = `pool-${md.id}`;
    await prisma.prode.upsert({
      where: { id: prodeId },
      create: {
        id: prodeId,
        slug: prodeId,
        title: `Premio · ${def.label} · ${md.name}`,
        type: "ELITE",
        seasonLabel: "2026",
        prizeFirstArs: PRIZE.first,
        prizeSecondArs: PRIZE.second,
        prizeThirdArs: PRIZE.third,
        entryFeeArs: 0,
        status: prodeLifecycleFromMatchday(md.status),
        closesAt: new Date(md.closesAt),
        startsAt: new Date(md.startsAt),
        visibility: "PUBLIC",
      },
      update: {
        title: `Premio · ${def.label} · ${md.name}`,
        status: prodeLifecycleFromMatchday(md.status),
        closesAt: new Date(md.closesAt),
        startsAt: new Date(md.startsAt),
      },
    });

    await prisma.prodeTournament.upsert({
      where: {
        prodeId_tournamentId: { prodeId, tournamentId: def.id },
      },
      create: { prodeId, tournamentId: def.id },
      update: {},
    });

    const inMd = matches.filter((x) => x.matchdayId === md.id);
    await prisma.prodeMatch.deleteMany({ where: { prodeId } });
    if (inMd.length > 0) {
      await prisma.prodeMatch.createMany({
        data: inMd.map((x) => ({ prodeId, matchId: x.id })),
      });
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for seeding.");
  }
  const prisma = getPrisma();
  for (const t of TOURNAMENTS) {
    await seedTournament(prisma, t);
  }
  console.log("Seed OK: AFA Premio A/B/C (tournaments, teams, matchdays, matches, prodes).");
}

main()
  .then(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    const prisma = getPrisma();
    await prisma.$disconnect();
    process.exit(1);
  });
