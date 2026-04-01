"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { initialsFromDisplayName } from "@/lib/user-display";
import { normalizeUsername } from "@/state/user-profile";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

export function EditProfileClient() {
  const router = useRouter();
  const { user, updateProfile } = useAppState();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const previewInitials = useMemo(
    () => initialsFromDisplayName(displayName.trim() || user.displayName),
    [displayName, user.displayName],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const dn = displayName.trim();
      const uRaw = normalizeUsername(username);
      if (dn.length < 2) {
        setError("El nombre debe tener al menos 2 letras.");
        return;
      }
      if (uRaw.length < 3) {
        setError("El usuario debe tener al menos 3 caracteres válidos.");
        return;
      }
      let avatar: string | null = avatarUrl.trim();
      if (avatar) {
        try {
          // eslint-disable-next-line no-new -- validación de URL
          new URL(avatar);
        } catch {
          setError("La imagen debe ser una URL válida (https://…).");
          return;
        }
      } else {
        avatar = null;
      }
      updateProfile({
        displayName: dn,
        username: uRaw,
        avatarUrl: avatar,
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("prodemix_profile_ok", "1");
      }
      router.push("/perfil");
    },
    [avatarUrl, displayName, router, updateProfile, username],
  );

  const showImg =
    avatarUrl.trim() && !imgError && /^https?:\/\//i.test(avatarUrl.trim());

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
      </header>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            Pegá un enlace a una imagen cuadrada. Si falla, se muestran tus
            iniciales.
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
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
          <span className="mt-1 block text-[10px] text-app-muted">
            Letras, números, punto y guión. Se guarda en minúsculas.
          </span>
        </label>

        {error ?
          <p className="text-[12px] font-medium text-red-600" role="alert">
            {error}
          </p>
        : null}

        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
