"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";
import { initialsFromDisplayName } from "@/lib/user-display";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: { message?: string } };
    if (typeof j?.error?.message === "string") return j.error.message;
  } catch {
    /* ignore */
  }
  return "No se pudo guardar. Probá de nuevo.";
}

export function EditProfileClient() {
  const router = useRouter();
  const { status, update } = useSession();
  const { updateProfile } = useAppState();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/me/profile");
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(await readApiError(res));
          }
          return;
        }
        const data = (await res.json()) as {
          profile: {
            name: string | null;
            username: string | null;
            image: string | null;
          };
        };
        if (cancelled) return;
        const { profile } = data;
        setDisplayName(profile.name?.trim() ?? "");
        setUsername(profile.username ?? "");
        setAvatarUrl(profile.image?.trim() ?? "");
      } catch {
        if (!cancelled) setLoadError("Error de red. Probá de nuevo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const previewInitials = useMemo(
    () => initialsFromDisplayName(displayName.trim() || "Usuario"),
    [displayName],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const dn = displayName.trim();
      if (dn.length < 2) {
        setError("El nombre debe tener al menos 2 caracteres.");
        return;
      }
      const normalized = normalizeUsername(username);
      const uErr = validateUsernameFormat(normalized);
      if (uErr) {
        setError(uErr);
        return;
      }
      let image: string | null = avatarUrl.trim();
      if (image) {
        try {
          const u = new URL(image);
          if (u.protocol !== "http:" && u.protocol !== "https:") {
            setError("La imagen debe ser una URL http o https.");
            return;
          }
        } catch {
          setError("La imagen debe ser una URL válida.");
          return;
        }
      } else {
        image = null;
      }

      setSaving(true);
      try {
        const res = await fetch("/api/me/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dn,
            username: normalized,
            image,
          }),
        });
        if (!res.ok) {
          setError(await readApiError(res));
          return;
        }
        updateProfile({
          displayName: dn,
          username: normalized,
          avatarUrl: image,
        });
        await update();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("prodemix_profile_ok", "1");
        }
        router.push("/perfil");
        router.refresh();
      } catch {
        setError("Error de red. Probá de nuevo.");
      } finally {
        setSaving(false);
      }
    },
    [avatarUrl, displayName, router, update, updateProfile, username],
  );

  const showImg =
    avatarUrl.trim() && !imgError && /^https?:\/\//i.test(avatarUrl.trim());

  if (status === "loading" || loading) {
    return (
      <div className="pb-6">
        <p className="text-[13px] text-app-muted">Cargando perfil…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pb-6 space-y-3">
        <p className="text-[13px] text-red-700" role="alert">
          {loadError}
        </p>
        <button
          type="button"
          className="text-[12px] font-semibold text-app-primary underline"
          onClick={() => router.refresh()}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <Link
        href="/perfil"
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Perfil
      </Link>

      <header className={pageHeader}>
        <p className={pageEyebrow}>Cuenta</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Editar perfil</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-muted">
          Los datos se guardan en tu cuenta.
        </p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        <div className="flex justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
            {showImg ?
              // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias del usuario
              <img
                src={avatarUrl.trim()}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            : (
              <div className="flex h-full w-full items-center justify-center bg-app-text text-xl font-bold text-app-surface">
                {previewInitials}
              </div>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            URL de imagen
          </span>
          <input
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value);
              setImgError(false);
            }}
            type="url"
            inputMode="url"
            autoComplete="photo"
            placeholder="https://…"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
          <span className="mt-1 block text-[10px] text-app-muted">
            Enlace a una imagen cuadrada (http o https). Si falla la carga, se
            muestran iniciales.
          </span>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Nombre visible
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Usuario
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 font-mono text-[14px] text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
          <span className="mt-1 block text-[10px] text-app-muted">
            Entre 3 y 30 caracteres: letras minúsculas, números y guión bajo
            (_). Debe ser único.
          </span>
        </label>

        {error ?
          <p className="text-[12px] font-medium text-red-600" role="alert">
            {error}
          </p>
        : null}

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
