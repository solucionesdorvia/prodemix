"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-lg font-semibold text-app-text">Algo salió mal</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-app-primary-fg"
      >
        Reintentar
      </button>
    </div>
  );
}
