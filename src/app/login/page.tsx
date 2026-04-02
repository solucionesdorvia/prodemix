import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accedé a ProdeMix.",
};

function LoginFallback() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
      <p className="text-center text-[13px] text-app-muted">Cargando…</p>
    </div>
  );
}

export default function LoginPage() {
  const googleOAuthEnabled =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginScreen googleOAuthEnabled={googleOAuthEnabled} />
    </Suspense>
  );
}
