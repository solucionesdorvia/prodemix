import type { Metadata } from "next";

import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "ProdeMix · Futsal Argentina. Prodes oficiales, marcador exacto y ranking.",
};

export default function HomePage() {
  return <HomePageClient />;
}
