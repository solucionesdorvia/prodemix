"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  BarChart3,
  Home,
  PlusCircle,
  Trophy,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { countUnreadActivity } from "@/state/activity-unread";
import { useAppState } from "@/state/app-state";

const NAV = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/torneos", label: "Torneos", Icon: Trophy },
  { href: "/crear", label: "Crear", Icon: PlusCircle },
  { href: "/ranking", label: "Ranking", Icon: BarChart3 },
  { href: "/perfil", label: "Perfil", Icon: UserRound },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();
  const { state } = useAppState();
  const unread = useMemo(() => countUnreadActivity(state), [state]);

  return (
    <nav
      className="safe-nav-h fixed bottom-0 left-0 right-0 z-50 border-t border-app-border/90 bg-app-surface/95 shadow-nav backdrop-blur-md supports-[backdrop-filter]:bg-app-surface/88"
      aria-label="Principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5">
        {NAV.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[52px] min-w-0 flex-1 select-none flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-semibold leading-none tracking-wide transition-colors",
                active
                  ? "text-app-primary"
                  : "text-app-muted hover:text-app-text active:bg-app-border-subtle/80",
              )}
            >
              <span
                className={cn(
                  "relative flex h-9 min-h-[36px] w-[2.875rem] items-center justify-center rounded-xl transition-[transform,background-color,box-shadow]",
                  active
                    ? "bg-blue-50 text-app-primary shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
                    : "text-current",
                )}
              >
                <Icon
                  className={cn(
                    "h-[19px] w-[19px] shrink-0",
                    active ? "stroke-[2.2px]" : "stroke-[1.8px]",
                  )}
                  aria-hidden
                />
                {href === "/" && unread > 0 ? (
                  <span
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-app-primary ring-2 ring-app-surface"
                    aria-label={`${unread} notificaciones sin leer`}
                  />
                ) : null}
              </span>
              <span className="max-w-[4.75rem] truncate pt-px">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
