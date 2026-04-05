"use client";

import Link from "next/link";
import { useState } from "react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(
          typeof data.error?.message === "string" ?
            data.error.message
          : "No se pudo enviar el correo. Probá de nuevo.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Algo salió mal. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Recuperar contraseña</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Te enviamos un enlace por correo para elegir una contraseña nueva.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        {error ?
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-medium text-red-800"
            role="alert"
          >
            {error}
          </p>
        : null}

        {done ?
          <div className="rounded-xl border border-app-border bg-app-surface/80 p-4 shadow-sm">
            <p className="text-[13px] leading-relaxed text-app-text">
              Si hay una cuenta con ese correo, revisá tu bandeja de entrada (y
              spam). El enlace caduca en una hora.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex text-[13px] font-semibold text-app-primary hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        : (
          <form
            onSubmit={(e) => void submit(e)}
            className="rounded-xl border border-app-border bg-app-surface/80 p-4 shadow-sm"
          >
            <label className="block">
              <span className="text-[11px] font-semibold text-app-muted">
                Email de tu cuenta
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 focus:border-app-primary focus:ring-2"
                placeholder="vos@ejemplo.com"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
            <Link
              href="/login"
              className="mt-4 block text-center text-[12px] font-semibold text-app-muted hover:text-app-text"
            >
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
