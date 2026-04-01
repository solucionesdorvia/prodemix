import type { Metadata } from "next";

import { RankingScreen } from "@/components/ranking/RankingScreen";

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Ranking por fecha (pool público), global, torneo y amigos. 3 pts pleno · 1 pt sin pleno.",
};

export default function RankingPage() {
  return <RankingScreen />;
}
