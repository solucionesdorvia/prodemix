"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState, EmptyStateButtonLink } from "@/components/ui/EmptyState";
import { pageEyebrow, pageHeader, pageTitle } from "@/lib/ui-styles";
import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

type ProdeAjustesClientProps = {
  prodeId: string;
};

export function ProdeAjustesClient({ prodeId }: ProdeAjustesClientProps) {
  const router = useRouter();
  const { user, state, updateProdeName } = useAppState();
  const prode = useMemo(
    () => state.prodes.find((p) => p.id === prodeId),
    [state.prodes, prodeId],
  );
  const isOwner = prode?.ownerId === user.id;
  const [name, setName] = useState(prode?.name ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prode) setName(prode.name);
  }, [prode]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        setError("El nombre debe tener al menos 2 caracteres.");
        return;
      }
      updateProdeName(prodeId, trimmed);
      router.push(`/prodes/${encodeURIComponent(prodeId)}`);
    },
    [name, prodeId, router, updateProdeName],
  );

  if (!prode) {
    return (
      <div className="pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Inicio
        </Link>
        <EmptyState
          className="mt-4"
          variant="soft"
          layout="horizontal"
          title="Prode no encontrado"
          description="No hay datos de este grupo en este dispositivo."
        >
          <EmptyStateButtonLink href="/">Ir al inicio</EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="pb-4">
        <Link
          href={`/prodes/${encodeURIComponent(prodeId)}`}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Volver al prode
        </Link>
        <EmptyState
          className="mt-4"
          variant="soft"
          layout="horizontal"
          title="Sin permisos"
          description="Solo el creador del grupo puede cambiar el nombre."
        >
          <EmptyStateButtonLink href={`/prodes/${encodeURIComponent(prodeId)}`}>
            Volver
          </EmptyStateButtonLink>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <Link
        href={`/prodes/${encodeURIComponent(prodeId)}`}
        className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-app-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Prode
      </Link>

      <header className={pageHeader}>
        <p className={pageEyebrow}>Ajustes</p>
        <h1 className={cn(pageTitle, "mt-0.5")}>Nombre del grupo</h1>
        <p className="mt-1 text-[11px] text-app-muted">
          Cambiá cómo se muestra este prode en tu lista y en las invitaciones.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-app-muted">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-[14px] text-app-text outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
          />
        </label>
        {error ?
          <p className="text-[12px] font-medium text-red-600" role="alert">
            {error}
          </p>
        : null}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-app-primary text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
