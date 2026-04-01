import type { Metadata } from "next";
import { Suspense } from "react";

import { CrearProdeClient } from "@/components/crear/CrearProdeClient";

export const metadata: Metadata = {
  title: "Prode propio",
  description:
    "Creá un prode privado o mixto (opcional). Los pools públicos por fecha están en Torneos.",
};

export default function CrearPage() {
  return (
    <Suspense
      fallback={
        <p className="pb-4 text-[13px] text-app-muted">Cargando…</p>
      }
    >
      <CrearProdeClient />
    </Suspense>
  );
}
