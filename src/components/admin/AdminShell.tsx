"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/prodes", label: "Prodes" },
  { href: "/admin/resultados", label: "Resultados" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-300 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
            Admin
          </span>
          <nav className="flex flex-wrap gap-1 text-[12px] font-semibold">
            {LINKS.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded px-2 py-1",
                    active ?
                      "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-200",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <Link href="/" className="text-blue-700 hover:underline">
              App
            </Link>
            <button
              type="button"
              className="text-neutral-600 underline"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-4">{children}</main>
    </div>
  );
}
