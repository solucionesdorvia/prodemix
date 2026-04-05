import type { Metadata } from "next";

import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recibí un enlace por correo para restablecer tu contraseña.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
