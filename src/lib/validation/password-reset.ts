import { z } from "zod";

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email("Email inválido.").max(320),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(32, "Enlace inválido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña es demasiado larga."),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
