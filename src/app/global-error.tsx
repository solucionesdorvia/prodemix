"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[#f7f8fa] px-4 text-center text-[#111827] antialiased">
        <p className="text-lg font-semibold">Algo salió mal</p>
        <p className="max-w-sm text-sm text-[#6b7280]">
          Podés recargar la página o volver a intentar más tarde.
        </p>
      </body>
    </html>
  );
}
