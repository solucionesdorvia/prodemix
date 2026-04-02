"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";

const SIDEBAR: { href: string; label: string }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tournaments", label: "Torneos" },
  { href: "/admin/prodes", label: "Prodes" },
  { href: "/admin/matches", label: "Partidos" },
  { href: "/admin/teams", label: "Equipos" },
  { href: "/admin/results", label: "Resultados" },
  { href: "/admin/rankings", label: "Rankings" },
  { href: "/admin/users", label: "Usuarios" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-neutral-100 text-neutral-900">
      <aside className="flex w-52 shrink-0 flex-col border-r border-neutral-300 bg-white">
        <div className="border-b border-neutral-200 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            ProdeMix
          </p>
          <p className="text-[13px] font-semibold text-neutral-900">Administración</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {SIDEBAR.map(({ href, label }) => {
            const active =
              href === "/admin" ?
                pathname === "/admin"
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[13px] font-medium",
                  active ?
                    "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-2 text-[11px] text-neutral-500">
          <Link href="/" className="block rounded px-2 py-1 text-neutral-700 hover:bg-neutral-100">
            ← Volver a la app
          </Link>
          <button
            type="button"
            className="mt-1 w-full rounded px-2 py-1 text-left text-neutral-700 hover:bg-neutral-100"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-neutral-300 bg-white px-4 py-2">
          <span className="text-[12px] text-neutral-600">
            Panel interno · operación diaria
          </span>
        </header>
        <main className="min-h-0 flex-1 overflow-auto px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
