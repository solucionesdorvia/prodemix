import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppProviders } from "@/components/app/AppProviders";
import { AppShell } from "@/components/app/AppShell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </AuthGate>
  );
}
