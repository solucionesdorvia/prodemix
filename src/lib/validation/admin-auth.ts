import { z } from "zod";

export const adminLoginBodySchema = z
  .object({
    secret: z.string().min(1).max(512),
  })
  .strict();
