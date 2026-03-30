import type { Metadata } from "next";

import { RankingScreen } from "@/components/ranking/RankingScreen";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Ranking global, entre amigos y por liga. Plenos y resultados con puntos claros.",
};

export default function RankingPage() {
  return <RankingScreen />;
}
