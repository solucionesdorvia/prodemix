"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [credMode, setCredMode] = useState<"login" | "register">("login");
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credConfirm, setCredConfirm] = useState("");
  const [credError, setCredError] = useState<string | null>(null);

  /** Autenticado sin username: ir al onboarding, no a `/` (AuthGate te devolvería igual). */
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") return;
    if (session?.user?.username) {
      router.replace("/");
    } else {
      router.replace("/onboarding/username");
    }
  }, [status, session?.user?.username, router]);

  const handleGoogle = async () => {
    setBusy(true);
    setCredError(null);
    try {
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = credEmail.trim().toLowerCase();
    if (!email || !credPassword) return;
    setCredError(null);
    setBusy(true);
    try {
      if (credMode === "register") {
        if (credPassword !== credConfirm) {
          setCredError("Las contraseñas no coinciden.");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: credPassword }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        if (!res.ok) {
          setCredError(
            typeof data.error?.message === "string" ?
              data.error.message
            : "No se pudo crear la cuenta.",
          );
          return;
        }
        const signRes = await signIn("credentials", {
          email,
          password: credPassword,
          redirect: false,
          callbackUrl: "/",
        });
        if (signRes?.error) {
          setCredError(
            "Cuenta creada. Iniciá sesión con email y contraseña.",
          );
        } else {
          router.replace("/");
        }
      } else {
        const signRes = await signIn("credentials", {
          email,
          password: credPassword,
          redirect: false,
          callbackUrl: "/",
        });
        if (signRes?.error) {
          setCredError("Email o contraseña incorrectos.");
        } else {
          router.replace("/");
        }
      }
    } catch {
      setCredError("Algo salió mal. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
        <p className="text-center text-[13px] text-app-muted">Cargando…</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Iniciar sesión</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Creá tu cuenta con email y contraseña, o entrá con Google. Sesión
          segura en el servidor.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        <button
          type="button"
          disabled={busy}
          onClick={handleGoogle}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface text-[14px] font-semibold text-app-text shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-app-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
            <span className="bg-app-bg px-2 text-app-muted">o</span>
          </div>
        </div>

        <div className="rounded-xl border border-app-border bg-app-surface/80 p-4 shadow-sm">
          <div className="mb-3 flex gap-2 rounded-lg bg-app-bg p-1">
            <button
              type="button"
              onClick={() => {
                setCredMode("login");
                setCredError(null);
              }}
              className={cn(
                "flex-1 rounded-md py-2 text-[12px] font-semibold transition",
                credMode === "login" ?
                  "bg-app-surface text-app-text shadow-sm"
                : "text-app-muted hover:text-app-text",
              )}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setCredMode("register");
                setCredError(null);
              }}
              className={cn(
                "flex-1 rounded-md py-2 text-[12px] font-semibold transition",
                credMode === "register" ?
                  "bg-app-surface text-app-text shadow-sm"
                : "text-app-muted hover:text-app-text",
              )}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleCredentials} className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-app-muted">
                Email
              </span>
              <input
                type="email"
                name="credEmail"
                value={credEmail}
                onChange={(e) => setCredEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
                placeholder="vos@ejemplo.com"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-app-muted">
                Contraseña
              </span>
              <input
                type="password"
                name="credPassword"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                autoComplete={
                  credMode === "register" ? "new-password" : "current-password"
                }
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            {credMode === "register" ? (
              <label className="block">
                <span className="text-[11px] font-semibold text-app-muted">
                  Repetir contraseña
                </span>
                <input
                  type="password"
                  name="credConfirm"
                  value={credConfirm}
                  onChange={(e) => setCredConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
                  placeholder="Misma contraseña"
                />
              </label>
            ) : null}
            {credError ? (
              <p className="text-center text-[11px] font-medium text-red-700">
                {credError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {credMode === "register" ? "Crear cuenta" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] leading-snug text-app-muted">
          Tus pronósticos siguen guardados en este dispositivo (localmente),
          vinculados a tu cuenta.
        </p>
      </div>
    </div>
  );
}
