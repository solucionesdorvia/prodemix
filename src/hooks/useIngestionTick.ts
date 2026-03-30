"use client";

import { useEffect, useState } from "react";

import { INGESTION_UPDATED_EVENT } from "@/state/ingestion-storage";

/** Bumps when mock ingestion storage changes (same tab). */
export function useIngestionTick(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener(INGESTION_UPDATED_EVENT, h);
    return () => window.removeEventListener(INGESTION_UPDATED_EVENT, h);
  }, []);
  return v;
}
