import { z } from "zod";

export const adminTournamentCreateSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(80).default("liga"),
  isActive: z.boolean().optional(),
});

export const adminTournamentPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export const adminTeamCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
  logoUrl: z.string().url().max(500).optional().nullable(),
});

export const adminTeamPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  logoUrl: z.string().url().max(500).nullable().optional(),
});

export const adminMatchdayCreateSchema = z.object({
  externalKey: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  roundNumber: z.number().int().min(0).max(999),
  startsAt: z.string().datetime(),
  closesAt: z.string().datetime(),
});

export const adminMatchCreateSchema = z.object({
  matchdayId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  startsAt: z.string().datetime(),
});

export const adminMatchPatchSchema = z.object({
  startsAt: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELLED", "POSTPONED"]).optional(),
  homeScore: z.number().int().min(0).max(99).nullable().optional(),
  awayScore: z.number().int().min(0).max(99).nullable().optional(),
});

const prodePoolType = z.enum(["FREE", "ELITE"]);
const prodeLifecycle = z.enum(["DRAFT", "OPEN", "CLOSED", "FINALIZED", "CANCELLED"]);
const prodeVisibility = z.enum(["PUBLIC", "PRIVATE"]);

export const adminProdeCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  type: prodePoolType.default("FREE"),
  seasonLabel: z.string().max(120).optional().nullable(),
  closesAt: z.string().datetime(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  prizeFirstArs: z.number().int().min(0).optional().nullable(),
  prizeSecondArs: z.number().int().min(0).optional().nullable(),
  prizeThirdArs: z.number().int().min(0).optional().nullable(),
  entryFeeArs: z.number().int().min(0).optional(),
  status: prodeLifecycle.default("DRAFT"),
  visibility: prodeVisibility.default("PUBLIC"),
  tournamentId: z.string().optional().nullable(),
});

export const adminProdePatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(120).optional(),
  type: prodePoolType.optional(),
  seasonLabel: z.string().max(120).nullable().optional(),
  closesAt: z.string().datetime().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  prizeFirstArs: z.number().int().min(0).nullable().optional(),
  prizeSecondArs: z.number().int().min(0).nullable().optional(),
  prizeThirdArs: z.number().int().min(0).nullable().optional(),
  entryFeeArs: z.number().int().min(0).optional(),
  status: prodeLifecycle.optional(),
  visibility: prodeVisibility.optional(),
});

export const adminProdeLinkMatchSchema = z.object({
  matchId: z.string().min(1),
});

export const adminProdeLinkTournamentSchema = z.object({
  tournamentId: z.string().min(1),
});

export const adminUserPatchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  bannedAt: z.string().datetime().nullable().optional(),
});
