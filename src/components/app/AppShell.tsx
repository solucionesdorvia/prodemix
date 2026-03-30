"use client";

import type { ReactNode } from "react";

import { AppBottomNav } from "@/components/app/AppBottomNav";
import { AppHydrationGate } from "@/components/app/AppHydrationGate";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <div
        className={cn(
          "safe-pb-nav mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 pt-3",
          className,
        )}
      >
        <AppHydrationGate>{children}</AppHydrationGate>
      </div>
      <AppBottomNav />
    </div>
  );
}
