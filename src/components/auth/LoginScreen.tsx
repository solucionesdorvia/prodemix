"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState<
    "idle" | "sent" | "error"
  >("idle");

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const handleGoogle = async () => {
    setBusy(true);
    setEmailFeedback("idle");
    try {
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setEmailFeedback("idle");
    try {
      const res = await signIn("nodemailer", {
        email: trimmed,
        redirect: false,
        callbackUrl: "/",
      });
      if (res?.error) setEmailFeedback("error");
      else setEmailFeedback("sent");
    } catch {
      setEmailFeedback("error");
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

  const showEmail =
    typeof process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "string" ?
      process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED === "1"
    : true;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Iniciar sesión</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Creá tu cuenta al entrar por primera vez. Sesión segura en el
          servidor.
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

        {showEmail ? (
          <>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-app-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                <span className="bg-app-bg px-2 text-app-muted">o</span>
              </div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-app-muted">
                  Enlace por correo
                </span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
                  placeholder="vos@ejemplo.com"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                Enviar enlace mágico
              </button>
              {emailFeedback === "sent" ? (
                <p className="text-center text-[11px] font-medium text-emerald-700">
                  Revisá tu correo: te enviamos un enlace para entrar.
                </p>
              ) : null}
              {emailFeedback === "error" ? (
                <p className="text-center text-[11px] font-medium text-red-700">
                  No pudimos enviar el correo. Verificá la dirección o probá con
                  Google.
                </p>
              ) : null}
            </form>
          </>
        ) : null}

        <p className="text-center text-[10px] leading-snug text-app-muted">
          Tus pronósticos siguen guardados en este dispositivo (localmente),
          vinculados a tu cuenta.
        </p>
      </div>
    </div>
  );
}
