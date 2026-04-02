"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

import { ProdesDetailLegacyClient } from "./ProdesDetailLegacyClient";
import { ProdesDetailServerView } from "./ProdesDetailServerView";

type ProdesDetailClientProps = {
  prodeId: string;
};

/**
 * Si hay sesión y el prode existe en el backend, usa persistencia en servidor.
 * Si no, mantiene el flujo local (StoredProde + localStorage).
 */
export function ProdesDetailClient({ prodeId }: ProdesDetailClientProps) {
  const { hydrated, loggedIn } = useAuth();
  const [mode, setMode] = useState<"loading" | "server" | "legacy">("loading");

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn) {
      setMode("legacy");
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/prodes/${encodeURIComponent(prodeId)}`,
        { credentials: "include" },
      );
      if (cancelled) return;
      setMode(res.ok ? "server" : "legacy");
    })();
    return () => {
      cancelled = true;
    };
  }, [prodeId, hydrated, loggedIn]);

  if (!hydrated || mode === "loading") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-2 px-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-app-border border-t-app-primary"
          aria-hidden
        />
        <p className="text-[12px] font-medium text-app-muted">Cargando prode…</p>
      </div>
    );
  }

  if (mode === "server") {
    return <ProdesDetailServerView prodeId={prodeId} />;
  }

  return <ProdesDetailLegacyClient prodeId={prodeId} />;
}
