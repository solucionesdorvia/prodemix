"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { PageSkeleton } from "@/components/ui/PageSkeleton";

import { useAuth } from "./AuthProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hydrated, loggedIn } = useAuth();
  const router = useRouter();

  const skipAuth = pathname.startsWith("/admin");

  useEffect(() => {
    if (skipAuth) return;
    if (!hydrated) return;
    if (!loggedIn) router.replace("/login");
  }, [skipAuth, hydrated, loggedIn, router]);

  if (skipAuth) {
    return children;
  }

  if (!hydrated) {
    return <PageSkeleton />;
  }
  if (!loggedIn) {
    return null;
  }
  return children;
}
