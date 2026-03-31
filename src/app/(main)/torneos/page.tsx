import type { Metadata } from "next";

import { TorneosScreen } from "@/components/torneos/TorneosScreen";

export const metadata: Metadata = {
  title: "Torneos",
  description:
    "Competiciones Primera por fecha. Elegí torneo, abrí la jornada y entrá al pool público.",
};

export default function TorneosPage() {
  return <TorneosScreen />;
}
