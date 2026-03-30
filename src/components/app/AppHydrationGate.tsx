"use client";

import type { ReactNode } from "react";

import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useAppState } from "@/state/app-state";

export function AppHydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useAppState();
  if (!hydrated) {
    return <PageSkeleton />;
  }
  return <>{children}</>;
}
