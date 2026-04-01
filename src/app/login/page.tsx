import type { Metadata } from "next";

import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accedé a ProdeMix.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
