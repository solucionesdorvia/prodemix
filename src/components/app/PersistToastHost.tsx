"use client";

import { AlertTriangle, Check, X } from "lucide-react";

import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

export function PersistToastHost() {
  const {
    persistSaveError,
    persistSuccessMessage,
    dismissPersistFeedback,
    retryPersist,
  } = useAppState();

  const errorText =
    persistSaveError === "quota" ?
      "No hay espacio para guardar. Liberá datos del navegador o reintentá."
    : persistSaveError === "unknown" ?
      "No se pudo guardar en este dispositivo. Reintentá."
    : null;

  if (!errorText && !persistSuccessMessage) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] flex justify-center px-3"
      role="status"
      aria-live="polite"
    >
      {errorText ?
        <div
          className={cn(
            "pointer-events-auto flex max-w-md items-start gap-2 rounded-xl border border-red-200/90 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-950 shadow-lg",
          )}
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-red-700"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1 leading-snug">
            <p>{errorText}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-red-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
                onClick={() => retryPersist()}
              >
                Reintentar
              </button>
              <button
                type="button"
                className="rounded-md border border-red-300/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-900 hover:bg-red-100/80"
                onClick={() => dismissPersistFeedback()}
              >
                Cerrar
              </button>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-0.5 text-red-700 hover:bg-red-100"
            aria-label="Cerrar aviso"
            onClick={() => dismissPersistFeedback()}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      : (
        <div
          className={cn(
            "pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-950 shadow-lg",
          )}
        >
          <Check
            className="h-4 w-4 shrink-0 text-emerald-700"
            strokeWidth={2}
            aria-hidden
          />
          <span>{persistSuccessMessage}</span>
          <button
            type="button"
            className="ml-1 shrink-0 rounded-md p-0.5 text-emerald-800 hover:bg-emerald-100"
            aria-label="Cerrar"
            onClick={() => dismissPersistFeedback()}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
