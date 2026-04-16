import { z } from "zod";

export const supportContactBodySchema = z.object({
  prodeId: z.string().min(1),
  kind: z.enum(["prize", "error"]),
  message: z.string().trim().min(10).max(4000),
});

export type SupportContactBody = z.infer<typeof supportContactBodySchema>;
