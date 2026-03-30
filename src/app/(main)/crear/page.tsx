import type { Metadata } from "next";
import { Suspense } from "react";

import { CrearProdeClient } from "@/components/crear/CrearProdeClient";

export const metadata: Metadata = {
  title: "Crear",
  description:
    "Armá un prode combinando partidos de diferentes torneos y ligas.",
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
