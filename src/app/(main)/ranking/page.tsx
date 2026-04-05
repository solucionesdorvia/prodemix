import type { Metadata } from "next";
import { Suspense } from "react";

import { RankingScreen } from "@/components/ranking/RankingScreen";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Tabla por fecha, global, torneo o contactos. Top 10. Pleno 3 pts, signo 1 pt.",
};

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-[13px] text-app-muted">
          Cargando ranking…
        </p>
      }
    >
      <RankingScreen />
    </Suspense>
  );
}
