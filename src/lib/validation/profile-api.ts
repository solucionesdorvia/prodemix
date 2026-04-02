import { z } from "zod";

const MAX_NAME = 120;

export const profileNotificationPrefsSchema = z.object({
  remindersEnabled: z.boolean(),
  closingAlertEnabled: z.boolean(),
});

export const profilePatchBodySchema = z
  .object({
    name: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.union([z.string().min(2).max(MAX_NAME), z.null()]).optional(),
    ),
    username: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1).max(64).optional(),
    ),
    image: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.union([z.string().max(2048), z.null()]).optional(),
    ),
    notificationPreferences: profileNotificationPrefsSchema.optional(),
  })
  .strict();

export type ProfilePatchBody = z.infer<typeof profilePatchBodySchema>;
