/**
 * Prodes oficiales de la plataforma (curados). Mock hasta conectar API.
 * Solo AFA Futsal A / B / C — categorías Gratis y Prode Élite.
 */

import type { StoredProde } from "@/state/types";

import { PRIMERA_TOURNAMENT_CATALOGUE } from "@/mocks/catalog/primera-catalog";

export type OfficialProdeStatus = "open" | "closed" | "live" | "finished";

export type OfficialProdeCategory = "gratis" | "elite";

export type OfficialPrizeTiers = {
  first: number;
  second: number;
  third: number;
};

export type OfficialProdeListItem = {
  id: string;
  title: string;
  tournamentId: string;
  tournamentName: string;
  matchdayLabel: string;
  category: OfficialProdeCategory;
  /** Ingreso en pesos (0 = gratis). */
  entryFeeArs: number;
  /** Podio en pesos. */
  prizes: OfficialPrizeTiers;
  /** Para titulares tipo “Ganá hasta $…” */
  headlinePrizeArs: number;
  status: OfficialProdeStatus;
  participants: number;
  closesAt: string;
  /** Destacado: primer Prode Élite (AFA A). */
  featured: boolean;
  scarcityHint: boolean;
};

const AFA_IDS = ["afa-premio-a", "afa-premio-b", "afa-premio-c"] as const;

const DISPLAY_NAME: Record<string, string> = {
  "afa-premio-a": "AFA Futsal A",
  "afa-premio-b": "AFA Futsal B",
  "afa-premio-c": "AFA Futsal C",
};

const GRATIS_PRIZES: OfficialPrizeTiers = {
  first: 10_000,
  second: 7_500,
  third: 5_000,
};

const ELITE_PRIZES: OfficialPrizeTiers = {
  first: 75_000,
  second: 20_000,
  third: 10_000,
};

const ELITE_ENTRY = 5_000;

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildList(): OfficialProdeListItem[] {
  const out: OfficialProdeListItem[] = [];

  for (const tid of AFA_IDS) {
    const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === tid);
    if (!t || t.matchdays.length === 0) continue;
    const md = t.matchdays[0];
    const seed = hashSeed(tid);
    const tname = DISPLAY_NAME[tid] ?? t.shortName;

    const status: OfficialProdeStatus =
      md.status === "open"
        ? "open"
        : md.status === "closed"
          ? "closed"
          : md.status === "completed"
            ? "finished"
            : "open";

    const base = {
      tournamentId: tid,
      tournamentName: tname,
      matchdayLabel: md.name,
      title: `${tname} · ${md.name}`,
      status,
      closesAt: md.closesAt,
      scarcityHint: seed % 5 === 0 || seed % 5 === 2,
    };

    const participantsGratis = 220 + (seed % 380);
    const participantsElite = 85 + (seed % 120);

    out.push({
      ...base,
      id: `official-gratis-${tid}-f1`,
      category: "gratis",
      entryFeeArs: 0,
      prizes: { ...GRATIS_PRIZES },
      headlinePrizeArs: GRATIS_PRIZES.first,
      participants: participantsGratis,
      featured: false,
    });

    const isEliteFeatured = tid === "afa-premio-a";

    out.push({
      ...base,
      id: `official-elite-${tid}-f1`,
      category: "elite",
      entryFeeArs: ELITE_ENTRY,
      prizes: { ...ELITE_PRIZES },
      headlinePrizeArs: ELITE_PRIZES.first,
      participants: participantsElite,
      featured: isEliteFeatured,
    });
  }

  return out;
}

let cached: OfficialProdeListItem[] | null = null;

export function getOfficialProdesList(): OfficialProdeListItem[] {
  if (!cached) cached = buildList();
  return cached;
}

export function getOfficialProdesGratis(): OfficialProdeListItem[] {
  return getOfficialProdesList().filter((p) => p.category === "gratis");
}

export function getOfficialProdesElite(): OfficialProdeListItem[] {
  return getOfficialProdesList().filter((p) => p.category === "elite");
}

export function getOfficialProdeListItemById(
  id: string,
): OfficialProdeListItem | undefined {
  return getOfficialProdesList().find((p) => p.id === id);
}

export function getOfficialProdeMatchIds(id: string): string[] {
  const item = getOfficialProdeListItemById(id);
  if (!item) return [];
  const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === item.tournamentId);
  if (!t || t.matchdays.length === 0) return [];
  const md = t.matchdays[0];
  return t.matches.filter((m) => m.matchdayId === md.id).map((m) => m.id);
}

export function getStoredProdeFromOfficialOrNull(id: string): StoredProde | null {
  const meta = getOfficialProdeListItemById(id);
  if (!meta) return null;
  const matchIds = getOfficialProdeMatchIds(id);
  const tier = meta.category === "elite" ? "Élite" : "Gratis";
  return {
    id: meta.id,
    ownerId: "platform",
    name: `${meta.title} · ${tier}`,
    visibility: "public",
    createdAt: "2026-01-01T12:00:00.000Z",
    inviteCode: "OFFICIAL",
    tournamentIds: [meta.tournamentId],
    matchIds,
  };
}
