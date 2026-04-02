import { z } from "zod";

/** Route segment `[id]` — id or slug from URL. */
export const prodeRouteIdSchema = z
  .string()
  .trim()
  .min(1, "id is required")
  .max(200, "id is too long");

/** GET /api/prodes?limit= */
export const prodesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(200),
});

/** POST /api/prodes/[id]/predictions */
export const predictionsPostBodySchema = z
  .object({
    predictions: z
      .array(
        z.object({
          matchId: z.string().min(1).max(128),
          predictedHomeScore: z.number().int().min(0).max(99),
          predictedAwayScore: z.number().int().min(0).max(99),
        }),
      )
      .min(1, "predictions must contain at least one item"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < data.predictions.length; i++) {
      const mid = data.predictions[i]!.matchId;
      if (seen.has(mid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate matchId: ${mid}`,
          path: ["predictions", i, "matchId"],
        });
        return;
      }
      seen.add(mid);
    }
  });

export type PredictionsPostBody = z.infer<typeof predictionsPostBodySchema>;

/** GET /api/me/prodes?limit= */
export const meProdesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
