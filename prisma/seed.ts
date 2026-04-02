/**
 * Seed production-like data: AFA Primera A/B/C Premio (tournaments, teams, matchdays, matches, prodes).
 * Run: npx prisma db seed  (requires DATABASE_URL, e.g. Neon)
 */
import "dotenv/config";

import type { Match as DomainMatch, Matchday } from "../src/domain";
import { buildPlaPremioMatches } from "../src/mocks/fixtures/plp-afa-premio";
import { PREDICTION_CLOSE_MS_BEFORE_KICKOFF } from "../src/lib/datetime";
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

/**
 * Same idea que `deriveMatchdaysFromMatches` pero sin importar mocks/catalog (evita cargar
 * media app en Node y hace el seed usable en <1 min).
 */
function deriveMatchdaysForSeed(
  tournamentId: string,
  matches: DomainMatch[],
): Matchday[] {
  const map = new Map<string, DomainMatch[]>();
  for (const m of matches) {
    if (!m.matchdayId) continue;
    if (!map.has(m.matchdayId)) map.set(m.matchdayId, []);
    map.get(m.matchdayId)!.push(m);
  }
  const ids = [...map.keys()].sort((a, b) => {
    const na = parseInt(a.split("-md-").pop() ?? "0", 10);
    const nb = parseInt(b.split("-md-").pop() ?? "0", 10);
    return na - nb;
  });
  const now = Date.now();
  return ids.map((mdId) => {
    const ms = map.get(mdId)!;
    const sorted = [...ms].sort((x, y) =>
      x.startsAt.localeCompare(y.startsAt),
    );
    const first = sorted[0]!;
    const roundNum = parseInt(mdId.split("-md-").pop() ?? "1", 10);
    const closes = new Date(first.startsAt);
    closes.setTime(closes.getTime() - PREDICTION_CLOSE_MS_BEFORE_KICKOFF);
    const kick = new Date(first.startsAt).getTime();
    const anyStarted = kick <= now;
    let status: Matchday["status"] = "open";
    if (anyStarted) status = "closed";
    return {
      id: mdId,
      tournamentId,
      name: `Fecha ${roundNum}`,
      roundNumber: roundNum,
      startsAt: first.startsAt,
      closesAt: closes.toISOString(),
      status,
    };
  });
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
  const matchdays = deriveMatchdaysForSeed(def.id, matches);

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

  const matchRows = matches.flatMap((m) => {
    const mdKey = m.matchdayId;
    if (!mdKey) return [];
    const matchdayId = mdExternalToRowId.get(mdKey);
    if (!matchdayId) return [];
    const homeTeamId = teamNameToId.get(m.homeTeam);
    const awayTeamId = teamNameToId.get(m.awayTeam);
    if (!homeTeamId || !awayTeamId) return [];
    return [
      {
        id: m.id,
        tournamentId: def.id,
        matchdayId,
        homeTeamId,
        awayTeamId,
        startsAt: new Date(m.startsAt),
        status: "SCHEDULED" as const,
      },
    ];
  });
  if (matchRows.length > 0) {
    const byId = new Map(matchRows.map((r) => [r.id, r]));
    await prisma.match.createMany({
      data: [...byId.values()],
      skipDuplicates: true,
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
