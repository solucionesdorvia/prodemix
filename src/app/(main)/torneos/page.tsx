import type { Metadata } from "next";

import { TorneosScreen } from "@/components/torneos/TorneosScreen";

export const metadata: Metadata = {
  title: "Torneos",
  description:
    "Primera AFA: explorá por fecha o por competición, jugá gratis y seguí el cierre.",
};

export default function TorneosPage() {
  return <TorneosScreen />;
}
