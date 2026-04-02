"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status, update } = useSession();
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

  /**
   * Si el username ya está en la DB pero la sesión cliente no lo tiene (refresh tras
   * guardar, callback de sesión sin DB un instante, etc.), alineamos con GET /api/me/profile.
   */
  useEffect(() => {
    if (skipAuth) return;
    if (status !== "authenticated") return;
    if (session?.user?.username) return;
    if (pathname === onboardingPath) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/profile");
        if (cancelled) return;
        if (!res.ok) {
          router.replace(onboardingPath);
          return;
        }
        const data = (await res.json()) as {
          profile?: { username?: string | null };
        };
        const un = data.profile?.username?.trim();
        if (un) {
          await update();
          return;
        }
        router.replace(onboardingPath);
      } catch {
        if (!cancelled) router.replace(onboardingPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    skipAuth,
    status,
    session?.user?.username,
    pathname,
    router,
    update,
  ]);

  if (skipAuth) {
    return children;
  }

  if (status === "loading") {
    return <PageSkeleton />;
  }
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app-bg px-4">
        <p className="text-center text-[13px] text-app-muted">
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }
  if (needsUsername) {
    return <PageSkeleton />;
  }
  return children;
}
