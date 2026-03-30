import type { Metadata } from "next";

import { TorneosScreen } from "@/components/torneos/TorneosScreen";

export const metadata: Metadata = {
  title: "Torneos",
  description:
    "Explorá futsal, fútbol 8, amateur, torneos barriales y ligas de clubes en Argentina.",
};

export default function TorneosPage() {
  return <TorneosScreen />;
}
