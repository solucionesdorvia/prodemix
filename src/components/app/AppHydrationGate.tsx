"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useAppState } from "@/state/app-state";

export function AppHydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useAppState();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setSlow(false);
      return;
    }
    const t = window.setTimeout(() => setSlow(true), 8_000);
    return () => window.clearTimeout(t);
  }, [hydrated]);

  if (!hydrated) {
    return (
      <>
        <PageSkeleton />
        {slow ?
          <p
            className="fixed bottom-24 left-0 right-0 z-40 mx-auto max-w-lg px-4 text-center text-[11px] leading-snug text-app-muted"
            role="status"
          >
            Cargando tu perfil local… Si tarda mucho, probá recargar la página.
          </p>
        : null}
      </>
    );
  }
  return <>{children}</>;
}
