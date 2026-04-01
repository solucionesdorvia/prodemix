"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

import { useAuth } from "./AuthProvider";

export function LoginScreen() {
  const { hydrated, loggedIn, login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (loggedIn) router.replace("/");
  }, [hydrated, loggedIn, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    login();
    router.replace("/");
  };

  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
        <p className="text-center text-[13px] text-app-muted">Cargando…</p>
      </div>
    );
  }

  if (loggedIn) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Iniciar sesión</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Accedé con tu cuenta para pronosticar y ver el ranking.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Correo (opcional)
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
            placeholder="vos@ejemplo.com"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Contraseña (opcional)
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
            placeholder="••••••••"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          Entrar
        </button>
        <p className="text-center text-[10px] leading-snug text-app-muted">
          Tus pronósticos y preferencias se guardan en este dispositivo.
        </p>
      </form>
    </div>
  );
}
