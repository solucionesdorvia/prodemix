import type { Metadata } from "next";

import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "ProdeMix · Primera futsal. Prodes por fecha: marcador exacto, ranking y premios.",
};

export default function HomePage() {
  return <HomePageClient />;
}
