/**
 * Escudos: primero assets locales (`public/escudos/honor-a`), luego Wikimedia.
 * Libre = sin imagen (fecha libre).
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

/** Liga Honor A — PNG en repo (`public/escudos/honor-a/`). */
const HONOR_A_LOCAL: Record<string, string> = {
  "17 de agosto": "/escudos/honor-a/17-de-agosto.png",
  "amigos de villa luro": "/escudos/honor-a/amigos-de-villa-luro.png",
  arquitectura: "/escudos/honor-a/arquitectura.png",
  banfield: "/escudos/honor-a/banfield.png",
  "boca juniors": "/escudos/honor-a/boca-juniors.png",
  "centro espanol": "/escudos/honor-a/centro-espanol.png",
  "circulo general belgrano": "/escudos/honor-a/circulo-general-belgrano.png",
  "estrella federal": "/escudos/honor-a/estrella-federal.png",
  "ferro carril oeste": "/escudos/honor-a/ferro-carril-oeste.png",
  "general san martin": "/escudos/honor-a/general-san-martin.png",
  glorias: "/escudos/honor-a/glorias.png",
  "haedo futsal": "/escudos/honor-a/haedo-futsal.png",
  "independiente (c)": "/escudos/honor-a/independiente.png",
  independiente: "/escudos/honor-a/independiente.png",
  kimberley: "/escudos/honor-a/kimberley.png",
  pacifico: "/escudos/honor-a/pacifico.png",
  pinocho: "/escudos/honor-a/pinocho.png",
  platense: "/escudos/honor-a/platense.png",
};

/** Otros torneos / equipos no cargados en honor-a (Commons). */
const CREST_URL_BY_KEY: Record<string, string> = {
  "racing club":
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/Escudo_del_Racing_Club_de_Avellaneda.svg",
  "river plate":
    "https://upload.wikimedia.org/wikipedia/commons/2/21/Escudo_del_Club_Atl%C3%A9tico_River_Plate_%281998-2006%29.svg",
  "san lorenzo":
    "https://upload.wikimedia.org/wikipedia/commons/7/77/Escudo_del_Club_Atl%C3%A9tico_San_Lorenzo_de_Almagro.svg",
};

export function getTeamCrestUrl(teamName: string): string | undefined {
  if (isLibreTeam(teamName)) return undefined;
  const k = normalizeTeamKey(teamName);
  const local = HONOR_A_LOCAL[k];
  if (local) return local;
  return CREST_URL_BY_KEY[k];
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
