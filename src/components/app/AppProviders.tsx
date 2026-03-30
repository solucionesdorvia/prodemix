"use client";

import type { ReactNode } from "react";

import { OnboardingHost } from "@/components/onboarding/OnboardingHost";
import { AppStateProvider } from "@/state/app-state";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      {children}
      <OnboardingHost />
    </AppStateProvider>
  );
}
