import { z } from "zod";

export const profileNotificationPrefsSchema = z.object({
  remindersEnabled: z.boolean(),
  closingAlertEnabled: z.boolean(),
});

export const profilePatchBodySchema = z
  .object({
    /** Solo para quitar foto subida / OAuth desde el servidor (no editar URL a mano). */
    image: z.null().optional(),
    notificationPreferences: profileNotificationPrefsSchema.optional(),
  })
  .strict()
  .refine(
    (o) => o.image !== undefined || o.notificationPreferences !== undefined,
    { message: "Se requiere al menos un cambio." },
  );

export type ProfilePatchBody = z.infer<typeof profilePatchBodySchema>;
