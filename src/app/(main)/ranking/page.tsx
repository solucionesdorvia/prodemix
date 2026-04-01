import type { Metadata } from "next";

import { RankingScreen } from "@/components/ranking/RankingScreen";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Tabla por fecha, global, torneo o contactos. Top 10. Pleno 3 pts, signo 1 pt.",
};

export default function RankingPage() {
  return <RankingScreen />;
}
