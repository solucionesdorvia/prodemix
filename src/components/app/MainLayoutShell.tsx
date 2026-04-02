"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app/AppShell";

/** El panel `/admin` no usa bottom nav ni shell móvil. */
export function MainLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
