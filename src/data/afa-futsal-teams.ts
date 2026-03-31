/**
 * Nombres de equipos alineados con tablas públicas AFA Futsal 2026
 * (referencia: [Segundo Palo](https://www.segundopalo.com) — competencias AFA Primera A/B/C).
 *
 * Fixtures 2026 (34 fechas c/u) desde [Paren La Pelota](https://parenlapelotafutsal.com.ar):
 * `plp-primera-a-fixture-2026.json` · [Primera A](https://parenlapelotafutsal.com.ar/primeraA/primera),
 * `plp-primera-b-fixture-2026.json` · [Primera B](https://parenlapelotafutsal.com.ar/primeraB/primera),
 * `plp-primera-c-fixture-2026.json` · [Primera C](https://parenlapelotafutsal.com.ar/primeraC/primera).
 * Firestore: `fixtures-2026-primera-{a|b|c}` / `fecha-{n}-primera`. Script: `scripts/fetch-plp-primera-fixture.py`.
 */

export const AFA_PRIMERA_A_TEAMS = [
  "17 de Agosto",
  "América del Sud",
  "Barracas Central",
  "Boca Juniors",
  "Camioneros",
  "Estrella de Boedo",
  "Estudiantes Porteño",
  "Ferro Carril Oeste",
  "Glorias de Tigre",
  "Hebraica",
  "Independiente",
  "Jorge Newbery",
  "Kimberley",
  "Newell's",
  "Pinocho",
  "Racing Club",
  "River Plate",
  "San Lorenzo",
] as const;

export const AFA_PRIMERA_B_TEAMS = [
  "Alvear",
  "Argentinos Juniors",
  "Arsenal",
  "Atlanta",
  "Banfield",
  "Chacarita",
  "Country",
  "Franja de Oro",
  "Gimnasia LP",
  "Metalúrgico",
  "Mirinaque",
  "Nueva Chicago",
  "Nueva Estrella",
  "Pacífico",
  "Platense",
  "SECLA",
  "Vélez Sarsfield",
  "Villa La Ñata",
] as const;

export const AFA_PRIMERA_C_TEAMS = [
  "25 de Mayo",
  "Almafuerte",
  "Asturiano",
  "CIDECO",
  "Deportivo Merlo",
  "Deportivo Morón",
  "El Talar",
  "Estrella Maldonado",
  "Excursionistas",
  "GEVS",
  "Juventud Tapiales",
  "Libertadores",
  "Primera Junta",
  "Rosario Central",
  "UNLAM",
  "Villa Heredia",
  "Villa Malcolm",
  "Villa Modelo",
] as const;

export type AfaDivisionId = "afa-primera-a" | "afa-primera-b" | "afa-primera-c";

export const AFA_DIVISION_TEAMS: Record<
  AfaDivisionId,
  readonly string[]
> = {
  "afa-primera-a": AFA_PRIMERA_A_TEAMS,
  "afa-primera-b": AFA_PRIMERA_B_TEAMS,
  "afa-primera-c": AFA_PRIMERA_C_TEAMS,
};
