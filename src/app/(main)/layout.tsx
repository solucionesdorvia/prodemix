import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppProviders } from "@/components/app/AppProviders";
import { MainLayoutShell } from "@/components/app/MainLayoutShell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppProviders>
        <MainLayoutShell>{children}</MainLayoutShell>
      </AppProviders>
    </AuthGate>
  );
}
