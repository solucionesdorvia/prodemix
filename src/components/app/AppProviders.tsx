"use client";

import type { ReactNode } from "react";

import { CatalogueRefreshProvider } from "@/components/app/CatalogueRefreshContext";
import { PersistToastHost } from "@/components/app/PersistToastHost";
import { OnboardingHost } from "@/components/onboarding/OnboardingHost";
import { AppStateProvider } from "@/state/app-state";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <CatalogueRefreshProvider>
        {children}
        <OnboardingHost />
        <PersistToastHost />
      </CatalogueRefreshProvider>
    </AppStateProvider>
  );
}
