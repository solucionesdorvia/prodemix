import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Establecé una nueva contraseña para tu cuenta.",
  robots: { index: false, follow: false },
};

function ResetFallback() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
      <p className="text-center text-[13px] text-app-muted">Cargando…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
