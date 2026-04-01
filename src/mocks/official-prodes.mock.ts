/**
 * Prodes oficiales de la plataforma (curados). Mock hasta conectar API.
 */

import type { StoredProde } from "@/state/types";

import { PRIMERA_TOURNAMENT_CATALOGUE } from "@/mocks/catalog/primera-catalog";

export type OfficialProdeStatus = "open" | "closed" | "live" | "finished";

export type OfficialProdeListItem = {
  id: string;
  /** Título corto para cards: "AFA Futsal A · Fecha 1" */
  title: string;
  tournamentId: string;
  tournamentName: string;
  matchdayLabel: string;
  status: OfficialProdeStatus;
  prizeArs: number;
  participants: number;
  /** Texto tipo "Hoy · 21:00" */
  deadlineLabel: string;
  closesAt: string;
  /** Destacado en hub (solo uno) */
  featured: boolean;
};

const PLATFORM_IDS = [
  "afa-premio-a",
  "afa-premio-b",
  "afa-premio-c",
  "joma-honor-a-primera",
  "argenliga-zona-1",
  "argenliga-zona-2",
] as const;

const DISPLAY_NAME: Record<string, string> = {
  "afa-premio-a": "AFA Futsal A",
  "afa-premio-b": "AFA Futsal B",
  "afa-premio-c": "AFA Futsal C",
  "joma-honor-a-primera": "Futsal A · Joma Honor",
  "argenliga-zona-1": "Argenliga Z1",
  "argenliga-zona-2": "Argenliga Z2",
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildList(): OfficialProdeListItem[] {
  const out: OfficialProdeListItem[] = [];
  for (const tid of PLATFORM_IDS) {
    const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === tid);
    if (!t || t.matchdays.length === 0) continue;
    const md = t.matchdays[0];
    const seed = hashSeed(tid);
    const participants = 180 + (seed % 400);
    const prizeArs = 100_000;
    const status: OfficialProdeStatus =
      md.status === "open"
        ? "open"
        : md.status === "closed"
          ? "closed"
          : md.status === "completed"
            ? "finished"
            : "open";
    const closesAt =
      t.matches[0]?.startsAt ?? new Date(Date.now() + 86400000).toISOString();
    const id = `official-${tid}-f1`;
    const tname = DISPLAY_NAME[tid] ?? t.shortName;
    out.push({
      id,
      tournamentId: tid,
      tournamentName: tname,
      matchdayLabel: md.name,
      title: `${tname} · ${md.name}`,
      status,
      prizeArs,
      participants,
      deadlineLabel: "Cierra · próx. horario",
      closesAt,
      featured: tid === "afa-premio-a",
    });
  }
  return out;
}

let cached: OfficialProdeListItem[] | null = null;

export function getOfficialProdesList(): OfficialProdeListItem[] {
  if (!cached) cached = buildList();
  return cached;
}

export function getOfficialProdeListItemById(
  id: string,
): OfficialProdeListItem | undefined {
  return getOfficialProdesList().find((p) => p.id === id);
}

/** Match ids del prode oficial (primera fecha del torneo). */
export function getOfficialProdeMatchIds(id: string): string[] {
  const item = getOfficialProdeListItemById(id);
  if (!item) return [];
  const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === item.tournamentId);
  if (!t || t.matchdays.length === 0) return [];
  const md = t.matchdays[0];
  return t.matches.filter((m) => m.matchdayId === md.id).map((m) => m.id);
}

/** Resuelve un prode oficial como `StoredProde` para pantalla de detalle / pronósticos. */
export function getStoredProdeFromOfficialOrNull(id: string): StoredProde | null {
  const meta = getOfficialProdeListItemById(id);
  if (!meta) return null;
  const matchIds = getOfficialProdeMatchIds(id);
  return {
    id: meta.id,
    ownerId: "platform",
    name: meta.title,
    visibility: "public",
    createdAt: "2026-01-01T12:00:00.000Z",
    inviteCode: "OFFICIAL",
    tournamentIds: [meta.tournamentId],
    matchIds,
  };
}
