import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getMaintenanceEndLabel,
  isMaintenanceModeActive,
} from "@/lib/maintenance-mode";

export const metadata: Metadata = {
  title: "Mantenimiento",
  robots: { index: false, follow: false },
};

export default function MantenimientoPage() {
  if (!isMaintenanceModeActive()) {
    redirect("/");
  }

  const cuando = getMaintenanceEndLabel();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 select-none">
      <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface px-6 py-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-app-muted">
          ProdeMix
        </p>
        <h1 className="mt-2 text-[22px] font-bold leading-tight text-app-text">
          Estamos actualizando la app
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-app-muted">
          Por ahora no podés usar ProdeMix: pantallas, login y APIs están
          deshabilitados hasta el horario indicado abajo.
        </p>
        <p className="mt-3 rounded-xl bg-app-bg/80 px-3 py-2.5 text-[13px] font-semibold text-app-text ring-1 ring-app-border-subtle">
          Volvemos a las{" "}
          <span className="text-app-primary">{cuando}</span>
        </p>
      </div>
    </main>
  );
}
