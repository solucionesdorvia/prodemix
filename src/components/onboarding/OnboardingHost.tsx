"use client";

import { ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAppState } from "@/state/app-state";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Bienvení a ProdeMix",
    body:
      "Ligas, torneos barriales y tu grupo en un solo lugar. Seguí lo que te importa, armá prodes y medí quién la tiene más clara.",
  },
  {
    title: "Seguí torneos",
    body:
      "En Torneos elegí los que querés tener cerca. Sin ruido: solo aparecen en tu inicio cuando vos querés.",
  },
  {
    title: "Creá prodes y cargá el resultado",
    body:
      "Sumá partidos al prode, invitá con código y pronosticá el marcador exacto. Ahí se define la pelea.",
  },
  {
    title: "Competí en el ranking",
    body:
      "Sumás puntos con tus aciertos y competís con tu gente y en el ranking general. Nada de humo: solo resultados.",
  },
] as const;

const LAST_INDEX = STEPS.length - 1;

export function OnboardingHost() {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, state, completeOnboarding } = useAppState();
  const [step, setStep] = useState(0);

  const onAdminRoute = pathname.startsWith("/admin");

  const open =
    hydrated &&
    state.onboardingCompletedAt === null &&
    !onAdminRoute;

  const onSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const finishAndGo = useCallback(
    (path: string) => {
      completeOnboarding();
      router.push(path);
    },
    [completeOnboarding, router],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSkip]);

  if (!open) return null;

  const isLast = step === LAST_INDEX;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <button
        type="button"
        onClick={onSkip}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[6px] transition-opacity"
        aria-label="Cerrar introducción"
      />

      <div className="relative z-10 mx-auto w-full max-w-md px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_24px_48px_-12px_rgba(15,23,42,0.35)]">
          <div className="relative border-b border-app-border-subtle bg-gradient-to-br from-slate-50/90 via-app-surface to-app-surface px-4 pb-3 pt-3">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-app-muted transition hover:bg-black/[0.04] hover:text-app-text"
              >
                Omitir
              </button>
            </div>
            <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Paso">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i === step
                      ? "bg-app-primary"
                      : i < step
                        ? "bg-app-primary/35"
                        : "bg-app-border",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-4">
            <h2
              id="onboarding-title"
              className="text-[17px] font-semibold leading-snug tracking-tight text-app-text"
            >
              {STEPS[step].title}
            </h2>
            <p
              id="onboarding-desc"
              className="mt-2 text-[13px] leading-relaxed text-app-muted"
            >
              {STEPS[step].body}
            </p>

            {isLast ? (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-medium text-app-text">
                  ¿Por dónde arrancás?
                </p>
                <button
                  type="button"
                  onClick={() => finishAndGo("/prodes")}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-app-primary text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(15,23,42,0.08)] transition hover:bg-blue-700 active:scale-[0.99]"
                >
                  Ver prodes oficiales
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => finishAndGo("/")}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-app-border bg-app-bg text-[13px] font-semibold text-app-text transition hover:bg-app-surface active:scale-[0.99]"
                >
                  Ir al inicio
                </button>
                <button
                  type="button"
                  onClick={() => finishAndGo("/ranking")}
                  className="w-full py-2 text-[12px] font-semibold text-app-muted transition hover:text-app-text"
                >
                  Ir al ranking
                </button>
              </div>
            ) : (
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-app-primary px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
