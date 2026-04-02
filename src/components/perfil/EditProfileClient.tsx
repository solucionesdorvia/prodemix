"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
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

function canShowImage(src: string | null): boolean {
  if (!src?.trim()) return false;
  const s = src.trim();
  return (
    /^https?:\/\//i.test(s) || s.startsWith("data:image/jpeg") ||
    s.startsWith("data:image/png") ||
    s.startsWith("data:image/webp")
  );
}

export function EditProfileClient() {
  const router = useRouter();
  const { status, update } = useSession();
  const { updateProfile } = useAppState();

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
        setAvatarUrl(profile.image?.trim() ? profile.image.trim() : null);
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

  const showImg = Boolean(avatarUrl && canShowImage(avatarUrl) && !imgError);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setImgError(false);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/me/avatar", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!res.ok) {
          setError(await readApiError(res));
          return;
        }
        const data = (await res.json()) as { image?: string };
        const next = data.image ?? null;
        setAvatarUrl(next);
        updateProfile({
          displayName: displayName.trim() || "Usuario",
          username: username.trim(),
          avatarUrl: next,
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
        setUploading(false);
      }
    },
    [displayName, router, update, updateProfile, username],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      void uploadFile(f);
    },
    [uploadFile],
  );

  const handleClearPhoto = useCallback(async () => {
    setError(null);
    setClearing(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      setAvatarUrl(null);
      setImgError(false);
      updateProfile({
        displayName: displayName.trim() || "Usuario",
        username: username.trim(),
        avatarUrl: null,
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
      setClearing(false);
    }
  }, [displayName, router, update, updateProfile, username]);

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
          Podés cambiar solo la foto. Nombre y usuario no se modifican acá.
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <div className="flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
            {showImg ?
              // eslint-disable-next-line @next/next/no-img-element -- data URL o https
              <img
                src={avatarUrl!}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            : (
              <div className="flex h-full w-full items-center justify-center bg-app-text text-2xl font-bold text-app-surface">
                {previewInitials}
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={uploading || clearing}
            onClick={() => fileRef.current?.click()}
            className="flex h-11 items-center justify-center rounded-xl bg-app-primary px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "Subiendo…" : "Elegir foto"}
          </button>
          {showImg ?
            <button
              type="button"
              disabled={uploading || clearing}
              onClick={() => void handleClearPhoto()}
              className="flex h-11 items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 text-[14px] font-semibold text-app-text shadow-sm transition hover:bg-app-bg disabled:opacity-60"
            >
              {clearing ? "Quitando…" : "Quitar foto"}
            </button>
          : null}
        </div>

        <div className="rounded-xl border border-app-border bg-app-bg/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Nombre visible
          </p>
          <p className="mt-1 text-[15px] font-medium text-app-text">
            {displayName || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-app-border bg-app-bg/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Usuario
          </p>
          <p className="mt-1 font-mono text-[15px] font-medium text-app-primary">
            {username ? `@${username}` : "—"}
          </p>
        </div>

        {error ?
          <p className="text-[12px] font-medium text-red-600" role="alert">
            {error}
          </p>
        : null}

        <p className="text-center text-[10px] leading-snug text-app-muted">
          JPEG, PNG o WebP · máx. 512 KB
        </p>
      </div>
    </div>
  );
}
