import { AFA_FUTSAL_ESCUDOS } from "./afa-futsal-crests";

/**
 * Escudos: AFA Futsal (Primera A/B/C). Libre = sin imagen (fecha libre).
 */

export function normalizeTeamKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function isLibreTeam(name: string): boolean {
  return normalizeTeamKey(name) === "libre";
}

const CREST_KEY_ALIASES: Record<string, string> = {
  "newell's": "newells",
  /** Paren La Pelota / tablas abreviadas. */
  "juv tapiales": "juventud tapiales",
  "dep moron": "deportivo moron",
  "dep merlo": "deportivo merlo",
  "nva. chicago": "nueva chicago",
};

export function getTeamCrestUrl(teamName: string): string | undefined {
  if (isLibreTeam(teamName)) return undefined;
  let k = normalizeTeamKey(teamName);
  k = CREST_KEY_ALIASES[k] ?? k;
  return AFA_FUTSAL_ESCUDOS[k];
}

const SKIP_WORD = /^(de|del|y|la|las|los|el)$/i;

/** Iniciales para el fallback (2 caracteres máx.). */
export function teamInitials(teamName: string): string {
  if (isLibreTeam(teamName)) return "—";
  const parts = teamName
    .trim()
    .split(/\s+/)
    .filter((p) => p && !SKIP_WORD.test(p));
  if (parts.length >= 2) {
    const a = parts[0]!.match(/\p{L}/u)?.[0] ?? parts[0]![0] ?? "";
    const b =
      parts[parts.length - 1]!.match(/\p{L}/u)?.[0] ??
      parts[parts.length - 1]![0] ??
      "";
    const pair = (a + b).toUpperCase();
    if (pair.length >= 2) return pair.slice(0, 2);
  }
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return teamName.slice(0, 2).toUpperCase();
}
