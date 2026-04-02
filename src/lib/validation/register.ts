import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().trim().email("Email inválido.").max(320),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña es demasiado larga."),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
