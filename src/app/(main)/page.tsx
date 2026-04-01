import type { Metadata } from "next";

import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "ProdeMix · Primera. Pools públicos por fecha: pronosticá marcadores y competí por ranking.",
};

export default function HomePage() {
  return <HomePageClient />;
}
