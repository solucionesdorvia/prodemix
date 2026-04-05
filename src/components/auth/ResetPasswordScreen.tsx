"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenFromUrl) {
      setError(
        "Falta el enlace de recuperación. Pedí uno nuevo desde «Olvidé mi contraseña».",
      );
    }
  }, [tokenFromUrl]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tokenFromUrl) return;
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(
          typeof data.error?.message === "string" ?
            data.error.message
          : "No se pudo actualizar la contraseña.",
        );
        return;
      }
      router.replace("/login?reset=ok");
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
        <h1 className={cn(pageTitle, "mt-0.5")}>Nueva contraseña</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Elegí una contraseña segura para tu cuenta.
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

        <form
          onSubmit={(e) => void submit(e)}
          className="rounded-xl border border-app-border bg-app-surface/80 p-4 shadow-sm"
        >
          <label className="block">
            <span className="text-[11px] font-semibold text-app-muted">
              Nueva contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={!tokenFromUrl}
              className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 focus:border-app-primary focus:ring-2 disabled:opacity-50"
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[11px] font-semibold text-app-muted">
              Repetir contraseña
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={!tokenFromUrl}
              className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 focus:border-app-primary focus:ring-2 disabled:opacity-50"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !tokenFromUrl}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Guardando…" : "Guardar contraseña"}
          </button>
          <Link
            href="/login"
            className="mt-4 block text-center text-[12px] font-semibold text-app-muted hover:text-app-text"
          >
            Volver al inicio de sesión
          </Link>
        </form>
      </div>
    </div>
  );
}
