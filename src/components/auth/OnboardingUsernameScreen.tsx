"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

export function OnboardingUsernameScreen() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (session?.user?.username) {
      router.replace("/");
      return;
    }
    /** Misma reconciliación que AuthGate: DB con username, sesión vieja tras F5. */
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me/profile");
        if (cancelled) return;
        if (!res.ok) return;
        const data = (await res.json()) as {
          profile?: { username?: string | null };
        };
        if (data.profile?.username?.trim()) {
          await update();
          if (!cancelled) router.replace("/");
        }
      } catch {
        /* ignorar */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.username, router, update]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          await signOut({ callbackUrl: "/login" });
          return;
        }
        if (
          res.status === 409 &&
          typeof data.error === "string" &&
          data.error.includes("ya está definido")
        ) {
          await update();
          router.replace("/");
          return;
        }
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      await update();
      router.replace("/");
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
        <p className="text-center text-[13px] text-app-muted">Cargando…</p>
        <p className="mt-6 text-center text-[11px] text-app-muted">
          Si quedás acá, probá{" "}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="font-semibold text-app-primary underline underline-offset-2"
          >
            cerrar sesión
          </button>{" "}
          e iniciar de nuevo.
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4">
        <p className="text-center text-[13px] text-app-muted">
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }

  if (session?.user?.username) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className={pageHeader}>
        <p className={pageEyebrow}>ProdeMix</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Elegí tu usuario</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Este nombre te identifica en la app. Solo podés definirlo una vez.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Nombre de usuario
          </span>
          <input
            type="text"
            name="username"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="username"
            required
            maxLength={64}
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none ring-app-primary/20 placeholder:text-app-muted focus:border-app-primary focus:ring-2"
            placeholder="tu_usuario"
          />
        </label>
        <p className="text-[10px] leading-snug text-app-muted">
          3–30 caracteres (a–z, números, guión bajo). Podés escribir con tildes,
          ñ o espacios: los normalizamos al guardar.
        </p>
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          Continuar
        </button>
        {error ? (
          <p className="text-center text-[11px] font-medium text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      <p className="mt-8 text-center text-[11px] text-app-muted">
        ¿Querés entrar con otra cuenta?{" "}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="font-semibold text-app-primary underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </p>
    </div>
  );
}
