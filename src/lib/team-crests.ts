/**
 * Escudos: Honor A locales, Argenliga A (`public/escudos/argenliga-a`), Wikimedia.
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

const CREST_KEY_ALIASES: Record<string, string> = {
  "amigos (vl)": "amigos de villa luro",
};

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

/**
 * Argenliga (fixtures `argenliga-zona-*-rounds.json`).
 * Claves = `normalizeTeamKey(nombre en app)`; rutas desde assets Segundopalo 2024/2025.
 */
const ARGENLIGA_LOCAL: Record<string, string> = {
  "amigos (vl)": "/escudos/argenliga-a/2025/131_amigos-v-luro.png",
  avellaneda: "/escudos/argenliga-a/2025/141_avellaneda.png",
  "barrio nuevo": "/escudos/argenliga-a/2025/132_barrio-nvo.png",
  "bomberos (lm)": "/escudos/argenliga-a/2025/385_bomberos.png",
  bristol: "/escudos/argenliga-a/2025/415_bristol.png",
  "def. cervantes": "/escudos/argenliga-a/2024/147_cervantes.png",
  "defensores (sl)": "/escudos/argenliga-a/2025/153_defensores-sl.png",
  fatima: "/escudos/argenliga-a/2025/143_fatima.png",
  gon: "/escudos/argenliga-a/2025/112_gon.png",
  hurlingham: "/escudos/argenliga-a/2025/55_hurlingham.png",
  ipa: "/escudos/argenliga-a/2025/123_ipa.png",
  "la cantera": "/escudos/argenliga-a/2025/133_la-cantera.png",
  "la matanza": "/escudos/argenliga-a/2025/148_la-matanza.png",
  "los muchachos": "/escudos/argenliga-a/2025/61_los-muchachos.png",
  newells: "/escudos/argenliga-a/2024/140_newells-ba.png",
  nolting: "/escudos/argenliga-a/2025/413_nolting.png",
  "padre mugica": "/escudos/argenliga-a/2024/126_padre-mugica.png",
  quintana: "/escudos/argenliga-a/2024/383_quintana.png",
  "saenz pena": "/escudos/argenliga-a/2025/151_saenz-pena.png",
  "velez (m)": "/escudos/argenliga-a/2025/124_velez-martinez.png",
  "villa luro (n)": "/escudos/argenliga-a/2025/152_villa-luro-norte.png",
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
  let k = normalizeTeamKey(teamName);
  k = CREST_KEY_ALIASES[k] ?? k;
  const honor = HONOR_A_LOCAL[k];
  if (honor) return honor;
  const argenliga = ARGENLIGA_LOCAL[k];
  if (argenliga) return argenliga;
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
