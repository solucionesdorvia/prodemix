import type { Metadata } from "next";

import { OfficialProdesClient } from "@/components/prodes/OfficialProdesClient";

export const metadata: Metadata = {
  title: "Prodes oficiales",
  description:
    "Competencias oficiales de futsal en Argentina. Pronosticá y competí por ranking.",
};

export default function ProdesPage() {
  return <OfficialProdesClient />;
}
