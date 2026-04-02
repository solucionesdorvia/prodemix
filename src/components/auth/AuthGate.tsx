"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  const skipAuth = pathname.startsWith("/admin");
  const onboardingPath = "/onboarding/username";
  const needsUsername =
    status === "authenticated" &&
    !session?.user?.username &&
    pathname !== onboardingPath;

  useEffect(() => {
    if (skipAuth) return;
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [skipAuth, status, router]);

  useEffect(() => {
    if (skipAuth) return;
    if (status !== "authenticated") return;
    if (session?.user?.username) return;
    if (pathname === onboardingPath) return;
    router.replace(onboardingPath);
  }, [skipAuth, status, session?.user?.username, pathname, router]);

  if (skipAuth) {
    return children;
  }

  if (status === "loading") {
    return <PageSkeleton />;
  }
  if (status === "unauthenticated") {
    return null;
  }
  if (needsUsername) {
    return <PageSkeleton />;
  }
  return children;
}
